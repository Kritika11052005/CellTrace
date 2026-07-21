"""CellTrace Backend — Main FastAPI Application"""
import os
import glob
import logging
from pathlib import Path
from contextlib import asynccontextmanager

os.environ["PRISMA_PY_DEBUG_GENERATOR"] = "1"

# ─── Ensure Query Engine Binary Permissions & Environment ──
_backend_dir = Path(__file__).resolve().parent.parent

_engine_files = (
    list(_backend_dir.glob("prisma-query-engine*")) +
    list((_backend_dir / "app" / "prisma").glob("prisma-query-engine*")) +
    [Path(p) for p in glob.glob("/opt/render/.cache/prisma-python/binaries/**/prisma-query-engine*", recursive=True)] +
    [Path(p) for p in glob.glob("/root/.cache/prisma-python/binaries/**/prisma-query-engine*", recursive=True)]
)

for _efile in _engine_files:
    if _efile.is_file() and not str(_efile).endswith(".py"):
        try:
            os.chmod(_efile, 0o755)
        except Exception:
            pass
        os.environ["PRISMA_QUERY_ENGINE_BINARY"] = str(_efile)
        print(f"[CellTrace Startup] Found & bound PRISMA_QUERY_ENGINE_BINARY: {_efile}")
        break

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
        err_msg = str(e)
        if "BinaryNotFoundError" in str(type(e).__name__) or "prisma-query-engine" in err_msg or "binary" in err_msg.lower():
            logger.warning("Prisma query engine missing at runtime — executing fallback binary fetch...")
            import subprocess
            subprocess.run(["python", "-m", "prisma", "py", "fetch"], check=True)

            # Grant 755 permissions to downloaded binaries in .cache
            for _efile in glob.glob("/opt/render/.cache/prisma-python/binaries/**/prisma-query-engine*", recursive=True):
                try:
                    os.chmod(_efile, 0o755)
                except Exception:
                    pass
                os.environ["PRISMA_QUERY_ENGINE_BINARY"] = _efile
                break

            db = Prisma()
            await db.connect()
        else:
            raise e
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
