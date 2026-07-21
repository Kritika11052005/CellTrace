"""CellTrace Backend — Main FastAPI Application"""
import os
import glob
import logging
from pathlib import Path
from contextlib import asynccontextmanager

os.environ["PRISMA_PY_DEBUG_GENERATOR"] = "1"

# ─── Auto-Detect & Configure Prisma Query Engine Binary ──
_backend_dir = Path(__file__).resolve().parent.parent
_search_patterns = [
    str(_backend_dir / "prisma-query-engine*"),
    str(_backend_dir / "app" / "prisma" / "prisma-query-engine*"),
    "/opt/render/.cache/prisma-python/binaries/**/prisma-query-engine*",
    "/root/.cache/prisma-python/binaries/**/prisma-query-engine*",
    "/tmp/prisma-python/binaries/**/prisma-query-engine*",
]

for _pattern in _search_patterns:
    _matches = glob.glob(_pattern, recursive=True)
    for _m in _matches:
        if os.path.isfile(_m) and not _m.endswith(".py"):
            try:
                os.chmod(_m, 0o755)
            except Exception:
                pass
            os.environ["PRISMA_QUERY_ENGINE_BINARY"] = _m
            print(f"[CellTrace Startup] PRISMA_QUERY_ENGINE_BINARY set to: {_m}")
            break
    if "PRISMA_QUERY_ENGINE_BINARY" in os.environ:
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

            # Re-locate query engine binary after fetch
            _matches = glob.glob("/opt/render/.cache/prisma-python/binaries/**/prisma-query-engine*", recursive=True)
            if _matches:
                try:
                    os.chmod(_matches[0], 0o755)
                except Exception:
                    pass
                os.environ["PRISMA_QUERY_ENGINE_BINARY"] = _matches[0]

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
app.include_router(verify.router, prefix="/api/verify", tags=["Verification"])


@app.get("/")
def root():
    return {
        "message": "CellTrace API is online",
        "docs": "/docs",
        "health": "/api/health",
        "version": "1.0.0",
    }
