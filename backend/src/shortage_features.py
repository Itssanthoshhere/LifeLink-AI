"""
AI Blood Supply Command Center - Shortage Prediction Feature Engineering
-------------------------------------------------------------------------
Constructs a unified, zero-leakage feature matrix and multi-horizon binary shortage labels
(24h, 48h, 72h) across 30 hospitals, 8 blood groups, and 4 blood components.

Integrates:
- Cold-chain inventory snapshots (current_units, available_units, units_expiring_1d..5d)
- Model 1 demand forecasts (forecast_24h, forecast_48h, forecast_72h, cumulative)
- Inventory runway and safety stock deficit calculations
- Historical demand lags and rolling statistics
- Regional blood bank availability and route distances
- Real-time emergency events and meteorological signals
"""

import pickle
from datetime import datetime, timedelta
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
SNAPSHOTS_PARQUET = DATA_PROCESSED / "inventory_snapshots.parquet"
SHORTAGE_MATRIX_PARQUET = DATA_PROCESSED / "shortage_feature_matrix.parquet"

import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import config
from demand_features import prepare_demand_feature_matrix, split_chronological as split_demand_matrix


class ShortagePredictorPipeline:
    """
    Self-contained end-to-end shortage early warning pipeline bundling
    categorical preprocessor, feature names, trained XGBoost classifier,
    calibrator, and risk tier mapping.
    """
    def __init__(
        self,
        horizon: str,
        feature_cols: List[str],
        model: Any,
        calibrator: Optional[Any] = None,
        optimal_threshold: float = 0.50
    ):
        self.horizon = horizon
        self.feature_cols = feature_cols
        self.model = model
        self.calibrator = calibrator
        self.optimal_threshold = optimal_threshold
        self.categorical_cols = ["hospital_id", "blood_group", "component", "hospital_type", "season"]

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        X_df = X[self.feature_cols].copy()
        for col in self.categorical_cols:
            if col in X_df.columns:
                X_df[col] = X_df[col].astype("category")
        
        if self.calibrator is not None:
            raw_probs = self.model.predict_proba(X_df)[:, 1]
            cal_probs = self.calibrator.predict(raw_probs)
            return np.clip(cal_probs, 0.0, 1.0)
        else:
            probs = self.model.predict_proba(X_df)[:, 1]
            return np.clip(probs, 0.0, 1.0)

    def predict(self, X: pd.DataFrame, threshold: Optional[float] = None) -> np.ndarray:
        th = threshold if threshold is not None else self.optimal_threshold
        probs = self.predict_proba(X)
        return (probs >= th).astype(int)

    @staticmethod
    def get_risk_level(prob: float) -> str:
        th = config.SHORTAGE_RISK_THRESHOLDS
        if prob < th["LOW"]:
            return "LOW"
        elif prob < th["MEDIUM"]:
            return "MEDIUM"
        elif prob < th["HIGH"]:
            return "HIGH"
        else:
            return "CRITICAL"


def extract_future_shortage_labels(
    requests_csv: Path = DATA_RAW / "blood_requests.csv",
    start_date: str = "2024-01-01",
    end_date: str = "2025-12-30"
) -> pd.DataFrame:
    """
    Extract strictly future binary shortage labels from clinical requests:
    - shortage_24h: shortage occurs in [t+1]
    - shortage_48h: shortage occurs in [t+1, t+2]
    - shortage_72h: shortage occurs in [t+1, t+2, t+3]
    """
    req_df = pd.read_csv(requests_csv)
    req_df["date"] = req_df["timestamp"].str.slice(0, 10)
    req_df["is_shortage"] = req_df["status"].isin(["unfulfilled", "partially_fulfilled"]).astype(int)

    agg_short = req_df.groupby(["date", "hospital_id", "blood_group", "component"], as_index=False)["is_shortage"].max()

    # Build continuous Cartesian grid
    dates = pd.date_range(start_date, end_date, freq="D").strftime("%Y-%m-%d")
    hosps = [f"HOSP_{i:03d}" for i in range(1, 31)]
    bgs = config.BLOOD_GROUPS
    comps = ["RBC", "Platelets", "Plasma", "Whole_Blood"]

    idx = pd.MultiIndex.from_product([dates, hosps, bgs, comps], names=["date", "hospital_id", "blood_group", "component"])
    grid = pd.DataFrame(index=idx).reset_index()

    grid = grid.merge(agg_short, on=["date", "hospital_id", "blood_group", "component"], how="left")
    grid["is_shortage"] = grid["is_shortage"].fillna(0).astype(int)

    grid.sort_values(["hospital_id", "blood_group", "component", "date"], inplace=True)
    grid.reset_index(drop=True, inplace=True)

    grp = grid.groupby(["hospital_id", "blood_group", "component"])["is_shortage"]

    # Target labels strictly in future horizons:
    grid["shortage_24h"] = grp.shift(-1)
    grid["shortage_48h"] = grp.shift(-1).combine(grp.shift(-2), max)
    grid["shortage_72h"] = grid["shortage_48h"].combine(grp.shift(-3), max)

    return grid[["date", "hospital_id", "blood_group", "component", "shortage_24h", "shortage_48h", "shortage_72h"]]


