"""CellTrace Backend — Main FastAPI Application"""
import os
import glob
import shutil
import logging
import subprocess
from pathlib import Path
from contextlib import asynccontextmanager

os.environ["PRISMA_PY_DEBUG_GENERATOR"] = "1"

# ─── Self-Healing Prisma Engine Bootstrapper ──────────────
def setup_prisma_binary():
    backend_dir = Path(__file__).resolve().parent.parent
    target_names = [
        "prisma-query-engine-debian-openssl-3.0.x",
        "prisma-query-engine",
    ]
    
    search_paths = [
        str(backend_dir / "prisma-query-engine*"),
        str(backend_dir / "app" / "prisma" / "prisma-query-engine*"),
        "/opt/render/.cache/prisma-python/binaries/**/prisma-query-engine*",
        "/root/.cache/prisma-python/binaries/**/prisma-query-engine*",
        "/tmp/prisma-python/binaries/**/prisma-query-engine*",
    ]
    
    found_binaries = []
    for pattern in search_paths:
        matches = glob.glob(pattern, recursive=True)
        for m in matches:
            if os.path.isfile(m) and not m.endswith(".py"):
                found_binaries.append(m)
                
    if not found_binaries:
        print("[CellTrace Startup] Prisma query engine missing — running `python -m prisma py fetch`...")
        try:
            subprocess.run(["python", "-m", "prisma", "py", "fetch"], check=True)
        except Exception as err:
            print(f"[CellTrace Startup] Binary fetch warning: {err}")
            
        for pattern in search_paths:
            matches = glob.glob(pattern, recursive=True)
            for m in matches:
                if os.path.isfile(m) and not m.endswith(".py"):
                    found_binaries.append(m)

    if found_binaries:
        src_bin = found_binaries[0]
        print(f"[CellTrace Startup] Found engine binary at: {src_bin}")
        
        for tname in target_names:
            dest_paths = [
                backend_dir / tname,
                backend_dir / "app" / "prisma" / tname,
            ]
            for dest in dest_paths:
                try:
                    if not dest.exists():
                        shutil.copy2(src_bin, dest)
                    os.chmod(dest, 0o755)
                    print(f"[CellTrace Startup] Engine configured at {dest} (chmod 755)")
                except Exception as ex:
                    print(f"[CellTrace Startup] Copy warning for {dest}: {ex}")
                    
        os.environ["PRISMA_QUERY_ENGINE_BINARY"] = str(backend_dir / "prisma-query-engine-debian-openssl-3.0.x")
        try:
            os.chmod(src_bin, 0o755)
        except Exception:
            pass

setup_prisma_binary()

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
        logger.warning(f"Initial Prisma connect attempt error: {e}. Retrying setup_prisma_binary()...")
        setup_prisma_binary()
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
    allow_origins=["*"],  # Allows all origins for API access from Vercel & local
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
