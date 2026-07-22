"""CellTrace — APM AI Agent Endpoints."""
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status

from app.services.apm_agent import apm_agent_service

router = APIRouter()
logger = logging.getLogger("celltrace.routes.apm")


class APMDiagnoseRequest(BaseModel):
    battery_id: str = Field(..., description="Battery serial or asset ID")
    cycle_number: int = Field(1, ge=0, description="Current cycle count")
    soh_percent: float = Field(100.0, ge=0, le=200.0, description="SOH percentage (0-200)")
    rul_cycles: Optional[int] = Field(None, description="Predicted remaining useful life in cycles")
    has_knee_point: Optional[bool] = Field(False, description="Knee-point accelerated degradation flag")
    cathode: Optional[str] = Field("LFP", description="Cathode chemistry (LFP, NMC, NCA, LCO)")
    avg_temp_c: Optional[float] = Field(34.5, description="Average temperature in Celsius")
    peak_temp_c: Optional[float] = Field(46.2, description="Peak recorded temperature")
    avg_c_rate: Optional[float] = Field(1.2, description="Average charging C-rate")
    voltage_delta_mv: Optional[float] = Field(18.4, description="Cell imbalance voltage delta in mV")



class APMCopilotRequest(BaseModel):
    message: str = Field(..., description="Operator query or prompt")
    battery_id: Optional[str] = None
    soh_percent: Optional[float] = None
    rul_cycles: Optional[int] = None
    conversation_history: Optional[List[Dict[str, str]]] = None


@router.post("/diagnose")
async def diagnose_battery_apm(body: APMDiagnoseRequest):
    """Generates Gemini AI APM Diagnostic report, predictive maintenance triggers, and optimal charging rules."""
    try:
        report = await apm_agent_service.diagnose_battery(
            battery_id=body.battery_id,
            cycle_number=body.cycle_number,
            soh_percent=body.soh_percent,
            rul_cycles=body.rul_cycles,
            has_knee_point=body.has_knee_point,
            cathode=body.cathode,
            avg_temp_c=body.avg_temp_c or 34.5,
            peak_temp_c=body.peak_temp_c or 46.2,
            avg_c_rate=body.avg_c_rate or 1.2,
            voltage_delta_mv=body.voltage_delta_mv or 18.4,
        )
        return report
    except Exception as e:
        logger.error(f"APM diagnosis error: {e}")
        raise HTTPException(status_code=500, detail=f"APM Agent failure: {str(e)}")


from fastapi import APIRouter, HTTPException, Request, status

@router.post("/copilot/chat")
async def copilot_chat(body: APMCopilotRequest, request: Request):
    """Interactive fleet manager copilot interface powered by Gemini AI, Live Database Telemetry, and RAG Physics."""
    try:
        db = getattr(request.app.state, "db", None)
        res = await apm_agent_service.chat_copilot(
            user_message=body.message,
            battery_id=body.battery_id,
            soh_percent=body.soh_percent,
            rul_cycles=body.rul_cycles,
            conversation_history=body.conversation_history,
            db=db,
        )
        return res

    except Exception as e:
        logger.error(f"APM Copilot error: {e}")
        raise HTTPException(status_code=500, detail=f"Copilot failure: {str(e)}")


@router.get("/telemetry-stream/{battery_id}")
async def get_telemetry_stream(battery_id: str):
    """Simulates real-time BMS Telemetry stream with degradation trajectories."""
    import random
    import math

    # Build simulated 100-cycle degradation trajectory curves
    observed_curve = []
    unmitigated_curve = []
    optimized_curve = []

    base_soh = 100.0
    for cycle in range(1, 101):
        # Linear + exponential fade curve
        fade_unmitigated = 0.05 * cycle + (0.0004 * (cycle ** 1.8))
        fade_optimized = 0.03 * cycle + (0.00015 * (cycle ** 1.6))
        
        unmitigated_soh = max(60.0, round(base_soh - fade_unmitigated, 2))
        optimized_soh = max(75.0, round(base_soh - fade_optimized, 2))
        
        item = {
            "cycle": cycle * 10,
            "unmitigated_soh": unmitigated_soh,
            "optimized_soh": optimized_soh,
        }
        if cycle <= 45:
            # Observed data up to cycle 450
            item["observed_soh"] = round(unmitigated_soh + (random.uniform(-0.3, 0.3)), 2)
            
        observed_curve.append(item)

    return {
        "battery_id": battery_id,
        "telemetry": {
            "current_temp_c": 36.2,
            "peak_temp_24h_c": 47.8,
            "voltage_delta_mv": 19.5,
            "current_c_rate": 1.4,
            "charging_state": "FAST_CHARGING",
            "cooling_circuit_status": "ACTIVE_FLOW",
        },
        "trajectory_curve": observed_curve,
        "extension_benefit_cycles": 340,
    }
