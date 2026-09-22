"""
AI Blood Supply Command Center - Demand Forecasting Feature Engineering
-----------------------------------------------------------------------
Builds an aligned, zero-leakage time series feature matrix for 24h, 48h, and 72h
blood demand forecasting across 30 hospitals, 8 blood groups, and 4 components.
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"

# Severity ordinal mapping for historical emergencies
SEVERITY_WEIGHTS = {
    "Minor": 1.0,
    "Moderate": 2.0,
    "Severe": 3.0,
    "Critical": 4.0
}


class DemandForecasterPipeline:
    """
    Self-contained end-to-end demand forecasting pipeline bundling
    categorical preprocessor, feature names, and trained XGBoost model.
    """
    def __init__(self, horizon: str, feature_cols: List[str], model: Any):
        self.horizon = horizon
        self.feature_cols = feature_cols
        self.model = model
        self.categorical_cols = ["hospital_id", "blood_group", "component", "hospital_type", "season", "weather"]

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        X_df = X[self.feature_cols].copy()
        for col in self.categorical_cols:
            if col in X_df.columns:
                X_df[col] = X_df[col].astype("category")
        preds = self.model.predict(X_df)
        return np.clip(preds, 0.0, None)


def build_cartesian_demand_grid(
    start_date: str = "2024-01-01",
    end_date: str = "2025-12-30"
) -> pd.DataFrame:
    """
    Construct continuous Cartesian grid of all dates, hospitals, blood groups, and components.
    Guarantees regular sampling without gaps or temporal distortion.
    """
    dates = pd.date_range(start_date, end_date, freq="D").strftime("%Y-%m-%d")
    hospitals = [f"HOSP_{i:03d}" for i in range(1, 31)]
    blood_groups = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]
    components = ["RBC", "Platelets", "Plasma", "Whole_Blood"]

    idx = pd.MultiIndex.from_product(
        [dates, hospitals, blood_groups, components],
        names=["date", "hospital_id", "blood_group", "component"]
    )
    grid = pd.DataFrame(index=idx).reset_index()
    return grid


def aggregate_blood_requests_daily(requests_csv: Path = DATA_RAW / "blood_requests.csv") -> pd.DataFrame:
    """
    Aggregate granular clinical requests into daily demand units by hospital, blood group, component.
    """
    req_df = pd.read_csv(requests_csv)
    req_df["date"] = req_df["timestamp"].str.slice(0, 10)
    agg = req_df.groupby(["date", "hospital_id", "blood_group", "component"], as_index=False)["units_required"].sum()
    agg.rename(columns={"units_required": "units_demanded"}, inplace=True)
    return agg


def build_emergency_historical_signals(
    emergencies_csv: Path = DATA_RAW / "emergency_events.csv",
    start_date: str = "2024-01-01",
    end_date: str = "2025-12-30"
) -> pd.DataFrame:
    """
    Construct strictly historical emergency features per (date, hospital_id) up to day t.
    Zero future information leakage.
    """
    em_df = pd.read_csv(emergencies_csv)
    em_df["evt_date"] = em_df["timestamp"].str.slice(0, 10)
    
    # Map each emergency to affected hospitals
    records = []
    for _, row in em_df.iterrows():
        dt = row["evt_date"]
        sev = SEVERITY_WEIGHTS.get(row["severity"], 1.0)
        is_mc = 1 if row["event_type"] == "mass_casualty" or row["severity"] == "Critical" else 0
        mult = float(row["blood_demand_multiplier"])
        h_list = [h.strip() for h in str(row["affected_hospitals"]).split(",") if h.strip()]
        for hid in h_list:
            records.append({
                "date": dt,
                "hospital_id": hid,
                "severity_score": sev,
                "is_mass_casualty": is_mc,
                "demand_mult": mult,
                "event_count": 1
            })

    em_hosp_df = pd.DataFrame(records)
    if not em_hosp_df.empty:
        em_daily = em_hosp_df.groupby(["date", "hospital_id"], as_index=False).agg({
            "event_count": "sum",
            "severity_score": "max",
            "is_mass_casualty": "max",
            "demand_mult": "max"
        })
    else:
        em_daily = pd.DataFrame(columns=["date", "hospital_id", "event_count", "severity_score", "is_mass_casualty", "demand_mult"])

    # Build dense grid of date x hospital
    dates = pd.date_range(start_date, end_date, freq="D").strftime("%Y-%m-%d")
    hosps = [f"HOSP_{i:03d}" for i in range(1, 31)]
    base_grid = pd.DataFrame(index=pd.MultiIndex.from_product([dates, hosps], names=["date", "hospital_id"])).reset_index()
    
    em_dense = base_grid.merge(em_daily, on=["date", "hospital_id"], how="left")
    em_dense["event_count"] = em_dense["event_count"].fillna(0).astype(int)
    em_dense["severity_score"] = em_dense["severity_score"].fillna(0.0).astype(float)
    em_dense["is_mass_casualty"] = em_dense["is_mass_casualty"].fillna(0).astype(int)
    em_dense["demand_mult"] = em_dense["demand_mult"].fillna(1.0).astype(float)

    # Sort to compute past rolling emergency counts
    em_dense.sort_values(["hospital_id", "date"], inplace=True)
    grp = em_dense.groupby("hospital_id")

    # Features available at day t (current day t active emergencies + past 72h window)
    em_dense["active_emergency_flag"] = (em_dense["event_count"] > 0).astype(int)
    em_dense["recent_emergency_count_24h"] = em_dense["event_count"]
    # Past 72h window (t-2, t-1, t)
    em_dense["recent_emergency_count_72h"] = grp["event_count"].rolling(3, min_periods=1).sum().values
    em_dense["recent_mass_casualty_flag"] = grp["is_mass_casualty"].rolling(3, min_periods=1).max().values
    em_dense["recent_max_severity"] = grp["severity_score"].rolling(3, min_periods=1).max().values
    em_dense["recent_max_demand_mult"] = grp["demand_mult"].rolling(3, min_periods=1).max().values

    return em_dense[[
        "date", "hospital_id",
        "active_emergency_flag", "recent_emergency_count_24h",
        "recent_emergency_count_72h", "recent_mass_casualty_flag",
        "recent_max_severity", "recent_max_demand_mult"
    ]]


def prepare_demand_feature_matrix(
    data_dir: Path = DATA_RAW,
    start_date: str = "2024-01-01",
    end_date: str = "2025-12-30"
) -> pd.DataFrame:
    """
    Assemble the complete multi-horizon time-series feature matrix.
    Guarantees strict zero-leakage historical features and deterministic calendar signals.
    """
    # 1. Base grid
    grid = build_cartesian_demand_grid(start_date=start_date, end_date=end_date)
    
    # 2. Merge daily demand
    agg = aggregate_blood_requests_daily(data_dir / "blood_requests.csv")
    grid = grid.merge(agg, on=["date", "hospital_id", "blood_group", "component"], how="left")
    grid["units_demanded"] = grid["units_demanded"].fillna(0).astype(np.float32)

    # Sort strictly for sequential series processing
    grid.sort_values(["hospital_id", "blood_group", "component", "date"], inplace=True)
    grid.reset_index(drop=True, inplace=True)

    # 3. Time series lags and rolling features (shifted strictly to past)
    grp = grid.groupby(["hospital_id", "blood_group", "component"])["units_demanded"]

    for l in [1, 2, 3, 7, 14, 28]:
        grid[f"lag_{l}"] = grp.shift(l)

    # Multi-horizon forecasting targets
    grid["target_24h"] = grp.shift(-1)  # t + 1 day
    grid["target_48h"] = grp.shift(-2)  # t + 2 days
    grid["target_72h"] = grp.shift(-3)  # t + 3 days

    # Past rolling statistics: shift by 1 day so that prediction at day t uses only [t-k, ..., t-1]
    # For day t prediction, current day t's final demand is not completed until midnight.
    # Therefore, lag_1 is day t-1's completed demand.
    s1 = grp.shift(1)
    sub_grp = s1.groupby([grid["hospital_id"], grid["blood_group"], grid["component"]])
    grid["rolling_mean_3"] = sub_grp.rolling(3).mean().values
    grid["rolling_mean_7"] = sub_grp.rolling(7).mean().values
    grid["rolling_mean_14"] = sub_grp.rolling(14).mean().values
    grid["rolling_mean_28"] = sub_grp.rolling(28).mean().values
    grid["rolling_std_7"] = sub_grp.rolling(7).std().fillna(0).values
    grid["rolling_std_28"] = sub_grp.rolling(28).std().fillna(0).values

    # 4. Hospital metadata
    hosps = pd.read_csv(data_dir / "hospitals.csv")
    grid = grid.merge(
        hosps[[
            "hospital_id", "hospital_type", "bed_capacity",
            "icu_capacity", "emergency_capacity", "blood_storage_capacity",
            "avg_daily_demand"
        ]],
        on="hospital_id",
        how="left"
    )

    # 5. Context & Weather metadata
    ctx = pd.read_csv(data_dir / "events_context.csv")
    grid = grid.merge(
        ctx[[
            "date", "temperature", "rainfall", "weather",
            "holiday_flag", "accident_count", "disease_spike_flag",
            "blood_drive_flag", "transport_disruption_flag"
        ]],
        on="date",
        how="left"
    )

    # 6. Emergency events historical signals
    em_signals = build_emergency_historical_signals(
        emergencies_csv=data_dir / "emergency_events.csv",
        start_date=start_date,
        end_date=end_date
    )
    grid = grid.merge(em_signals, on=["date", "hospital_id"], how="left")

    # 7. Calendar and Seasonality features (deterministic calendar attributes for day t)
    dt_series = pd.to_datetime(grid["date"])
    grid["day_of_week"] = dt_series.dt.dayofweek
    grid["day_of_month"] = dt_series.dt.day
    grid["month"] = dt_series.dt.month
    grid["week_of_year"] = dt_series.dt.isocalendar().week.astype(int)
    grid["is_weekend"] = grid["day_of_week"].isin([5, 6]).astype(int)

    def month_to_season(m: int) -> str:
        if m in [12, 1, 2]:
            return "Winter"
        elif m in [3, 4, 5]:
            return "Summer"
        elif m in [6, 7, 8, 9]:
            return "Monsoon"
        else:
            return "Autumn"

    grid["season"] = grid["month"].apply(month_to_season)

    # Target-specific calendar attributes (advance knowledge of target day day_of_week & weekend)
    for h_name, offset in [("24h", 1), ("48h", 2), ("72h", 3)]:
        t_dt = dt_series + pd.Timedelta(days=offset)
        grid[f"target_dow_{h_name}"] = t_dt.dt.dayofweek
        grid[f"target_is_weekend_{h_name}"] = grid[f"target_dow_{h_name}"].isin([5, 6]).astype(int)

    # Drop warm-up rows (first 28 days have incomplete 28-day lags)
    # and drop final 3 days (incomplete target horizons)
    valid_df = grid.dropna(subset=["lag_28", "target_72h"]).copy()
    valid_df.reset_index(drop=True, inplace=True)

    return valid_df


def get_feature_columns(horizon: str = "24h") -> List[str]:
    """
    Return clean list of feature column names for training a specific horizon model.
    """
    common_features = [
        # Demand lags & past rolling stats
        "lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28",
        "rolling_mean_3", "rolling_mean_7", "rolling_mean_14", "rolling_mean_28",
        "rolling_std_7", "rolling_std_28",
        # Current calendar & seasonality
        "day_of_week", "day_of_month", "month", "week_of_year", "is_weekend",
        "season", "holiday_flag",
        # Target day calendar signals
        f"target_dow_{horizon}", f"target_is_weekend_{horizon}",
        # Weather & Regional context
        "temperature", "rainfall", "weather", "accident_count",
        "disease_spike_flag", "blood_drive_flag", "transport_disruption_flag",
        # Pre-prediction Emergency signals
        "active_emergency_flag", "recent_emergency_count_24h",
        "recent_emergency_count_72h", "recent_mass_casualty_flag",
        "recent_max_severity", "recent_max_demand_mult",
        # Hospital characteristics
        "bed_capacity", "icu_capacity", "emergency_capacity",
        "blood_storage_capacity", "avg_daily_demand", "hospital_type",
        # Entity categoricals
        "hospital_id", "blood_group", "component"
    ]
    return common_features


def split_chronological(
    df: pd.DataFrame,
    train_end: str = "2025-05-25",
    val_end: str = "2025-09-12"
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split time series chronologically:
    - Train: start to train_end (first 70% of days)
    - Validation: (train_end + 1 day) to val_end (next 15% of days)
    - Test: (val_end + 1 day) to end (final 15% of days)
    """
    train_df = df[df["date"] <= train_end].copy()
    val_df = df[(df["date"] > train_end) & (df["date"] <= val_end)].copy()
    test_df = df[df["date"] > val_end].copy()
    return train_df, val_df, test_df


if __name__ == "__main__":
    print("Building demand feature matrix...")
    df = prepare_demand_feature_matrix()
    print(f"Feature matrix complete! Shape: {df.shape}")
    train, val, test = split_chronological(df)
    print(f"Train: {train['date'].min()} to {train['date'].max()} ({len(train)} rows)")
    print(f"Val:   {val['date'].min()} to {val['date'].max()} ({len(val)} rows)")
    print(f"Test:  {test['date'].min()} to {test['date'].max()} ({len(test)} rows)")
