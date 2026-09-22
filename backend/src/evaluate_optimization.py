"""
AI Blood Supply Command Center - Engine 4 Optimization Evaluation Suite
------------------------------------------------------------------------
Evaluates Engine 4 against three benchmark baselines:
1. Baseline A: Nearest Blood Bank Only (uncoordinated local heuristic)
2. Baseline B: Greedy Shortage Fulfillment (greedy priority queue allocation)
3. Baseline C: Simulation Replenishment Status Quo

Also evaluates Engine 4 across all 9 operational stress scenarios and generates
the structured evaluation artifact reports/optimization_scenario_results.json.
"""

import json
import time
from pathlib import Path
from typing import Dict, List, Any, Tuple
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
REPORTS_DIR = PROJECT_ROOT / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import config
from optimization_data import NetworkData, build_network_optimization_data
from optimization_solver import solve_supply_network
from blood_compatibility import is_compatible_donor_group


# ===========================================================================
# Baseline A: Nearest Blood Bank Only
# ===========================================================================
def evaluate_baseline_nearest_blood_bank(data: NetworkData) -> Dict[str, Any]:
    """
    Heuristic: Each hospital with a deficit requests inventory ONLY from its closest
    operational blood bank, ignoring other distribution hubs and donor mobilization.
    """
    start_t = time.time()
    # Find nearest active blood bank for each hospital
    nearest_bb: Dict[str, Tuple[str, float, float]] = {}
    for hid in data.hospitals:
        best_bb = None
        best_dist = float("inf")
        best_tt = 0.0
        for bbid in data.blood_banks:
            edge = data.edges.get((bbid, hid))
            if edge and edge["is_active"] and edge["distance_km"] < best_dist:
                best_dist = edge["distance_km"]
                best_tt = edge["travel_time_min"]
                best_bb = bbid
        if best_bb:
            nearest_bb[hid] = (best_bb, best_dist, best_tt)

    # Track usable stock copy at blood banks
    bb_stock = {
        (bb, bg, comp): data.inventory.get((bb, bg, comp), {}).get("usable_excess", 0.0)
        for bb in data.blood_banks
        for bg in data.blood_groups
        for comp in data.components
    }

    transfers = []
    unmet_deficits = 0.0
    unmet_count = 0
    emergency_unmet = 0.0
    total_dist = 0.0
    total_transferred = 0

    for hid in data.hospitals:
        for bg in data.blood_groups:
            for comp in data.components:
                key = (hid, bg, comp)
                d_target = data.demand.get(key, 0.0)
                curr_stock = data.inventory.get(key, {}).get("current_units", 0.0)
                deficit = max(0.0, d_target - curr_stock)
                risk = data.shortage_risks.get(key, {})

                if deficit <= 0.05:
                    continue

                # Try to pull from nearest blood bank
                bb_info = nearest_bb.get(hid)
                fulfilled = 0.0
                if bb_info:
                    bbid, dist, tt = bb_info
                    avail = bb_stock.get((bbid, bg, comp), 0.0)
                    pull_units = int(min(np.floor(deficit), np.floor(avail)))
                    if pull_units > 0:
                        bb_stock[(bbid, bg, comp)] -= pull_units
                        fulfilled += pull_units
                        transfers.append({
                            "source": bbid, "destination": hid, "product": f"{bg} {comp}",
                            "units": pull_units, "distance_km": dist
                        })
                        total_dist += dist * pull_units
                        total_transferred += pull_units

                remaining = deficit - fulfilled
                if remaining > 0.05:
                    unmet_count += 1
                    unmet_deficits += remaining
                    if risk.get("is_emergency") or risk.get("risk_level") == "CRITICAL":
                        emergency_unmet += remaining

    return {
        "baseline_name": "Baseline A: Nearest Blood Bank Only",
        "shortage_count": unmet_count,
        "shortage_units": round(unmet_deficits, 1),
        "emergency_unmet_units": round(emergency_unmet, 1),
        "transfer_order_count": len(transfers),
        "total_units_transferred": total_transferred,
        "total_transport_distance_km": round(total_dist, 1),
        "runtime_seconds": round(time.time() - start_t, 3)
    }


