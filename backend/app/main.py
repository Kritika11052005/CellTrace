"""CellTrace Backend — Main FastAPI Application"""
import os
import glob
import shutil
import logging
import subprocess
from pathlib import Path
from contextlib import asynccontextmanager

os.environ["PRISMA_PY_DEBUG_GENERATOR"] = "1"

# ─── 1. Prepare Prisma Query Engine Binary BEFORE Prisma Import ──
_backend_dir = Path(__file__).resolve().parent.parent
_target_bin = _backend_dir / "prisma-query-engine-debian-openssl-3.0.x"
_app_prisma_bin = _backend_dir / "app" / "prisma" / "prisma-query-engine-debian-openssl-3.0.x"

def _prepare_engine():
    search_paths = [
        "/opt/render/.cache/prisma-python/binaries/**/prisma-query-engine*",
        "/root/.cache/prisma-python/binaries/**/prisma-query-engine*",
        "/tmp/prisma-python/binaries/**/prisma-query-engine*",
        str(_backend_dir / "prisma-query-engine*"),
        str(_backend_dir / "app" / "prisma" / "prisma-query-engine*"),
    ]
    
    found_binaries = []
    for pattern in search_paths:
        for m in glob.glob(pattern, recursive=True):
            if os.path.isfile(m) and not m.endswith(".py") and os.path.getsize(m) > 1000:
                found_binaries.append(m)
                
    if not found_binaries:
        print("[CellTrace Startup] Query engine missing — executing `python -m prisma py fetch`...")
        try:
            subprocess.run(["python", "-m", "prisma", "py", "fetch"], check=True)
        except Exception as err:
            print(f"[CellTrace Startup] Fetch warning: {err}")
            
        for pattern in search_paths:
            for m in glob.glob(pattern, recursive=True):
                if os.path.isfile(m) and not m.endswith(".py") and os.path.getsize(m) > 1000:
                    found_binaries.append(m)

    if found_binaries:
        src = found_binaries[0]
        print(f"[CellTrace Startup] Valid engine binary found at ({os.path.getsize(src)} bytes): {src}")
        
        try:
            os.chmod(src, 0o755)
        except Exception:
            pass

        for dest in [_target_bin, _app_prisma_bin]:
            try:
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dest)
                os.chmod(dest, 0o755)
                print(f"[CellTrace Startup] Force-copied engine to {dest} ({os.path.getsize(dest)} bytes, chmod 755)")
            except Exception as ex:
                print(f"[CellTrace Startup] Copy warning for {dest}: {ex}")
                
        os.environ["PRISMA_QUERY_ENGINE_BINARY"] = str(src)
        print(f"[CellTrace Startup] Locked PRISMA_QUERY_ENGINE_BINARY -> {src}")
        return src
    return None

_active_bin_path = _prepare_engine()

# ─── 2. Override Prisma Engine Binary Paths Object ───────
import prisma.engine
if hasattr(prisma.engine, "BINARY_PATHS") and _active_bin_path:
    try:
        prisma.engine.BINARY_PATHS.query_engine = Path(_active_bin_path)
        print(f"[CellTrace Startup] Updated BINARY_PATHS.query_engine -> {_active_bin_path}")
    except Exception as ex:
        print(f"[CellTrace Startup] BINARY_PATHS override warning: {ex}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.prisma import Prisma

from app.config import settings
from app.services.ml_service import ml_service
from app.routes import health, auth, batteries, predictions, chain, verify

# ─── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("celltrace")

# ─── Prisma Client (singleton) ───────────────────────────
db = Prisma()


# ─── Lifespan ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    global db
    logger.info("Connecting to Neon PostgreSQL via Prisma…")
    try:
        await db.connect()
    except Exception as e:
        logger.warning(f"Prisma connection error: {e}. Re-executing _prepare_engine()...")
        fresh_bin = _prepare_engine()
        if fresh_bin and hasattr(prisma.engine, "BINARY_PATHS"):
            prisma.engine.BINARY_PATHS.query_engine = Path(fresh_bin)
        db = Prisma()
        await db.connect()
    logger.info("Database connected ✓")

    logger.info("Loading ML models…")
    ml_service.load_models()
    logger.info("ML models loaded ✓")

    app.state.db = db
    yield

    # Shutdown
    logger.info("Disconnecting database…")
    await db.disconnect()
    logger.info("Shutdown complete ✓")


# ─── App ──────────────────────────────────────────────────
app = FastAPI(
    title="CellTrace API",
    description="On-Chain Battery Integrity & Machine Learning Telemetry Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS Middleware ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ──────────────────────────────────────
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(batteries.router, prefix="/api/batteries", tags=["Batteries"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(chain.router, prefix="/api/chain", tags=["Blockchain"])
app.include_router(verify.router, prefix="/api/verify", tags=["Verify"])


@app.get("/")
def root():
    return {
        "message": "CellTrace API is online",
        "docs": "/docs",
        "health": "/api/health",
        "version": "1.0.0",
    }
