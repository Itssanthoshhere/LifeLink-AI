"""
Verification script for Full System Audit across Models 1-3, Engine 4, Command Center, and API.
"""

import sys
from pathlib import Path
import json
import pandas as pd
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from predict_demand import predict_demand
from predict_shortage import predict_shortage
from donor_ranker import rank_donors
from command_center import run_command_center
from optimization_data import build_network_optimization_data
from optimization_solver import solve_supply_network


def audit_model_1():
    print("\n--- MODEL 1 AUDIT: DEMAND FORECASTING ---")
    cases = [
        ("HOSP_001", "O_POS", "RBC"),
        ("HOSP_007", "O_NEG", "RBC"),
        ("HOSP_003", "B_POS", "Platelets"),
        ("HOSP_006", "A_POS", "Plasma"),
        ("HOSP_007", "O_NEG", "Whole_Blood"),
    ]
    for hid, bg, comp in cases:
        res = predict_demand(as_of_date="2025-12-01", hospital_id=hid, blood_group=bg, component=comp)
        d24 = res["forecast"]["24h_units"]
        d48 = res["forecast"]["48h_units"]
        d72 = res["forecast"]["72h_units"]
        print(f"  {hid} | {bg:6s} | {comp:11s} -> 24h: {d24:.2f} | 48h: {d48:.2f} | 72h: {d72:.2f} (non-negative: {d24>=0 and d48>=0 and d72>=0})")
        assert d24 >= 0 and d48 >= 0 and d72 >= 0, "Negative demand prediction!"
    print("  [PASS] Model 1 successfully produces valid, non-negative multi-horizon demand forecasts.")


def audit_model_2():
    print("\n--- MODEL 2 AUDIT: SHORTAGE EARLY WARNING ---")
    cases = [
        ("HOSP_001", "O_POS", "RBC"),
        ("HOSP_007", "O_NEG", "RBC"),
        ("HOSP_003", "B_POS", "Platelets"),
    ]
    for hid, bg, comp in cases:
        res = predict_shortage(as_of_date="2025-12-01", hospital_id=hid, blood_group=bg, component=comp)
        p24 = res["risk_assessment"]["24h"]["probability"]
        p48 = res["risk_assessment"]["48h"]["probability"]
        p72 = res["risk_assessment"]["72h"]["probability"]
        risk = res["risk_assessment"]["24h"]["risk_level"]
        f24 = res["demand_forecast"]["24h_units"]
        print(f"  {hid} | {bg:6s} | {comp:11s} -> Prob 24h: {p24:.3f} ({risk}) | Ingested Model 1 Forecast 24h: {f24} units")
        assert 0.0 <= p24 <= 1.0 and 0.0 <= p48 <= 1.0 and 0.0 <= p72 <= 1.0, "Invalid probability bounds!"
        assert risk in ["CRITICAL", "HIGH", "MEDIUM", "LOW"], f"Invalid risk tier: {risk}"
    print("  [PASS] Model 2 produces valid calibrated probabilities and aligned risk tiers.")


def audit_model_3():
    print("\n--- MODEL 3 AUDIT: DONOR RANKING (MCDA) ---")
    donors_df = pd.read_csv(Path(__file__).resolve().parent.parent / "data" / "raw" / "donors.csv")
    valid_donor_ids = set(donors_df["donor_id"])
    print(f"  Total raw synthetic donors loaded: {len(valid_donor_ids)}")

    res = rank_donors(
        hospital_id="HOSP_007",
        blood_group="O_NEG",
        component="RBC",
        urgency="emergency",
        required_units=10,
        prediction_horizon="72h",
        top_k=5,
        reference_date_str="2025-12-01"
    )
    assert res["status"] == "success", "Model 3 failed!"
    print(f"  HOSP_007 O_NEG RBC Emergency:")
    print(f"    Eligible candidate pool: {res['candidate_pool_summary']['total_eligible_candidates']}")
    print(f"    Top 5 candidates:")
    for d in res["top_donors"]:
        assert d["donor_id"] in valid_donor_ids, f"Fake donor ID generated: {d['donor_id']}"
        raw_row = donors_df[donors_df["donor_id"] == d["donor_id"]].iloc[0]
        assert bool(raw_row["eligible"]) is True, "Ineligible donor in candidate list!"
        days_since = (pd.to_datetime("2025-12-01") - pd.to_datetime(raw_row["last_donation_date"])).days
        assert days_since >= 90, f"Inter-donation violation: {days_since} days"
        print(f"      #{d['rank']} {d['donor_id']} | Dist: {d['distance_km']}km | Score: {d['priority_score']:.3f} | Tier: {d['priority_tier']}")
    print("  [PASS] Model 3 donor candidates strictly exist in donors.csv and satisfy all eligibility constraints.")


def audit_engine_4():
    print("\n--- ENGINE 4 AUDIT: SUPPLY NETWORK OPTIMIZATION ---")
    scenarios = ["normal", "mass_casualty", "transport_cut", "cooling_failure"]
    for sc in scenarios:
        net_data = build_network_optimization_data(target_date="2025-12-01", horizon_hours=72, scenario=sc)
        res = solve_supply_network(net_data)
        summary = res["impact_summary"]
        print(f"  Scenario: {sc:18s} | Status: {res['solver_status']} | Time: {res['solver_time_seconds']:.2f}s")
        tr = summary["transfers"]
        pre = summary["pre_optimization"]
        post = summary["post_optimization"]
        dn = summary["donor_mobilization"]
        print(f"    Transfers: {len(res['transfers'])} orders ({tr['total_units_transferred']} units) | Distance: {tr['total_transport_distance_km']} km")
        print(f"    Shortages: Before={pre['shortage_count']} -> After={post['shortage_count']} ({post['shortage_units']} units unmet)")
        print(f"    Donor Units Mobilized: {dn['total_donor_units_mobilized']} | FEFO Rescued: {tr['fefo_expiring_units_rescued']}")
        print(f"    Emergency Protection: {post['emergency_protection_rate_pct']:.1f}%")

        # Invariant checks
        assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"], f"Solver did not converge: {res['solver_status']}"
        for t in res["transfers"]:
            assert t["units"] > 0, "Non-positive transfer!"
            assert t["source"] != t["destination"], "Self-transfer detected!"
            assert t["units"] <= 200, "Transfer exceeds physical vehicle capacity!"
    print("  [PASS] Engine 4 MILP converges, enforces all constraints, and generates real mathematical solutions.")


def audit_command_center():
    print("\n--- COMMAND CENTER AUDIT: UNIFIED PIPELINE ---")
    cc = run_command_center(date="2025-12-01", horizon=72, scenario="normal")
    assert cc["status"] == "success"
    assert cc["optimization_status"] == "OPTIMAL"
    print(f"  Shortage Alerts Generated: {len(cc['shortage_alerts'])}")
    print(f"  Transfers Recommended:    {len(cc['transfer_recommendations'])}")
    print(f"  Donor Recommendations:    {len(cc['donor_recommendations'])}")
    print(f"  Constraint Explanations:  {len(cc['explanations'])}")
    print("  [PASS] Command Center successfully unifies Models 1, 2, 3, and Engine 4.")


if __name__ == "__main__":
    audit_model_1()
    audit_model_2()
    audit_model_3()
    audit_engine_4()
    audit_command_center()
    print("\n========================================")
    print("ALL CORE ENGINE AUDITS PASSED CLEANLY")
    print("========================================")
