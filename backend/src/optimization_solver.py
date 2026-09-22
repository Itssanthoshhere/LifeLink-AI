"""
AI Blood Supply Command Center - Supply Chain Optimization Solver & Orchestrator
--------------------------------------------------------------------------------
Executes the mathematical optimization model, parses the solution arrays into actionable
transshipment orders, determines Transfer vs. Donor mobilization trade-offs, and calculates
before-and-after network impact metrics.

LOGISTICS PROTOTYPE NOTICE:
This module outputs operational logistical recommendations for the Command Center.
It does NOT make clinical directives or patient transfusion decisions.
"""

import time
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from ortools.linear_solver import pywraplp

import sys
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import config
from optimization_data import NetworkData, build_network_optimization_data
from optimization_model import SupplyChainOptimizationModel


def solve_supply_network(
    data: NetworkData,
    time_limit_seconds: Optional[float] = None
) -> Dict[str, Any]:
    """
    Solve the network optimization problem and produce structured operational recommendations.

    Parameters:
        data: Initialized NetworkData instance
        time_limit_seconds: Optional solver runtime cutoff

    Returns:
        Structured dictionary containing solver status, transfer orders, donor mobilization orders,
        unmet deficits, decision classifications, and network impact metrics.
    """
    start_time = time.time()
    model = SupplyChainOptimizationModel(data)
    solve_status_code = model.solve(time_limit_seconds=time_limit_seconds)
    elapsed_sec = round(time.time() - start_time, 2)

    status_map = {
        pywraplp.Solver.OPTIMAL: "OPTIMAL",
        pywraplp.Solver.FEASIBLE: "FEASIBLE",
        pywraplp.Solver.INFEASIBLE: "INFEASIBLE",
        pywraplp.Solver.UNBOUNDED: "UNBOUNDED",
        pywraplp.Solver.ABNORMAL: "ABNORMAL",
        pywraplp.Solver.NOT_SOLVED: "NOT_SOLVED",
    }
    solver_status = status_map.get(solve_status_code, "UNKNOWN")

    # 1. Parse Transfers
    transfers_list = []
    total_transferred_units = 0
    total_transport_dist_km = 0.0
    fefo_expiring_units_rescued = 0

    if solver_status in ["OPTIMAL", "FEASIBLE"]:
        for (src, dst, bg_src, bg_dst, comp), var in model.transfers.items():
            val = int(round(var.solution_value()))
            if val > 0:
                edge_info = data.edges.get((src, dst), {})
                dist = edge_info.get("distance_km", 0.0)
                tt = edge_info.get("travel_time_min", 0.0)
                inv_src = data.inventory.get((src, bg_src, comp), {})
                is_fefo = inv_src.get("units_expiring_1d", 0) > 0 or inv_src.get("units_expiring_3d", 0) > 0

                if is_fefo:
                    fefo_expiring_units_rescued += min(val, int(inv_src.get("units_expiring_3d", 0)))

                transfers_list.append({
                    "source": src,
                    "source_name": data.nodes[src]["name"],
                    "destination": dst,
                    "destination_name": data.nodes[dst]["name"],
                    "donor_blood_group": bg_src,
                    "recipient_blood_group": bg_dst,
                    "component": comp,
                    "is_exact_match": (bg_src == bg_dst),
                    "units": val,
                    "distance_km": round(dist, 1),
                    "travel_time_minutes": round(tt, 1),
                    "route_id": edge_info.get("route_id", "UNKNOWN"),
                    "is_fefo_priority": is_fefo
                })
                total_transferred_units += val
                total_transport_dist_km += dist * val

    # Sort transfers by units descending then distance ascending
    transfers_list.sort(key=lambda t: (-t["units"], t["distance_km"]))

    # 2. Parse Donor Mobilizations
    donor_orders = []
    total_donor_units = 0
    if solver_status in ["OPTIMAL", "FEASIBLE"]:
        for (hid, bg, comp), var in model.donor_mobilizations.items():
            val = int(round(var.solution_value()))
            if val > 0:
                pool = data.donor_pools.get((hid, bg, comp), {})
                risk = data.shortage_risks.get((hid, bg, comp), {})
                donor_orders.append({
                    "hospital_id": hid,
                    "hospital_name": data.nodes[hid]["name"],
                    "blood_group": bg,
                    "component": comp,
                    "units_to_mobilize": val,
                    "eligible_candidate_count": pool.get("eligible_candidate_count", 0),
                    "priority_tier": risk.get("risk_level", "MEDIUM"),
                    "is_emergency": risk.get("is_emergency", False)
                })
                total_donor_units += val

    donor_orders.sort(key=lambda d: -d["units_to_mobilize"])

    # 3. Parse Unmet Shortages
    shortages_list = []
    total_unmet_shortage_units = 0.0
    for (hid, bg, comp), var in model.shortages.items():
        val = float(round(var.solution_value(), 2)) if solver_status in ["OPTIMAL", "FEASIBLE"] else float(data.demand.get((hid, bg, comp), 0.0))
        if val > 0.05:
            risk = data.shortage_risks.get((hid, bg, comp), {})
            shortages_list.append({
                "hospital_id": hid,
                "hospital_name": data.nodes[hid]["name"],
                "blood_group": bg,
                "component": comp,
                "unmet_units": val,
                "risk_level": risk.get("risk_level", "MEDIUM"),
                "is_emergency": risk.get("is_emergency", False)
            })
            total_unmet_shortage_units += val

    # 4. Compute Network Impact Metrics (Before vs. After Optimization)
    # Baseline before optimization:
    total_network_demand = sum(data.demand.values())
    total_initial_inventory = sum(inv["current_units"] for inv in data.inventory.values())
    
    # Pre-optimization deficits: instances where local hospital stock < demand
    pre_opt_shortages_count = 0
    pre_opt_shortage_units = 0.0
    pre_opt_critical_shortages = 0
    pre_opt_emergency_unmet = 0.0

    for hid in data.hospitals:
        for bg in data.blood_groups:
            for comp in data.components:
                key = (hid, bg, comp)
                d_target = data.demand.get(key, 0.0)
                curr_stock = data.inventory.get(key, {}).get("current_units", 0.0)
                deficit = max(0.0, d_target - curr_stock)
                risk_info = data.shortage_risks.get(key, {})

                if deficit > 0.05:
                    pre_opt_shortages_count += 1
                    pre_opt_shortage_units += deficit
                    if risk_info.get("risk_level") == "CRITICAL" or risk_info.get("is_emergency"):
                        pre_opt_critical_shortages += 1
                        pre_opt_emergency_unmet += deficit

    # Post-optimization deficits:
    post_opt_shortages_count = len(shortages_list)
    post_opt_shortage_units = round(total_unmet_shortage_units, 1)
    post_opt_critical_shortages = sum(1 for s in shortages_list if s["is_emergency"] or s["risk_level"] == "CRITICAL")
    post_opt_emergency_unmet = round(sum(s["unmet_units"] for s in shortages_list if s["is_emergency"]), 1)

    emergency_protection_rate_pct = 100.0 if pre_opt_emergency_unmet <= 0.01 else max(
        0.0, round((1.0 - (post_opt_emergency_unmet / pre_opt_emergency_unmet)) * 100.0, 1)
    )

    # 5. Differentiating Decision Classification: Transfer vs Donor vs Combined
    # Categorize how each deficit was satisfied
    decision_summary = {
        "TRANSFER_ONLY": 0,
        "DONOR_ONLY": 0,
        "COMBINED": 0,
        "NO_ACTION_NEEDED": 0,
        "UNRESOLVED_DEFICIT": 0
    }

    # Group transfers by destination
    dst_transfers_map = {}
    for t in transfers_list:
        k = (t["destination"], t["recipient_blood_group"], t["component"])
        dst_transfers_map[k] = dst_transfers_map.get(k, 0) + t["units"]

    dst_donors_map = {
        (d["hospital_id"], d["blood_group"], d["component"]): d["units_to_mobilize"]
        for d in donor_orders
    }

    detailed_decisions = []
    for hid in data.hospitals:
        for bg in data.blood_groups:
            for comp in data.components:
                key = (hid, bg, comp)
                d_target = data.demand.get(key, 0.0)
                curr_stock = data.inventory.get(key, {}).get("current_units", 0.0)
                deficit = max(0.0, d_target - curr_stock)

                if deficit <= 0.05:
                    decision_summary["NO_ACTION_NEEDED"] += 1
                    continue

                t_units = dst_transfers_map.get(key, 0)
                d_units = dst_donors_map.get(key, 0)
                unmet = next((s["unmet_units"] for s in shortages_list if (s["hospital_id"], s["blood_group"], s["component"]) == key), 0.0)

                if t_units > 0 and d_units > 0:
                    dec = "COMBINED"
                    decision_summary["COMBINED"] += 1
                elif t_units > 0 and d_units == 0:
                    dec = "TRANSFER"
                    decision_summary["TRANSFER_ONLY"] += 1
                elif t_units == 0 and d_units > 0:
                    dec = "DONOR"
                    decision_summary["DONOR_ONLY"] += 1
                else:
                    dec = "NO_FEASIBLE_ACTION"
                    decision_summary["UNRESOLVED_DEFICIT"] += 1

                detailed_decisions.append({
                    "hospital_id": hid,
                    "blood_group": bg,
                    "component": comp,
                    "deficit_units": round(deficit, 1),
                    "transferred_units": t_units,
                    "donor_mobilized_units": d_units,
                    "unmet_units": round(unmet, 1),
                    "decision": dec
                })

    return {
        "status": "success" if solver_status in ["OPTIMAL", "FEASIBLE"] else "failed",
        "solver_status": solver_status,
        "solver_time_seconds": elapsed_sec,
        "planning_parameters": {
            "date": getattr(data, "effective_date", "2025-12-01"),
            "horizon_hours": data.horizon_hours,
            "scenario": data.scenario_name
        },
        "network_topology": {
            "hospitals_count": len(data.hospitals),
            "blood_banks_count": len(data.blood_banks),
            "active_routes_count": sum(1 for e in data.edges.values() if e["is_active"]),
            "disrupted_routes_count": sum(1 for e in data.edges.values() if not e["is_active"])
        },
        "impact_summary": {
            "pre_optimization": {
                "shortage_count": pre_opt_shortages_count,
                "shortage_units": round(pre_opt_shortage_units, 1),
                "critical_shortage_count": pre_opt_critical_shortages,
                "emergency_unmet_units": round(pre_opt_emergency_unmet, 1)
            },
            "post_optimization": {
                "shortage_count": post_opt_shortages_count,
                "shortage_units": post_opt_shortage_units,
                "critical_shortage_count": post_opt_critical_shortages,
                "emergency_unmet_units": post_opt_emergency_unmet,
                "emergency_protection_rate_pct": emergency_protection_rate_pct
            },
            "transfers": {
                "order_count": len(transfers_list),
                "total_units_transferred": total_transferred_units,
                "total_transport_distance_km": round(total_transport_dist_km, 1),
                "fefo_expiring_units_rescued": fefo_expiring_units_rescued
            },
            "donor_mobilization": {
                "order_count": len(donor_orders),
                "total_donor_units_mobilized": total_donor_units
            },
            "decision_breakdown": decision_summary
        },
        "transfers": transfers_list,
        "donor_mobilization_orders": donor_orders,
        "unmet_shortages": shortages_list,
        "detailed_decisions": detailed_decisions,
        "disclaimer": (
            "MODEL OUTPUT ONLY. Logistics supply-chain optimization prototype. "
            "Not a clinical directive. Final transfusion orders and dispatch authorizations "
            "require qualified medical and blood-bank verification."
        )
    }
