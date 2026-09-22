"""
AI Blood Supply Command Center - Donor Dispatch Scenario Evaluation
-------------------------------------------------------------------
Systematically evaluates Model 3 Intelligent Donor Dispatch against the 9 operational
stress scenarios configured in the simulation.
Outputs structured JSON and tabular summaries for technical reporting and notebook visualization.
"""

import json
from pathlib import Path
from typing import Dict, List, Any
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REPORTS_DIR = PROJECT_ROOT / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import config
from donor_ranker import rank_donors

SCENARIO_CONFIGS = {
    "normal_operations": {
        "name": "Normal Operating Baseline",
        "hospital_id": "HOSP_001",
        "blood_group": "O_POS",
        "component": "RBC",
        "urgency": "routine",
        "required_units": 2,
        "horizon": "24h",
        "shortage_prob": 0.05
    },
    "moderate_demand_spike": {
        "name": "Holiday Festival Demand Spike",
        "hospital_id": "HOSP_002",
        "blood_group": "A_POS",
        "component": "RBC",
        "urgency": "urgent",
        "required_units": 4,
        "horizon": "24h",
        "shortage_prob": 0.28
    },
    "major_mass_casualty": {
        "name": "Industrial Chemical Explosion Catastrophe",
        "hospital_id": "HOSP_007",
        "blood_group": "O_NEG",
        "component": "RBC",
        "urgency": "emergency",
        "required_units": 10,
        "horizon": "24h",
        "shortage_prob": 0.85
    },
    "multiple_hospital_shortages": {
        "name": "Peak Monsoon Dengue Outbreak Wave",
        "hospital_id": "HOSP_003",
        "blood_group": "B_POS",
        "component": "Platelets",
        "urgency": "urgent",
        "required_units": 6,
        "horizon": "48h",
        "shortage_prob": 0.72
    },
    "o_negative_crisis": {
        "name": "Severe O-Negative Emergency Deficit",
        "hospital_id": "HOSP_007",
        "blood_group": "O_NEG",
        "component": "RBC",
        "urgency": "emergency",
        "required_units": 8,
        "horizon": "24h",
        "shortage_prob": 0.92
    },
    "blood_bank_failure": {
        "name": "Regional Hub Cooling System Failure",
        "hospital_id": "HOSP_005",
        "blood_group": "A_NEG",
        "component": "RBC",
        "urgency": "urgent",
        "required_units": 5,
        "horizon": "48h",
        "shortage_prob": 0.68
    },
    "transport_disruption": {
        "name": "Monsoon Arterial Highway Inundation",
        "hospital_id": "HOSP_009",
        "blood_group": "AB_POS",
        "component": "Plasma",
        "urgency": "urgent",
        "required_units": 3,
        "horizon": "48h",
        "shortage_prob": 0.54
    },
    "platelet_expiry_wave": {
        "name": "Post-Drive Platelet Surplus & Expiry Wave",
        "hospital_id": "HOSP_006",
        "blood_group": "O_POS",
        "component": "Platelets",
        "urgency": "routine",
        "required_units": 4,
        "horizon": "72h",
        "shortage_prob": 0.40
    },
    "donor_availability_slump": {
        "name": "Severe Summer Heatwave Donor Slump",
        "hospital_id": "HOSP_001",
        "blood_group": "O_POS",
        "component": "RBC",
        "urgency": "routine",
        "required_units": 5,
        "horizon": "24h",
        "shortage_prob": 0.62
    }
}


def run_scenario_evaluations() -> Dict[str, Any]:
    """Execute evaluation across all 9 scenarios and store results."""
    results = {}

    print("=" * 70)
    print("MODEL 3: INTELLIGENT DONOR DISPATCH — 9 SCENARIO EVALUATION SUITE")
    print("=" * 70)

    for sc_id, cfg in SCENARIO_CONFIGS.items():
        res = rank_donors(
            hospital_id=cfg["hospital_id"],
            blood_group=cfg["blood_group"],
            component=cfg["component"],
            urgency=cfg["urgency"],
            required_units=cfg["required_units"],
            prediction_horizon=cfg["horizon"],
            top_k=10,
            shortage_prob_override=cfg["shortage_prob"]
        )

        pool = res["candidate_pool_summary"]
        top_d = res["top_donors"][0] if res["top_donors"] else None

        sc_summary = {
            "scenario_id": sc_id,
            "scenario_name": cfg["name"],
            "hospital_id": cfg["hospital_id"],
            "blood_group": cfg["blood_group"],
            "component": cfg["component"],
            "urgency": cfg["urgency"],
            "shortage_horizon": cfg["horizon"],
            "shortage_probability": cfg["shortage_prob"],
            "shortage_risk_tier": "CRITICAL" if cfg["shortage_prob"] >= 0.75 else ("HIGH" if cfg["shortage_prob"] >= 0.50 else ("MEDIUM" if cfg["shortage_prob"] >= 0.20 else "LOW")),
            "total_eligible_donors": pool["total_eligible_candidates"],
            "exact_blood_match_count": pool["exact_blood_match_count"],
            "compatible_donor_count": pool["exact_blood_match_count"] + pool["compatible_alternative_count"],
            "candidates_within_5km": pool["candidates_within_5km"],
            "candidates_within_10km": pool["candidates_within_10km"],
            "candidates_within_25km": pool["candidates_within_25km"],
            "median_candidate_distance_km": pool["median_candidate_distance_km"],
            "expected_top10_response_yield": pool["expected_top_k_response_yield"],
            "top_ranked_donor": {
                "donor_id": top_d["donor_id"] if top_d else "None",
                "distance_km": top_d["distance_km"] if top_d else 0.0,
                "priority_score": top_d["priority_score"] if top_d else 0.0,
                "priority_tier": top_d["priority_tier"] if top_d else "None",
                "response_probability": top_d["response_probability"] if top_d else 0.0,
                "travel_time_min": top_d["estimated_travel_time_min"] if top_d else 0.0
            } if top_d else None
        }

        results[sc_id] = sc_summary

        print(f"\n[Scenario: {cfg['name']}]")
        print(f"  Hospital: {cfg['hospital_id']} | Need: {cfg['blood_group']} {cfg['component']} ({cfg['urgency'].upper()})")
        print(f"  Shortage Risk: {sc_summary['shortage_risk_tier']} (P={cfg['shortage_prob']:.2f})")
        print(f"  Eligible Candidates: {pool['total_eligible_candidates']} (Within 5km: {pool['candidates_within_5km']}, Within 10km: {pool['candidates_within_10km']})")
        if top_d:
            print(f"  Top Donor: {top_d['donor_id']} | Dist: {top_d['distance_km']} km | Score: {top_d['priority_score']} | Tier: {top_d['priority_tier']}")

    output_path = REPORTS_DIR / "donor_scenario_evaluations.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved scenario evaluation results to {output_path}")

    return results


if __name__ == "__main__":
    run_scenario_evaluations()
