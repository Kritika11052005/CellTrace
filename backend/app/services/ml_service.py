"""CellTrace — ML Model Service for SOH/RUL/Knee-point inference."""
import logging
import json
import hashlib
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

from app.config import settings

logger = logging.getLogger("celltrace.ml")


class MLService:
    """Loads and serves the trained battery health models."""

    def __init__(self):
        self.soh_model = None
        self.rul_model = None
        self.knee_model = None
        self._loaded = False

    def load_models(self):
        """Load all .pkl model files at startup."""
        models_dir = Path(settings.ML_MODELS_PATH)
        soh_path = Path(settings.SOH_MODEL_PATH)

        # SOH model
        if soh_path.exists():
            self.soh_model = joblib.load(soh_path)
            logger.info(f"SOH model loaded from {soh_path}")
        else:
            logger.warning(f"SOH model not found at {soh_path}")

        # RUL model
        rul_path = models_dir / "rul_final_model.pkl"
        if rul_path.exists():
            self.rul_model = joblib.load(rul_path)
            logger.info(f"RUL model loaded from {rul_path}")
        else:
            logger.warning(f"RUL model not found at {rul_path}")

        # Knee-point model
        knee_path = models_dir / "knee_point_final_model.pkl"
        if knee_path.exists():
            self.knee_model = joblib.load(knee_path)
            logger.info(f"Knee-point model loaded from {knee_path}")
        else:
            logger.warning(f"Knee-point model not found at {knee_path}")

        self._loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def predict_soh(
        self,
        cycle_number: int,
        soh_current: float,
        cathode: str,
        early_fade_rate_mean: Optional[float] = None,
        early_fade_rate_std: Optional[float] = None,
        early_fade_rate_min: Optional[float] = None,
    ) -> dict:
        """
        Run SOH prediction.
        Returns: { soh_percent, rul_fraction, rul_cycles, has_knee_point, confidence_range, model_version }
        """
        results = {
            "soh_percent": round(soh_current * 100, 2),
            "rul_fraction": None,
            "rul_cycles": None,
            "has_knee_point": None,
            "confidence_range": {},
            "model_version": "v1.0-rf-calce-mit-nasa-snl",
        }

        import pandas as pd

        # ─── Feature engineering ─────────────────────────
        # Derived feature estimates from cycle telemetry
        fade_mean = early_fade_rate_mean if early_fade_rate_mean is not None else -(1.0 - soh_current) / max(cycle_number, 1)
        fade_std = early_fade_rate_std if early_fade_rate_std is not None else abs(fade_mean) * 0.5
        fade_curvature = early_fade_rate_min if early_fade_rate_min is not None else fade_mean * 0.1

        # ─── 1. SOH Prediction (8 features) ───────────────
        if self.soh_model is not None:
            try:
                # Expected features: ['soh_at_start', 'soh_at_cutoff', 'soh_fade_slope', 'soh_fade_curvature', 'soh_std', 'n_cycles_used', 'voltage_max_mean', 'voltage_max_trend']
                soh_df = pd.DataFrame([{
                    "soh_at_start": 1.0,
                    "soh_at_cutoff": soh_current,
                    "soh_fade_slope": fade_mean,
                    "soh_fade_curvature": fade_curvature,
                    "soh_std": fade_std,
                    "n_cycles_used": cycle_number,
                    "voltage_max_mean": 3.65,
                    "voltage_max_trend": -0.0001,
                }])
                soh_pred = self.soh_model.predict(soh_df)[0]
                results["soh_percent"] = round(float(soh_pred) * 100, 2)

                if hasattr(self.soh_model, 'estimators_'):
                    tree_preds = np.array([t.predict(soh_df)[0] for t in self.soh_model.estimators_])
                    results["confidence_range"]["soh_low"] = round(float(np.percentile(tree_preds, 10)) * 100, 2)
                    results["confidence_range"]["soh_high"] = round(float(np.percentile(tree_preds, 90)) * 100, 2)
            except Exception as e:
                logger.error(f"SOH prediction failed: {e}")
                results["soh_percent"] = round(soh_current * 100, 2)

        # ─── 2. RUL Prediction (6 features) ───────────────
        if self.rul_model is not None:
            try:
                # Expected features: ['soh_current', 'soh_window_mean', 'soh_window_std', 'soh_fade_slope', 'soh_fade_curvature', 'n_window_cycles']
                rul_df = pd.DataFrame([{
                    "soh_current": soh_current,
                    "soh_window_mean": soh_current,
                    "soh_window_std": fade_std,
                    "soh_fade_slope": fade_mean,
                    "soh_fade_curvature": fade_curvature,
                    "n_window_cycles": cycle_number,
                }])
                rul_frac = self.rul_model.predict(rul_df)[0]
                rul_frac = float(np.clip(rul_frac, 0, 1))
                results["rul_fraction"] = round(rul_frac, 4)

                if rul_frac > 0:
                    estimated_total = int(cycle_number / max(1 - rul_frac, 0.01))
                    results["rul_cycles"] = max(0, estimated_total - cycle_number)
                else:
                    results["rul_cycles"] = 0

                if hasattr(self.rul_model, 'estimators_'):
                    tree_preds = np.array([t.predict(rul_df)[0] for t in self.rul_model.estimators_])
                    results["confidence_range"]["rul_low"] = round(float(np.percentile(tree_preds, 10)), 4)
                    results["confidence_range"]["rul_high"] = round(float(np.percentile(tree_preds, 90)), 4)
            except Exception as e:
                logger.error(f"RUL prediction failed: {e}")

        # ─── 3. Knee-Point Detection (6 features) ─────────
        if self.knee_model is not None:
            try:
                # Expected features: ['soh_start', 'soh_at_early_cutoff', 'early_fade_slope', 'early_fade_curvature', 'early_soh_std', 'n_early_cycles']
                knee_df = pd.DataFrame([{
                    "soh_start": 1.0,
                    "soh_at_early_cutoff": soh_current,
                    "early_fade_slope": fade_mean,
                    "early_fade_curvature": fade_curvature,
                    "early_soh_std": fade_std,
                    "n_early_cycles": cycle_number,
                }])
                knee_pred = self.knee_model.predict(knee_df)[0]
                results["has_knee_point"] = bool(knee_pred)
            except Exception as e:
                logger.error(f"Knee-point prediction failed: {e}")

        return results


    @staticmethod
    def _normalize_payload(data):
        """Recursively normalize numbers so integer-valued floats become ints for cross-platform JSON hash parity."""
        if isinstance(data, dict):
            return {k: MLService._normalize_payload(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [MLService._normalize_payload(v) for v in data]
        elif isinstance(data, float) and data.is_integer():
            return int(data)
        return data

    @staticmethod
    def compute_report_hash(report_data: dict) -> str:
        """Compute keccak256 hash of a prediction report for on-chain anchoring."""
        normalized = MLService._normalize_payload(report_data)
        # Canonical JSON serialization
        canonical = json.dumps(normalized, sort_keys=True, separators=(",", ":"))
        # Use SHA3-256 (keccak256 equivalent in Python hashlib)
        return "0x" + hashlib.sha3_256(canonical.encode("utf-8")).hexdigest()


# Singleton
ml_service = MLService()
