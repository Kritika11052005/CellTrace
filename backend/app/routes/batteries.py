"""CellTrace — Battery CRUD routes."""
import logging
from fastapi import APIRouter, HTTPException, Request, Depends, status

from app.schemas import BatteryCreate, BatteryResponse, BatteryListResponse
from app.auth.dependencies import get_current_user, require_operator

router = APIRouter()
logger = logging.getLogger("celltrace.batteries")


@router.get("", response_model=BatteryListResponse)
async def list_batteries(
    request: Request,
    skip: int = 0,
    take: int = 50,
    search: str = "",
):
    """List all tracked batteries (public)."""
    db = request.app.state.db

    where = {}
    if search:
        where = {
            "OR": [
                {"id": {"contains": search, "mode": "insensitive"}},
                {"manufacturer": {"contains": search, "mode": "insensitive"}},
                {"chemistry": {"contains": search, "mode": "insensitive"}},
            ]
        }

    batteries = await db.battery.find_many(
        where=where,
        skip=skip,
        take=take,
        order={"created_at": "desc"},
        include={"predictions": True, "chain_records": True},
    )

    total = await db.battery.count(where=where)

    return BatteryListResponse(
        batteries=[
            BatteryResponse(
                id=b.id,
                manufacturer=b.manufacturer,
                model=b.model,
                chemistry=b.chemistry,
                nominal_capacity_ah=b.nominal_capacity_ah,
                created_at=b.created_at,
                prediction_count=len(b.predictions) if b.predictions is not None else 0,
                chain_record_count=len(b.chain_records) if b.chain_records is not None else 0,
            )
            for b in batteries
        ],
        total=total,
    )


@router.get("/{battery_id}", response_model=BatteryResponse)
async def get_battery(request: Request, battery_id: str):
    """Get a single battery by ID (public)."""
    db = request.app.state.db

    battery = await db.battery.find_unique(
        where={"id": battery_id},
        include={"predictions": True, "chain_records": True},
    )

    if not battery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Battery '{battery_id}' not found",
        )

    return BatteryResponse(
        id=battery.id,
        manufacturer=battery.manufacturer,
        model=battery.model,
        chemistry=battery.chemistry,
        nominal_capacity_ah=battery.nominal_capacity_ah,
        created_at=battery.created_at,
        prediction_count=len(battery.predictions) if battery.predictions is not None else 0,
        chain_record_count=len(battery.chain_records) if battery.chain_records is not None else 0,
    )


@router.post("", response_model=BatteryResponse, status_code=status.HTTP_201_CREATED)
async def create_battery(
    request: Request,
    body: BatteryCreate,
    user=Depends(require_operator),
):
    """Register a new battery (operator only)."""
    db = request.app.state.db

    existing = await db.battery.find_unique(where={"id": body.id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Battery '{body.id}' already exists",
        )

    battery = await db.battery.create(
        data={
            "id": body.id,
            "manufacturer": body.manufacturer,
            "model": body.model,
            "chemistry": body.chemistry,
            "nominal_capacity_ah": body.nominal_capacity_ah,
        }
    )

    logger.info(f"Battery created: {battery.id} by user {user.id}")

    return BatteryResponse(
        id=battery.id,
        manufacturer=battery.manufacturer,
        model=battery.model,
        chemistry=battery.chemistry,
        nominal_capacity_ah=battery.nominal_capacity_ah,
        created_at=battery.created_at,
    )


@router.get("/{battery_id}/predictions")
async def get_battery_predictions(
    request: Request,
    battery_id: str,
    skip: int = 0,
    take: int = 20,
):
    """Get all predictions for a battery (public)."""
    db = request.app.state.db

    battery = await db.battery.find_unique(where={"id": battery_id})
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    predictions = await db.prediction.find_many(
        where={"battery_id": battery_id},
        skip=skip,
        take=take,
        order={"created_at": "desc"},
        include={"chain_records": True},
    )

    return {
        "battery_id": battery_id,
        "predictions": [
            {
                "id": p.id,
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
        "total": await db.prediction.count(where={"battery_id": battery_id}),
    }


@router.get("/{battery_id}/history")
async def get_battery_chain_history(request: Request, battery_id: str):
    """Get full on-chain provenance history for a battery (public)."""
    db = request.app.state.db

    records = await db.chainrecord.find_many(
        where={"battery_id": battery_id, "status": "confirmed"},
        order={"created_at": "asc"},
        include={"prediction": True},
    )

    # Also fetch on-chain records if chain service available
    from app.services.chain_service import chain_service
    on_chain = await chain_service.get_all_records(battery_id)

    return {
        "battery_id": battery_id,
        "records": [
            {
                "id": r.id,
                "tx_hash": r.tx_hash,
                "data_hash": r.data_hash,
                "event_type": r.event_type,
                "block_number": r.block_number,
                "chain_timestamp": r.chain_timestamp.isoformat() if r.chain_timestamp else None,
                "status": r.status,
                "soh_percent": r.prediction.soh_percent if r.prediction else None,
                "created_at": r.created_at.isoformat(),
                "block_explorer_url": f"https://amoy.polygonscan.com/tx/{r.tx_hash}",
            }
            for r in records
        ],
        "on_chain_records": on_chain,
        "total": len(records),
    }
