"""CellTrace — Prediction routes (run model, get predictions)."""
import logging
from fastapi import APIRouter, HTTPException, Request, Depends, BackgroundTasks, status

from app.schemas import PredictRequest, PredictionResponse
from app.auth.dependencies import require_operator
from app.services.ml_service import ml_service
from app.prisma import Json

router = APIRouter()
logger = logging.getLogger("celltrace.predictions")


@router.post("", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def run_prediction(
    request: Request,
    body: PredictRequest,
    user=Depends(require_operator),
):
    """
    Run SOH/RUL prediction on battery cycle data.
    Creates the battery record if it doesn't exist.
    """
    db = request.app.state.db

    # Sanitize battery ID (strip whitespace, tabs, etc.)
    body.battery_id = body.battery_id.strip()
    if not body.battery_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Battery ID cannot be empty",
        )

    if not ml_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML models not loaded — try again shortly",
        )

    # Ensure battery exists (auto-create if not)
    battery = await db.battery.find_unique(where={"id": body.battery_id})
    if not battery:
        battery = await db.battery.create(
            data={
                "id": body.battery_id,
                "chemistry": body.cathode,
            }
        )
        logger.info(f"Auto-created battery: {body.battery_id}")

    # Run prediction
    result = ml_service.predict_soh(
        cycle_number=body.cycle_number,
        soh_current=body.soh_current,
        cathode=body.cathode,
        early_fade_rate_mean=body.early_fade_rate_mean,
        early_fade_rate_std=body.early_fade_rate_std,
        early_fade_rate_min=body.early_fade_rate_min,
    )

    # Compute report hash for on-chain anchoring
    report_payload = {
        "battery_id": body.battery_id,
        "soh_percent": result["soh_percent"],
        "rul_fraction": result["rul_fraction"],
        "rul_cycles": result["rul_cycles"],
        "has_knee_point": result["has_knee_point"],
        "model_version": result["model_version"],
        "cycle_number": body.cycle_number,
        "soh_input": body.soh_current,
        "cathode": body.cathode,
    }
    report_hash = ml_service.compute_report_hash(report_payload)

    # Save to database
    prediction = await db.prediction.create(
        data={
            "battery": {"connect": {"id": body.battery_id}},
            "soh_percent": result["soh_percent"],
            "rul_cycles": result["rul_cycles"],
            "rul_fraction": result["rul_fraction"],
            "has_knee_point": result["has_knee_point"],
            "confidence_range": Json(result["confidence_range"]) if result["confidence_range"] else None,
            "model_version": result["model_version"],
            "report_hash": report_hash,
            "user": {"connect": {"id": user.id}},
        }
    )

    # Audit log
    await db.auditlog.create(
        data={
            "actor": {"connect": {"id": user.id}},
            "action": "predict",
            "metadata": Json({
                "battery_id": body.battery_id,
                "prediction_id": prediction.id,
                "soh_percent": result["soh_percent"],
            }),
        }
    )

    logger.info(
        f"Prediction created: {prediction.id} — "
        f"battery={body.battery_id}, SOH={result['soh_percent']}%, "
        f"user={user.id}"
    )

    return PredictionResponse(
        id=prediction.id,
        battery_id=prediction.battery_id,
        soh_percent=prediction.soh_percent,
        rul_cycles=prediction.rul_cycles,
        rul_fraction=prediction.rul_fraction,
        has_knee_point=prediction.has_knee_point,
        confidence_range=prediction.confidence_range,
        model_version=prediction.model_version,
        report_hash=prediction.report_hash,
        created_at=prediction.created_at,
    )


@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(request: Request, prediction_id: str):
    """Get a specific prediction by ID (public)."""
    db = request.app.state.db

    prediction = await db.prediction.find_unique(
        where={"id": prediction_id},
        include={"chain_records": True},
    )

    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found",
        )

    chain_status = None
    if prediction.chain_records:
        chain_status = prediction.chain_records[0].status

    return PredictionResponse(
        id=prediction.id,
        battery_id=prediction.battery_id,
        soh_percent=prediction.soh_percent,
        rul_cycles=prediction.rul_cycles,
        rul_fraction=prediction.rul_fraction,
        has_knee_point=prediction.has_knee_point,
        confidence_range=prediction.confidence_range,
        model_version=prediction.model_version,
        report_hash=prediction.report_hash,
        created_at=prediction.created_at,
        chain_status=chain_status,
    )


@router.get("")
async def list_predictions(
    request: Request,
    battery_id: str = "",
    skip: int = 0,
    take: int = 20,
):
    """List predictions, optionally filtered by battery ID (public)."""
    db = request.app.state.db

    where = {}
    if battery_id:
        where["battery_id"] = battery_id

    predictions = await db.prediction.find_many(
        where=where,
        skip=skip,
        take=take,
        order={"created_at": "desc"},
        include={"chain_records": True},
    )

    total = await db.prediction.count(where=where)

    return {
        "predictions": [
            {
                "id": p.id,
                "battery_id": p.battery_id,
                "soh_percent": p.soh_percent,
                "rul_cycles": p.rul_cycles,
                "rul_fraction": p.rul_fraction,
                "has_knee_point": p.has_knee_point,
                "confidence_range": p.confidence_range,
                "model_version": p.model_version,
                "report_hash": p.report_hash,
                "created_at": p.created_at.isoformat(),
                "chain_status": (
                    p.chain_records[0].status if p.chain_records else None
                ),
            }
            for p in predictions
        ],
        "total": total,
    }