def prepare_shortage_feature_matrix(force_refresh: bool = False) -> pd.DataFrame:
    """
    Build or load cached complete feature matrix for Model 2 Shortage Prediction.
    """
    if not force_refresh and SHORTAGE_MATRIX_PARQUET.exists():
        return pd.read_parquet(SHORTAGE_MATRIX_PARQUET)

    print("Building Model 2 Shortage feature matrix...")

    # 1. Load base demand features (contains historical lags, rolling stats, hospital metadata, calendar, emergencies)
    demand_matrix = prepare_demand_feature_matrix()

    # 2. Integrate Model 1 Demand Forecasts
    print("Integrating Model 1 Demand Forecasts (24h, 48h, 72h)...")
    with open(MODELS_DIR / "demand_xgb_24h.pkl", "rb") as f:
        m24 = pickle.load(f)
    with open(MODELS_DIR / "demand_xgb_48h.pkl", "rb") as f:
        m48 = pickle.load(f)
    with open(MODELS_DIR / "demand_xgb_72h.pkl", "rb") as f:
        m72 = pickle.load(f)

    demand_matrix["forecast_24h"] = m24.predict(demand_matrix)
    demand_matrix["forecast_48h"] = m48.predict(demand_matrix)
    demand_matrix["forecast_72h"] = m72.predict(demand_matrix)
    demand_matrix["forecast_cumulative_24h"] = demand_matrix["forecast_24h"]
    demand_matrix["forecast_cumulative_48h"] = demand_matrix["forecast_24h"] + demand_matrix["forecast_48h"]
    demand_matrix["forecast_cumulative_72h"] = demand_matrix["forecast_cumulative_48h"] + demand_matrix["forecast_72h"]

    # 3. Load daily inventory state snapshots
    if not SNAPSHOTS_PARQUET.exists():
        raise FileNotFoundError(f"{SNAPSHOTS_PARQUET} does not exist. Run inventory extraction first.")
    
    print("Merging cold-chain inventory snapshots and expiry horizons...")
    inv_df = pd.read_parquet(SNAPSHOTS_PARQUET)

    merged = demand_matrix.merge(inv_df, on=["date", "hospital_id", "blood_group", "component"], how="inner")

    # 4. Compute Derived Inventory Runway & Expiry Risk Features
    merged["available_units"] = np.maximum(0, merged["current_units"] - merged["units_expiring_1d"])
    merged["reserved_units"] = 0.0  # acute emergency reservation
    merged["expiry_ratio"] = merged["units_expiring_3d"] / np.maximum(1.0, merged["current_units"])
    
    # Inventory runway in days of demand
    merged["inventory_days_remaining"] = merged["current_units"] / np.maximum(0.1, merged["rolling_mean_7"])
    
    # Units needed to reach safety stock level
    safety_target_units = config.SHORTAGE_SAFETY_RESERVE_DAYS * merged["rolling_mean_7"]
    merged["units_required_to_reach_safety_level"] = np.maximum(0.0, safety_target_units - merged["current_units"])

    # Incoming supplies: modeled from morning replenishment buffer
    merged["incoming_units_24h"] = np.maximum(0.0, (config.HOSPITAL_PAR_LEVEL_DAYS * merged["rolling_mean_7"]) - merged["current_units"])
    merged["incoming_units_48h"] = merged["incoming_units_24h"] * 1.5
    merged["incoming_units_72h"] = merged["incoming_units_24h"] * 2.0

    # 5. Extract Future Shortage Labels (Strictly Future Windows)
    print("Generating strictly future shortage target labels (24h, 48h, 72h)...")
    labels_df = extract_future_shortage_labels()
    final_df = merged.merge(labels_df, on=["date", "hospital_id", "blood_group", "component"], how="inner")

    # Drop warm-up rows (first 28 days have lag NaNs) and final 3 days (incomplete target horizons)
    final_df = final_df.dropna(subset=["lag_28", "shortage_72h"]).copy()
    final_df["shortage_24h"] = final_df["shortage_24h"].astype(int)
    final_df["shortage_48h"] = final_df["shortage_48h"].astype(int)
    final_df["shortage_72h"] = final_df["shortage_72h"].astype(int)
    final_df.reset_index(drop=True, inplace=True)

    # Cache preprocessed feature matrix
    final_df.to_parquet(SHORTAGE_MATRIX_PARQUET, index=False)
    print(f"Shortage feature matrix successfully constructed and cached! Shape: {final_df.shape}")

    return final_df