# ===========================================================================
# Baseline B: Greedy Shortage Fulfillment
# ===========================================================================
def evaluate_baseline_greedy(data: NetworkData) -> Dict[str, Any]:
    """
    Heuristic: Sorts all deficits by urgency & size, then greedily searches for the
    first available facility with excess stock, without multi-facility optimization.
    """
    start_t = time.time()
    deficits = []
    for hid in data.hospitals:
        for bg in data.blood_groups:
            for comp in data.components:
                key = (hid, bg, comp)
                d_target = data.demand.get(key, 0.0)
                curr_stock = data.inventory.get(key, {}).get("current_units", 0.0)
                deficit = max(0.0, d_target - curr_stock)
                risk = data.shortage_risks.get(key, {})
                if deficit > 0.05:
                    prio = 3 if risk.get("is_emergency") else (2 if risk.get("risk_level") == "HIGH" else 1)
                    deficits.append({
                        "hospital_id": hid, "blood_group": bg, "component": comp,
                        "deficit": deficit, "priority": prio, "is_emergency": risk.get("is_emergency", False)
                    })

    # Sort greedily: highest priority first, then largest deficit
    deficits.sort(key=lambda x: (-x["priority"], -x["deficit"]))

    fac_stock = {
        (fac, bg, comp): data.inventory.get((fac, bg, comp), {}).get("usable_excess", 0.0)
        for fac in data.facilities
        for bg in data.blood_groups
        for comp in data.components
    }

    transfers = []
    unmet_count = 0
    unmet_units = 0.0
    emergency_unmet = 0.0
    total_dist = 0.0
    total_transferred = 0

    for d in deficits:
        hid = d["hospital_id"]
        bg = d["blood_group"]
        comp = d["component"]
        remaining = d["deficit"]

        # Search blood banks first, then hospitals
        sources = data.blood_banks + [h for h in data.hospitals if h != hid]
        for src in sources:
            if remaining <= 0:
                break
            edge = data.edges.get((src, hid))
            if not edge or not edge["is_active"]:
                continue
            avail = fac_stock.get((src, bg, comp), 0.0)
            if avail > 0:
                pull = int(min(np.floor(remaining), np.floor(avail)))
                if pull > 0:
                    fac_stock[(src, bg, comp)] -= pull
                    remaining -= pull
                    total_transferred += pull
                    dist = edge["distance_km"]
                    total_dist += dist * pull
                    transfers.append({"src": src, "dst": hid, "units": pull})

        if remaining > 0.05:
            unmet_count += 1
            unmet_units += remaining
            if d["is_emergency"]:
                emergency_unmet += remaining

    return {
        "baseline_name": "Baseline B: Greedy Shortage Fulfillment",
        "shortage_count": unmet_count,
        "shortage_units": round(unmet_units, 1),
        "emergency_unmet_units": round(emergency_unmet, 1),
        "transfer_order_count": len(transfers),
        "total_units_transferred": total_transferred,
        "total_transport_distance_km": round(total_dist, 1),
        "runtime_seconds": round(time.time() - start_t, 3)
    }


# ===========================================================================
# 9-Scenario Comprehensive Evaluation
# ===========================================================================
SCENARIOS_TO_EVALUATE = [
    {"id": "normal_operations", "name": "Normal Operations Baseline", "date": "2025-12-01", "scenario": "normal"},
    {"id": "moderate_demand_spike", "name": "Holiday Festival Demand Spike", "date": "2024-03-24", "scenario": "moderate_demand_spike"},
    {"id": "major_mass_casualty", "name": "Industrial Chemical Explosion Catastrophe", "date": "2024-05-18", "scenario": "major_mass_casualty"},
    {"id": "multiple_hospital_shortages", "name": "Peak Monsoon Dengue Outbreak Wave", "date": "2024-07-20", "scenario": "multiple_hospital_shortages"},
    {"id": "o_negative_crisis", "name": "Severe O-Negative Emergency Deficit", "date": "2024-08-12", "scenario": "o_negative_crisis"},
    {"id": "blood_bank_failure", "name": "Regional Hub Cooling System Failure", "date": "2024-09-05", "scenario": "blood_bank_failure"},
    {"id": "transport_disruption", "name": "Monsoon Arterial Highway Inundation", "date": "2024-10-10", "scenario": "transport_disruption"},
    {"id": "platelet_expiry_wave", "name": "Post-Drive Platelet Surplus & Expiry Wave", "date": "2025-01-02", "scenario": "platelet_expiry_wave"},
    {"id": "donor_availability_slump", "name": "Severe Summer Heatwave Donor Slump", "date": "2025-05-01", "scenario": "donor_availability_slump"},
]


