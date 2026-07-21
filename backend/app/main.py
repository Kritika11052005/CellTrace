"""CellTrace Backend — Main FastAPI Application"""
import os
os.environ["PRISMA_PY_DEBUG_GENERATOR"] = "1"
import logging
from contextlib import asynccontextmanager

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
    logger.info("Connecting to Neon PostgreSQL via Prisma…")
    try:
        await db.connect()
    except Exception as e:
        err_msg = str(e)
        if "BinaryNotFoundError" in str(type(e).__name__) or "prisma-query-engine" in err_msg or "binary" in err_msg.lower():
            logger.warning("Prisma query engine missing at runtime — executing fallback binary fetch...")
            import subprocess
            subprocess.run(["python", "-m", "prisma", "py", "fetch"], check=True)
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
    description="Battery intelligence platform — predict health, prove provenance on-chain.",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(batteries.router, prefix="/batteries", tags=["Batteries"])
app.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
app.include_router(chain.router, prefix="/chain", tags=["Chain"])
app.include_router(verify.router, prefix="/verify", tags=["Verify"])
