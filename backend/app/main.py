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
        str(_backend_dir / "prisma-query-engine*"),
        str(_backend_dir / "app" / "prisma" / "prisma-query-engine*"),
        "/opt/render/.cache/prisma-python/binaries/**/prisma-query-engine*",
        "/root/.cache/prisma-python/binaries/**/prisma-query-engine*",
        "/tmp/prisma-python/binaries/**/prisma-query-engine*",
    ]
    
    found_binaries = []
    for pattern in search_paths:
        for m in glob.glob(pattern, recursive=True):
            if os.path.isfile(m) and not m.endswith(".py"):
                found_binaries.append(m)
                
    if not found_binaries:
        print("[CellTrace Startup] Query engine missing — executing `python -m prisma py fetch`...")
        try:
            subprocess.run(["python", "-m", "prisma", "py", "fetch"], check=True)
        except Exception as err:
            print(f"[CellTrace Startup] Fetch warning: {err}")
            
        for pattern in search_paths:
            for m in glob.glob(pattern, recursive=True):
                if os.path.isfile(m) and not m.endswith(".py"):
                    found_binaries.append(m)

    if found_binaries:
        src = found_binaries[0]
        print(f"[CellTrace Startup] Found engine binary at: {src}")
        for dest in [_target_bin, _app_prisma_bin]:
            try:
                dest.parent.mkdir(parents=True, exist_ok=True)
                if not dest.exists():
                    shutil.copy2(src, dest)
                os.chmod(dest, 0o755)
                print(f"[CellTrace Startup] Configured engine at {dest} (chmod 755)")
            except Exception as ex:
                print(f"[CellTrace Startup] Copy warning for {dest}: {ex}")
                
        os.environ["PRISMA_QUERY_ENGINE_BINARY"] = str(_target_bin)
        try:
            os.chmod(src, 0o755)
        except Exception:
            pass

_prepare_engine()

# ─── 2. Force Prisma Engine Path ─────────────────────────
import prisma.engine
if hasattr(prisma.engine, "BINARY_PATHS") and _target_bin.exists():
    try:
        prisma.engine.BINARY_PATHS.query_engine = _target_bin
        print(f"[CellTrace Startup] Overrode prisma.engine.BINARY_PATHS.query_engine = {_target_bin}")
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
        _prepare_engine()
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
