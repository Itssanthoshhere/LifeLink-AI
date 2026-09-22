"""
AI Blood Supply Command Center - Demand Inference Engine
---------------------------------------------------------
Provides programmatic and command-line inference for predicting next 24h, 48h,
and 72h blood demand for any (hospital, blood_group, component).

CLINICAL DISCLAIMER:
These predictions are machine-learning estimates intended for logistical decision
support in the Command Center. They do NOT constitute medical recommendations or
direct transfusion orders.
"""

import argparse
import json
import pickle
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DATA_RAW = PROJECT_ROOT / "data" / "raw"

from demand_features import DemandForecasterPipeline

# Cache loaded models in memory
_CACHED_MODELS = {}
_CACHED_FEATURE_DF = None


def load_model(horizon: str):
    """Load cached model pipeline for specified horizon (24h, 48h, 72h)."""
    global _CACHED_MODELS
    if horizon not in _CACHED_MODELS:
        model_path = MODELS_DIR / f"demand_xgb_{horizon}.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Trained model not found at {model_path}. Please run train_demand_model.py first.")
        with open(model_path, "rb") as f:
            _CACHED_MODELS[horizon] = pickle.load(f)
    return _CACHED_MODELS[horizon]


def get_cached_feature_matrix() -> pd.DataFrame:
    """Load or cache feature matrix for historical inference lookups."""
    global _CACHED_FEATURE_DF
    if _CACHED_FEATURE_DF is None:
        from demand_features import prepare_demand_feature_matrix
        _CACHED_FEATURE_DF = prepare_demand_feature_matrix()
    return _CACHED_FEATURE_DF


def predict_demand(
    hospital_id: str,
    blood_group: str,
    component: str,
    as_of_date: Optional[str] = None,
    context_overrides: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate 24h, 48h, and 72h demand forecasts for a given hospital, blood group, and component.

    Parameters:
        hospital_id: Hospital identifier (e.g., 'HOSP_007')
        blood_group: ABO/Rh group (e.g., 'O_NEG', 'A_POS')
        component: Blood product ('RBC', 'Platelets', 'Plasma', 'Whole_Blood')
        as_of_date: Date to predict from (YYYY-MM-DD). If None, defaults to the latest available date.
        context_overrides: Optional dictionary of feature overrides (e.g. active_emergency_flag=1)

    Returns:
        Dictionary containing predictions, horizon breakdown, context metadata, and safety notice.
    """
    hospital_id = hospital_id.upper().strip()
    blood_group = blood_group.upper().strip()
    # Normalize component capitalization
    comp_map = {
        "rbc": "RBC", "platelets": "Platelets", "plasma": "Plasma", "whole_blood": "Whole_Blood",
        "wholeblood": "Whole_Blood", "platelet": "Platelets"
    }
    component = comp_map.get(component.lower().strip(), component)

    df_feats = get_cached_feature_matrix()

    if as_of_date is None:
        as_of_date = str(df_feats["date"].max())

    # Find matching row
    match = df_feats[
        (df_feats["date"] == as_of_date) &
        (df_feats["hospital_id"] == hospital_id) &
        (df_feats["blood_group"] == blood_group) &
        (df_feats["component"] == component)
    ]

    if match.empty:
        # If specific date not found, find nearest past date for this entity
        entity_matches = df_feats[
            (df_feats["hospital_id"] == hospital_id) &
            (df_feats["blood_group"] == blood_group) &
            (df_feats["component"] == component)
        ]
        if entity_matches.empty:
            raise ValueError(f"Unknown entity combination: {hospital_id}, {blood_group}, {component}")
        match = entity_matches.iloc[[-1]].copy()
        effective_date = str(match["date"].values[0])
    else:
        match = match.copy()
        effective_date = as_of_date

    # Apply context overrides if provided
    if context_overrides:
        for k, v in context_overrides.items():
            if k in match.columns:
                match[k] = v

    results = {}
    for h in ["24h", "48h", "72h"]:
        pipeline = load_model(h)
        pred = float(pipeline.predict(match)[0])
        # Demand cannot be negative
        pred = max(0.0, round(pred, 2))
        results[h] = pred

    return {
        "status": "success",
        "query": {
            "hospital_id": hospital_id,
            "blood_group": blood_group,
            "component": component,
            "as_of_date": as_of_date,
            "effective_date_used": effective_date
        },
        "forecast": {
            "24h_units": results["24h"],
            "48h_units": results["48h"],
            "72h_units": results["72h"],
            "total_72h_cumulative": round(results["24h"] + results["48h"] + results["72h"], 2)
        },
        "context_snapshot": {
            "hospital_type": str(match["hospital_type"].values[0]),
            "bed_capacity": int(match["bed_capacity"].values[0]),
            "active_emergency": int(match["active_emergency_flag"].values[0]),
            "season": str(match["season"].values[0]),
            "recent_7d_avg_demand": round(float(match["rolling_mean_7"].values[0]), 2)
        },
        "disclaimer": "MODEL PREDICTIONS ONLY — NOT CLINICAL TRANSFUSION DIRECTIVES. Use for logistical supply-chain planning and Command Center decision support only."
    }


def main():
    parser = argparse.ArgumentParser(description="Predict blood product demand for a hospital, blood group, and component.")
    parser.add_argument("--hospital", type=str, default="HOSP_007", help="Hospital ID (e.g. HOSP_007, HOSP_003)")
    parser.add_argument("--blood_group", type=str, default="O_NEG", help="Blood group (e.g. O_NEG, A_POS, B_POS)")
    parser.add_argument("--component", type=str, default="RBC", help="Component (RBC, Platelets, Plasma, Whole_Blood)")
    parser.add_argument("--date", type=str, default=None, help="As-of prediction date (YYYY-MM-DD)")
    parser.add_argument("--emergency", action="store_true", help="Simulate an active emergency condition")
    parser.add_argument("--json", action="store_true", help="Output raw JSON format")

    args = parser.parse_args()

    overrides = {}
    if args.emergency:
        overrides["active_emergency_flag"] = 1
        overrides["recent_emergency_count_24h"] = 2
        overrides["recent_max_demand_mult"] = 2.5

    res = predict_demand(
        hospital_id=args.hospital,
        blood_group=args.blood_group,
        component=args.component,
        as_of_date=args.date,
        context_overrides=overrides if overrides else None
    )

    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print("\n" + "=" * 60)
        print("AI BLOOD SUPPLY COMMAND CENTER — DEMAND FORECAST")
        print("=" * 60)
        q = res["query"]
        f = res["forecast"]
        c = res["context_snapshot"]
        print(f"Hospital    : {q['hospital_id']} ({c['hospital_type']}, Beds: {c['bed_capacity']})")
        print(f"Blood Group : {q['blood_group']}")
        print(f"Component   : {q['component']}")
        print(f"As-of Date  : {q['as_of_date']} (Effective: {q['effective_date_used']})")
        print(f"Status      : {'EMERGENCY ACTIVE' if c['active_emergency'] == 1 else 'Normal Operations'}")
        print(f"7-Day Avg   : {c['recent_7d_avg_demand']} units/day")
        print("-" * 60)
        print(f"24h forecast : {f['24h_units']} units")
        print(f"48h forecast : {f['48h_units']} units")
        print(f"72h forecast : {f['72h_units']} units")
        print(f"72h cumulative : {f['total_72h_cumulative']} units")
        print("-" * 60)
        print(f"Notice: {res['disclaimer']}")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
