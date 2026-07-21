"""CellTrace — Chain (blockchain) write routes."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Depends, BackgroundTasks, status

from app.schemas import ChainWriteRequest, ChainRecordResponse
from app.auth.dependencies import require_operator
from app.services.chain_service import chain_service
from app.config import settings
from app.prisma import Json

router = APIRouter()
logger = logging.getLogger("celltrace.chain")


@router.post("/write", response_model=ChainRecordResponse, status_code=status.HTTP_201_CREATED)
async def write_to_chain(
    request: Request,
    body: ChainWriteRequest,
    background_tasks: BackgroundTasks,
    user=Depends(require_operator),
):
    """
    Log a prediction's hash on-chain via BatteryProvenance.addRecord().
    The prediction must already exist and have a report_hash.
    """
    db = request.app.state.db

    # Get the prediction
    prediction = await db.prediction.find_unique(
        where={"id": body.prediction_id},
        include={"chain_records": True},
    )

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    if not prediction.report_hash:
        raise HTTPException(status_code=400, detail="Prediction has no report hash")

    # Check if already logged
    if prediction.chain_records:
        existing = prediction.chain_records[0]
        if existing.status in ("confirmed", "pending"):
            raise HTTPException(
                status_code=409,
                detail=f"Prediction already logged on-chain (status: {existing.status})",
            )

    # Create pending chain record
    chain_record = await db.chainrecord.create(
        data={
            "prediction": {"connect": {"id": prediction.id}},
            "battery": {"connect": {"id": prediction.battery_id}},
            "tx_hash": f"pending-{prediction.id[:8]}",
            "contract_address": settings.CONTRACT_ADDRESS or "not-configured",
            "data_hash": prediction.report_hash,
            "event_type": body.event_type,
            "status": "pending",
        }
    )

    # Audit log
    await db.auditlog.create(
        data={
            "actor": {"connect": {"id": user.id}},
            "action": "chain_write_attempt",
            "metadata": Json({
                "prediction_id": prediction.id,
                "battery_id": prediction.battery_id,
                "event_type": body.event_type,
            }),
        }
    )

    # Attempt blockchain write
    if chain_service.is_available:
        result = await chain_service.add_record(
            battery_id=prediction.battery_id,
            data_hash=prediction.report_hash,
            event_type=body.event_type,
        )

        if result:
            # Update chain record with actual tx data
            chain_record = await db.chainrecord.update(
                where={"id": chain_record.id},
                data={
                    "tx_hash": result["tx_hash"],
                    "block_number": result["block_number"],
                    "status": result["status"],
                    "chain_timestamp": datetime.now(timezone.utc),
                },
            )
            logger.info(
                f"Chain write confirmed: tx={result['tx_hash']}, "
                f"battery={prediction.battery_id}, gas={result.get('gas_used')}"
            )
        else:
            # Write failed
            chain_record = await db.chainrecord.update(
                where={"id": chain_record.id},
                data={"status": "failed"},
            )
            logger.warning(f"Chain write failed for prediction {prediction.id}")
    else:
        # Chain not configured — mark as failed but keep the record
        logger.warning("Chain service not available — recording as failed")
        chain_record = await db.chainrecord.update(
            where={"id": chain_record.id},
            data={"status": "failed"},
        )

    return ChainRecordResponse(
        id=chain_record.id,
        prediction_id=chain_record.prediction_id,
        battery_id=chain_record.battery_id,
        tx_hash=chain_record.tx_hash,
        contract_address=chain_record.contract_address,
        data_hash=chain_record.data_hash,
        event_type=chain_record.event_type,
        block_number=chain_record.block_number,
        chain_timestamp=chain_record.chain_timestamp,
        status=chain_record.status,
        created_at=chain_record.created_at,
    )


@router.get("/records/{battery_id}")
async def get_chain_records(request: Request, battery_id: str):
    """Get all chain records for a battery (public, off-chain mirror)."""
    db = request.app.state.db

    records = await db.chainrecord.find_many(
        where={"battery_id": battery_id},
        order={"created_at": "asc"},
    )

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
                "created_at": r.created_at.isoformat(),
                "block_explorer_url": f"https://amoy.polygonscan.com/tx/{r.tx_hash}" if not r.tx_hash.startswith("pending") else None,
            }
            for r in records
        ],
        "total": len(records),
    }