def get_shortage_feature_columns() -> List[str]:
    """
    Return clean list of feature column names for training shortage early warning classifiers.
    """
    return [
        # Current Inventory & Expiry Risk
        "current_units", "available_units", "reserved_units",
        "units_expiring_1d", "units_expiring_2d", "units_expiring_3d", "units_expiring_5d",
        "expiry_ratio", "inventory_days_remaining", "units_required_to_reach_safety_level",
        # Incoming Supplies
        "incoming_units_24h", "incoming_units_48h", "incoming_units_72h",
        # Model 1 Forecast Signals
        "forecast_24h", "forecast_48h", "forecast_72h",
        "forecast_cumulative_24h", "forecast_cumulative_48h", "forecast_cumulative_72h",
        # Historical Demand Lags & Rolling Runways
        "lag_1", "lag_3", "lag_7", "lag_14",
        "rolling_mean_7", "rolling_mean_14", "rolling_mean_28",
        "rolling_std_7", "rolling_std_28",
        # Regional Blood Bank Network Availability
        "nearby_blood_bank_count", "available_nearby_units", "nearest_blood_bank_distance",
        # Pre-prediction Emergency & Disaster Signals
        "active_emergency_flag", "recent_emergency_count_24h", "recent_emergency_count_72h",
        "recent_mass_casualty_flag", "recent_max_severity", "recent_max_demand_mult",
        "disease_spike_flag", "transport_disruption_flag", "blood_drive_flag",
        # Context & Calendar Signals
        "day_of_week", "month", "season", "holiday_flag", "is_weekend",
        # Hospital Characteristics
        "bed_capacity", "icu_capacity", "emergency_capacity", "hospital_type", "avg_daily_demand",
        # Entities
        "hospital_id", "blood_group", "component"
    ]


def split_chronological(
    df: pd.DataFrame,
    train_end: str = "2025-05-25",
    val_end: str = "2025-09-12"
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split time series chronologically:
    - Train: start to train_end (first 70%)
    - Validation: (train_end + 1 day) to val_end (next 15%)
    - Test: (val_end + 1 day) to end (final 15%)
    """
    train_df = df[df["date"] <= train_end].copy()
    val_df = df[(df["date"] > train_end) & (df["date"] <= val_end)].copy()
    test_df = df[df["date"] > val_end].copy()
    return train_df, val_df, test_df


if __name__ == "__main__":
    df = prepare_shortage_feature_matrix(force_refresh=True)
    train, val, test = split_chronological(df)
    print(f"Train : {train['date'].min()} to {train['date'].max()} ({len(train):,} rows)")
    print(f"Val   : {val['date'].min()} to {val['date'].max()} ({len(val):,} rows)")
    print(f"Test  : {test['date'].min()} to {test['date'].max()} ({len(test):,} rows)")
    print("\nShortage Class Distribution on Test Set:")
    for h in ["24h", "48h", "72h"]:
        col = f"shortage_{h}"
        pos = int(test[col].sum())
        total = len(test)
        pct = pos / total * 100
        print(f"  {h} Target: {pos:,} / {total:,} ({pct:.2f}% shortage)")
