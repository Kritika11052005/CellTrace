"""CellTrace Backend Configuration"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # ─── Database ─────────────────────────────────────────
    DATABASE_URL: str

    # ─── Auth ─────────────────────────────────────────────
    JWT_SECRET: str = "celltrace-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 30
    JWT_REFRESH_EXPIRY_DAYS: int = 7

    # ─── Blockchain ──────────────────────────────────────
    AMOY_RPC_URL: str = ""
    PRIVATE_KEY: str = ""
    CONTRACT_ADDRESS: str = ""

    # ─── App ──────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,https://cell-trace.vercel.app,https://*.vercel.app"

    # ─── Gemini AI ─────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"


    # ─── ML Models ────────────────────────────────────────
    ML_MODELS_PATH: str = str(BASE_DIR / "models")
    SOH_MODEL_PATH: str = str(BASE_DIR / "models" / "soh_final_model.pkl")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
