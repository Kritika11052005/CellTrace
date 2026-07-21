"""CellTrace — Pydantic request/response schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ─── Auth ─────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(..., description="Operator email address")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── Battery ─────────────────────────────────────────────

class BatteryCreate(BaseModel):
    id: str = Field(..., description="Battery serial number / identifier")
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    chemistry: Optional[str] = None
    nominal_capacity_ah: Optional[float] = None


class BatteryResponse(BaseModel):
    id: str
    manufacturer: Optional[str]
    model: Optional[str]
    chemistry: Optional[str]
    nominal_capacity_ah: Optional[float]
    created_at: datetime
    prediction_count: int = 0
    chain_record_count: int = 0


class BatteryListResponse(BaseModel):
    batteries: list[BatteryResponse]
    total: int


# ─── Prediction ──────────────────────────────────────────

class PredictRequest(BaseModel):
    battery_id: str = Field(..., description="Battery ID to predict for")
    cycle_number: int = Field(..., gt=0, description="Current cycle number")
    soh_current: float = Field(..., ge=0, le=1.1, description="Current SOH (0–1 scale)")
    cathode: str = Field("LFP", description="Cathode chemistry: LFP, NMC, NCA, LCO")
    early_fade_rate_mean: Optional[float] = None
    early_fade_rate_std: Optional[float] = None
    early_fade_rate_min: Optional[float] = None


class PredictionResponse(BaseModel):
    id: str
    battery_id: str
    soh_percent: float
    rul_cycles: Optional[int]
    rul_fraction: Optional[float]
    has_knee_point: Optional[bool]
    confidence_range: Optional[dict]
    model_version: str
    report_hash: Optional[str]
    created_at: datetime
    chain_status: Optional[str] = None  # null = not logged, pending, confirmed, failed


class PredictionListResponse(BaseModel):
    predictions: list[PredictionResponse]
    total: int


# ─── Chain Record ────────────────────────────────────────

class ChainWriteRequest(BaseModel):
    prediction_id: str = Field(..., description="Prediction UUID to log on-chain")
    event_type: str = Field("SOH_UPDATE", description="Event type label")


class ChainRecordResponse(BaseModel):
    id: str
    prediction_id: str
    battery_id: str
    tx_hash: str
    contract_address: str
    data_hash: str
    event_type: str
    block_number: Optional[int]
    chain_timestamp: Optional[datetime]
    status: str
    created_at: datetime


class ChainHistoryResponse(BaseModel):
    battery_id: str
    records: list[ChainRecordResponse]
    total: int


# ─── Verify ──────────────────────────────────────────────

class VerifyRequest(BaseModel):
    battery_id: str
    report_data: dict = Field(..., description="The report payload to verify")


class VerifyResponse(BaseModel):
    battery_id: str
    is_match: bool
    computed_hash: str
    on_chain_hash: Optional[str]
    message: str
    tx_hash: Optional[str] = None
    block_explorer_url: Optional[str] = None


# ─── Dashboard ───────────────────────────────────────────

class DashboardStats(BaseModel):
    total_batteries: int
    total_predictions: int
    total_chain_records: int
    avg_soh: Optional[float]
    recent_predictions: list[PredictionResponse]
