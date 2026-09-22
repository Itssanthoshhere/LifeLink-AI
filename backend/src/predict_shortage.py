"""
AI Blood Supply Command Center - Shortage Prediction Inference Engine
----------------------------------------------------------------------
Provides programmatic and command-line early warning inference for predicting
shortage probability (24h, 48h, 72h), risk tiers, and structured contributing factors.

CLINICAL DISCLAIMER:
These predictions are machine-learning decision-support estimates intended for
logistical management in the Command Center. They do NOT constitute medical recommendations
or clinical directives.
"""

import argparse
import json
import pickle
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"

import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
from shortage_features import ShortagePredictorPipeline, prepare_shortage_feature_matrix
import config

_CACHED_SHORTAGE_MODELS = {}
_CACHED_FEATURE_DF = None


def load_shortage_model(horizon: str) -> ShortagePredictorPipeline:
    """Load cached shortage early warning pipeline for specified horizon (24h, 48h, 72h)."""
    global _CACHED_SHORTAGE_MODELS
    if horizon not in _CACHED_SHORTAGE_MODELS:
        model_path = MODELS_DIR / f"shortage_xgb_{horizon}.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Trained model not found at {model_path}. Please run train_shortage_model.py first.")
        with open(model_path, "rb") as f:
            _CACHED_SHORTAGE_MODELS[horizon] = pickle.load(f)
    return _CACHED_SHORTAGE_MODELS[horizon]


def get_cached_shortage_matrix() -> pd.DataFrame:
    """Load or cache feature matrix for inference lookups."""
    global _CACHED_FEATURE_DF
    if _CACHED_FEATURE_DF is None:
        _CACHED_FEATURE_DF = prepare_shortage_feature_matrix()
    return _CACHED_FEATURE_DF


def generate_contributing_factors(row: pd.Series) -> List[str]:
    """
    Generate transparent, non-causal structured model contributing factors.
    """
    factors = []

    # 1. Runway check
    runway = float(row.get("inventory_days_remaining", 2.0))
    curr_u = float(row.get("current_units", 5.0))
    if runway < 1.0 or curr_u <= 1.0:
        factors.append(f"Critically low inventory runway ({runway:.1f} days of demand remaining, {curr_u:.0f} units in stock)")
    elif runway < 2.0:
        factors.append(f"Constrained inventory runway ({runway:.1f} days remaining)")

    # 2. Demand forecast
    f24 = float(row.get("forecast_24h", 0.0))
    f72 = float(row.get("forecast_cumulative_72h", 0.0))
    if f72 > curr_u:
        factors.append(f"Cumulative 72h demand forecast ({f72:.1f} units) exceeds current standing stock ({curr_u:.0f} units)")
    elif f24 > 3.0:
        factors.append(f"Elevated immediate 24h demand forecast ({f24:.1f} units)")

    # 3. Expiry risk
    exp3 = float(row.get("units_expiring_3d", 0.0))
    if exp3 > 0:
        factors.append(f"Perishable stock expiry risk ({exp3:.0f} units expiring within 72 hours)")

    # 4. Incoming supply
    inc24 = float(row.get("incoming_units_24h", 0.0))
    if inc24 == 0:
        factors.append("No immediate incoming replenishment scheduled in next 24h")

    # 5. Emergency conditions
    if int(row.get("active_emergency_flag", 0)) == 1:
        mult = float(row.get("recent_max_demand_mult", 1.0))
        factors.append(f"Active emergency condition impacting facility (Demand multiplier: {mult:.1f}x)")

    # 6. Regional network availability
    nearby_u = float(row.get("available_nearby_units", 1000.0))
    if nearby_u < 100:
        factors.append("Depleted regional blood bank reserves across nearby distribution hubs")

    if not factors:
        factors.append("Stable buffer inventory and predictable baseline demand profile")

    return factors


