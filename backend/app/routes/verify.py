"""CellTrace — Verify routes (tamper-check)."""
import logging
from fastapi import APIRouter, Request, status
from app.schemas import VerifyRequest, VerifyResponse
from app.services.ml_service import ml_service
from app.services.chain_service import chain_service
from app.prisma import Json

router = APIRouter()
logger = logging.getLogger("celltrace.verify")


@router.post("", response_model=VerifyResponse)
async def verify_report(request: Request, body: VerifyRequest):
    """
    Verify a report's authenticity: recompute its hash and compare
    against on-chain records. Public — no auth required.
    """
    db = request.app.state.db

    # Compute hash of the submitted report
    computed_hash = ml_service.compute_report_hash(body.report_data)

    # Check against off-chain records first
    chain_records = await db.chainrecord.find_many(
        where={"battery_id": body.battery_id, "status": "confirmed"},
        order={"created_at": "desc"},
    )

    match_found = False
    matched_tx = None
    on_chain_hash = None

    for record in chain_records:
        if record.data_hash == computed_hash:
            match_found = True
            matched_tx = record.tx_hash
            on_chain_hash = record.data_hash
            break

    # Also try on-chain verification
    if not match_found and chain_service.is_available:
        on_chain_records = await chain_service.get_all_records(body.battery_id)
        for r in on_chain_records:
            if r["data_hash"] == computed_hash:
                match_found = True
                on_chain_hash = r["data_hash"]
                break

    # Audit log
    await db.auditlog.create(
        data={
            "action": "verify_check",
            "metadata": Json({
                "battery_id": body.battery_id,
                "computed_hash": computed_hash,
                "is_match": match_found,
            }),
        }
    )

    if match_found:
        msg = "✅ Report matches on-chain record — this report has not been altered."
        explorer = f"https://amoy.polygonscan.com/tx/{matched_tx}" if matched_tx else None
    else:
        if not chain_records and not chain_service.is_available:
            msg = "⚠️ No on-chain records found and chain service unavailable."
        elif not chain_records:
            msg = "⚠️ No on-chain records exist for this battery."
        else:
            msg = "⚠️ Recomputed hash does not match any on-chain record — report may have been altered."
        explorer = None

    return VerifyResponse(
        battery_id=body.battery_id,
        is_match=match_found,
        computed_hash=computed_hash,
        on_chain_hash=on_chain_hash,
        message=msg,
        tx_hash=matched_tx,
        block_explorer_url=explorer,
    )
