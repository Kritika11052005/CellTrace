"""CellTrace — Health check endpoint."""
from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Health check for uptime monitoring and cron-ping keep-alive."""
    db = request.app.state.db
    db_ok = db.is_connected() if db else False

    from app.services.ml_service import ml_service
    from app.services.chain_service import chain_service

    return {
        "status": "ok",
        "service": "celltrace-api",
        "version": "1.0.0",
        "checks": {
            "database": "connected" if db_ok else "disconnected",
            "ml_models": "loaded" if ml_service.is_loaded else "not loaded",
            "blockchain": "available" if chain_service.is_available else "unavailable",
        },
    }