def predict_shortage(
    hospital_id: str,
    blood_group: str,
    component: str,
    as_of_date: Optional[str] = None,
    context_overrides: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Predict 24h, 48h, and 72h shortage probabilities and risk levels for a facility.
    """
    hospital_id = hospital_id.upper().strip()
    blood_group = blood_group.upper().strip()
    comp_map = {
        "rbc": "RBC", "platelets": "Platelets", "plasma": "Plasma", "whole_blood": "Whole_Blood",
        "wholeblood": "Whole_Blood", "platelet": "Platelets"
    }
    component = comp_map.get(component.lower().strip(), component)

    df_feats = get_cached_shortage_matrix()

    if as_of_date is None:
        as_of_date = str(df_feats["date"].max())

    match = df_feats[
        (df_feats["date"] == as_of_date) &
        (df_feats["hospital_id"] == hospital_id) &
        (df_feats["blood_group"] == blood_group) &
        (df_feats["component"] == component)
    ]

    if match.empty:
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

    # Context overrides
    if context_overrides:
        for k, v in context_overrides.items():
            if k in match.columns:
                match[k] = v

    row = match.iloc[0]
    results = {}
    for h in ["24h", "48h", "72h"]:
        pipe = load_shortage_model(h)
        prob = float(pipe.predict_proba(match)[0])
        prob = max(0.0, min(1.0, prob))
        risk = pipe.get_risk_level(prob)
        results[h] = {
            "probability": round(prob, 4),
            "risk_level": risk
        }

    contributing_factors = generate_contributing_factors(row)

    return {
        "status": "success",
        "query": {
            "hospital_id": hospital_id,
            "blood_group": blood_group,
            "component": component,
            "as_of_date": as_of_date,
            "effective_date_used": effective_date
        },
        "inventory_status": {
            "current_stock_units": int(row.get("current_units", 0)),
            "available_units": int(row.get("available_units", 0)),
            "inventory_days_remaining": round(float(row.get("inventory_days_remaining", 0.0)), 1)
        },
        "demand_forecast": {
            "24h_units": round(float(row.get("forecast_24h", 0.0)), 1),
            "48h_units": round(float(row.get("forecast_48h", 0.0)), 1),
            "72h_units": round(float(row.get("forecast_72h", 0.0)), 1),
            "72h_cumulative": round(float(row.get("forecast_cumulative_72h", 0.0)), 1)
        },
        "expiring_units": {
            "next_24h": int(row.get("units_expiring_1d", 0)),
            "next_48h": int(row.get("units_expiring_2d", 0)),
            "next_72h": int(row.get("units_expiring_3d", 0))
        },
        "incoming_units": {
            "next_24h": int(row.get("incoming_units_24h", 0)),
            "next_48h": int(row.get("incoming_units_48h", 0)),
            "next_72h": int(row.get("incoming_units_72h", 0))
        },
        "risk_assessment": results,
        "contributing_factors": contributing_factors,
        "disclaimer": "MODEL OUTPUT ONLY — NOT A CLINICAL DIRECTIVE. Intended strictly for Command Center logistical supply-chain planning."
    }


def main():
    parser = argparse.ArgumentParser(description="Predict blood product shortage risk for a hospital.")
    parser.add_argument("--hospital", type=str, default="HOSP_007", help="Hospital ID (e.g. HOSP_007)")
    parser.add_argument("--blood_group", type=str, default="O_NEG", help="Blood group (e.g. O_NEG, A_POS)")
    parser.add_argument("--component", type=str, default="RBC", help="Blood component (RBC, Platelets, Plasma, Whole_Blood)")
    parser.add_argument("--date", type=str, default=None, help="As-of prediction date (YYYY-MM-DD)")
    parser.add_argument("--emergency", action="store_true", help="Simulate an active disaster/emergency event")
    parser.add_argument("--json", action="store_true", help="Output raw JSON response")

    args = parser.parse_args()

    overrides = {}
    if args.emergency:
        overrides["active_emergency_flag"] = 1
        overrides["recent_emergency_count_24h"] = 2
        overrides["recent_max_demand_mult"] = 2.8

    res = predict_shortage(
        hospital_id=args.hospital,
        blood_group=args.blood_group,
        component=args.component,
        as_of_date=args.date,
        context_overrides=overrides if overrides else None
    )

    if args.json:
        print(json.dumps(res, indent=2))
    else:
        q = res["query"]
        inv = res["inventory_status"]
        dem = res["demand_forecast"]
        exp = res["expiring_units"]
        inc = res["incoming_units"]
        risk = res["risk_assessment"]

        print("\n" + "=" * 60)
        print("AI BLOOD SUPPLY COMMAND CENTER — SHORTAGE EARLY WARNING")
        print("=" * 60)
        print(f"Hospital       : {q['hospital_id']}")
        print(f"Blood Group    : {q['blood_group']}")
        print(f"Component      : {q['component']}")
        print(f"Current Stock  : {inv['current_stock_units']} units ({inv['inventory_days_remaining']} days runway)")
        print("\nDemand Forecast:")
        print(f"24h            : {dem['24h_units']} units")
        print(f"48h            : {dem['48h_units']} units")
        print(f"72h            : {dem['72h_units']} units (Cumulative: {dem['72h_cumulative']} units)")
        print("\nExpiring:")
        print(f"Next 24h       : {exp['next_24h']} units")
        print(f"Next 48h       : {exp['next_48h']} units")
        print(f"Next 72h       : {exp['next_72h']} units")
        print("\nIncoming:")
        print(f"24h            : {inc['next_24h']} units")
        print(f"48h            : {inc['next_48h']} units")
        print(f"72h            : {inc['next_72h']} units")
        print("-" * 60)
        p24 = int(round(risk['24h']['probability'] * 100))
        p48 = int(round(risk['48h']['probability'] * 100))
        p72 = int(round(risk['72h']['probability'] * 100))
        print(f"24h Risk       : {p24}% ({risk['24h']['risk_level']})")
        print(f"48h Risk       : {p48}% ({risk['48h']['risk_level']})")
        print(f"72h Risk       : {p72}% ({risk['72h']['risk_level']})")
        print("-" * 60)
        print("MODEL CONTRIBUTING FACTORS:")
        for factor in res["contributing_factors"]:
            print(f"• {factor}")
        print("\n" + res["disclaimer"])
        print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