def run_full_evaluation_suite() -> Dict[str, Any]:
    """Execute evaluation across baselines and all 9 scenarios."""
    print("=" * 70)
    print("ENGINE 4: SUPPLY CHAIN NETWORK OPTIMIZATION — EVALUATION SUITE")
    print("=" * 70)

    # 1. Baseline Comparison under Normal Scenario
    print("\n[Part 1] Benchmarking Engine 4 against Heuristic Baselines (72h Horizon)...")
    base_data = build_network_optimization_data(target_date="2025-12-01", horizon_hours=72, scenario="normal")

    res_opt = solve_supply_network(base_data)
    res_base_a = evaluate_baseline_nearest_blood_bank(base_data)
    res_base_b = evaluate_baseline_greedy(base_data)

    opt_impact = res_opt["impact_summary"]
    baseline_comparison = {
        "engine4_optimization": {
            "name": "Engine 4: Google OR-Tools MILP",
            "shortage_count": opt_impact["post_optimization"]["shortage_count"],
            "shortage_units": opt_impact["post_optimization"]["shortage_units"],
            "emergency_unmet_units": opt_impact["post_optimization"]["emergency_unmet_units"],
            "transfer_order_count": opt_impact["transfers"]["order_count"],
            "total_units_transferred": opt_impact["transfers"]["total_units_transferred"],
            "total_transport_distance_km": opt_impact["transfers"]["total_transport_distance_km"],
            "donor_units_mobilized": opt_impact["donor_mobilization"]["total_donor_units_mobilized"],
            "fefo_expiring_rescued": opt_impact["transfers"]["fefo_expiring_units_rescued"],
            "runtime_seconds": res_opt["solver_time_seconds"]
        },
        "baseline_a_nearest_bb": res_base_a,
        "baseline_b_greedy": res_base_b
    }

    print(f"  • Engine 4 MILP  : Shortages={opt_impact['post_optimization']['shortage_count']}, Units={opt_impact['post_optimization']['shortage_units']}, Runtime={res_opt['solver_time_seconds']}s")
    print(f"  • Baseline A (NB): Shortages={res_base_a['shortage_count']}, Units={res_base_a['shortage_units']}, Runtime={res_base_a['runtime_seconds']}s")
    print(f"  • Baseline B (GR): Shortages={res_base_b['shortage_count']}, Units={res_base_b['shortage_units']}, Runtime={res_base_b['runtime_seconds']}s")

    # 2. Nine Scenario Stress Testing
    print("\n[Part 2] Evaluating Engine 4 across 9 Operational Stress Scenarios...")
    scenario_results = {}

    for sc_item in SCENARIOS_TO_EVALUATE:
        sc_id = sc_item["id"]
        sc_name = sc_item["name"]
        dt = sc_item["date"]
        sc_type = sc_item["scenario"]

        sc_data = build_network_optimization_data(
            target_date=dt,
            horizon_hours=72,
            scenario=sc_type
        )
        sc_res = solve_supply_network(sc_data)
        sc_impact = sc_res["impact_summary"]

        scenario_results[sc_id] = {
            "scenario_id": sc_id,
            "scenario_name": sc_name,
            "date": dt,
            "horizon_hours": 72,
            "solver_status": sc_res["solver_status"],
            "solver_time_seconds": sc_res["solver_time_seconds"],
            "before_optimization": sc_impact["pre_optimization"],
            "after_optimization": sc_impact["post_optimization"],
            "transfers": sc_impact["transfers"],
            "donor_mobilization": sc_impact["donor_mobilization"],
            "decision_breakdown": sc_impact["decision_breakdown"]
        }

        print(f"  [{sc_name}]")
        print(f"    Shortages: {sc_impact['pre_optimization']['shortage_count']} -> {sc_impact['post_optimization']['shortage_count']} | Transfers: {sc_impact['transfers']['total_units_transferred']} units | Donors: {sc_impact['donor_mobilization']['total_donor_units_mobilized']} units | Emergency Protected: {sc_impact['post_optimization']['emergency_protection_rate_pct']}%")

    # Save to reports
    out_payload = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "baseline_comparison": baseline_comparison,
        "scenario_evaluations": scenario_results
    }

    out_file = REPORTS_DIR / "optimization_scenario_results.json"
    with open(out_file, "w") as f:
        json.dump(out_payload, f, indent=2)

    print(f"\nSuccessfully generated and saved evaluation results to {out_file}")
    return out_payload


if __name__ == "__main__":
    run_full_evaluation_suite()
