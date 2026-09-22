"""
AI Blood Supply Command Center - Unified Intelligence Backend API
------------------------------------------------------------------
Integrates all four core subsystems into a single production-ready interface:
- Model 1: Demand Forecasting (multi-horizon demand expectations)
- Model 2: Shortage Prediction (early warning risk probabilities & tiers)
- Model 3: Intelligent Donor Dispatch (donor candidate pool ranking & outreach)
- Engine 4: Supply Chain Optimization (MILP transshipment & inter-facility allocation)

Serves as the primary API interface for the Command Center dashboard and external microservices.
"""

from typing import Dict, List, Any, Optional
from pathlib import Path
import json
import math
import numpy as np

import sys
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))

import config
from optimization_data import build_network_optimization_data
from optimization_solver import solve_supply_network
from optimization_explainer import OptimizationExplainer
from donor_ranker import rank_donors


def run_command_center(
    date: str = "2025-12-01",
    horizon: int = 72,
    scenario: str = "normal",
    offline_blood_banks: Optional[List[str]] = None,
    disrupted_routes: Optional[List[str]] = None,
    emergency_hospital: Optional[str] = None,
    emergency_blood_group: Optional[str] = None,
    emergency_component: Optional[str] = None,
    emergency_additional_demand: float = 0.0,
    top_k_donors_per_alert: int = 5
) -> Dict[str, Any]:
    """
    Execute end-to-end command center pipeline across Models 1, 2, 3, and Engine 4.

    Parameters:
        date: Snapshot date for inventory & demand evaluation (YYYY-MM-DD)
        horizon: Planning horizon in hours (24, 48, 72)
        scenario: Operational scenario name
        offline_blood_banks: Optional list of offline blood bank IDs
        disrupted_routes: Optional list of disrupted route IDs
        emergency_hospital: Hospital experiencing acute trauma demand spike
        emergency_blood_group: Blood group for emergency surge
        emergency_component: Component for emergency surge
        emergency_additional_demand: Units of emergency demand surge
        top_k_donors_per_alert: Top donor candidates to retrieve per shortage alert

    Returns:
        Structured JSON-compatible dictionary for dashboard rendering and automated dispatch.
    """
    # 1. Build Network Optimization Data (Ingests Model 1 Demand & Model 2 Shortage Signals)
    net_data = build_network_optimization_data(
        target_date=date,
        horizon_hours=horizon,
        scenario=scenario,
        offline_blood_banks=offline_blood_banks,
        disrupted_routes=disrupted_routes,
        emergency_hospital=emergency_hospital,
        emergency_blood_group=emergency_blood_group,
        emergency_component=emergency_component,
        emergency_additional_demand=emergency_additional_demand
    )

    # 2. Execute Engine 4 Mathematical Optimization
    opt_result = solve_supply_network(net_data)

    # 3. Generate Constraint-Grounded Explanations
    explainer = OptimizationExplainer(net_data, opt_result)
    raw_explanations = explainer.generate_all_explanations(max_transfers_to_explain=15)
    transfer_explanations = [explainer.explain_transfer(t) for t in opt_result.get("transfers", [])[:15]]

    # 4. Extract High/Critical Shortage Alerts (Model 2 Signals)
    shortage_alerts = []
    for hid in net_data.hospitals:
        for bg in net_data.blood_groups:
            for comp in net_data.components:
                key = (hid, bg, comp)
                risk = net_data.shortage_risks.get(key, {})
                d_forecast = net_data.demand.get(key, 0.0)
                stock = net_data.inventory.get(key, {}).get("current_units", 0.0)

                if risk.get("risk_level") in ["HIGH", "CRITICAL"] or risk.get("is_emergency"):
                    shortage_alerts.append({
                        "hospital_id": hid,
                        "hospital_name": net_data.nodes[hid]["name"],
                        "blood_group": bg,
                        "component": comp,
                        "forecast_demand_units": d_forecast,
                        "current_stock_units": stock,
                        "shortage_probability": risk.get("evaluated_prob", 0.0),
                        "risk_level": risk.get("risk_level", "HIGH"),
                        "is_emergency": risk.get("is_emergency", False)
                    })

    # Sort alerts by probability descending
    shortage_alerts.sort(key=lambda a: -a["shortage_probability"])

    # 5. Connect Model 3 Intelligent Donor Outreach for Top Alerts
    donor_recommendations = []
    top_alerts_to_mobilize = shortage_alerts[:10]  # Focus outreach on top 10 most critical alerts

    for alert in top_alerts_to_mobilize:
        try:
            urg = "emergency" if alert["is_emergency"] else "urgent"
            d_res = rank_donors(
                hospital_id=alert["hospital_id"],
                blood_group=alert["blood_group"],
                component=alert["component"],
                urgency=urg,
                required_units=int(np.ceil(alert["forecast_demand_units"])),
                prediction_horizon=f"{horizon}h",
                top_k=top_k_donors_per_alert
            )
            if d_res.get("status") == "success" and d_res.get("top_donors"):
                donor_recommendations.append({
                    "hospital_id": alert["hospital_id"],
                    "hospital_name": alert["hospital_name"],
                    "blood_group": alert["blood_group"],
                    "component": alert["component"],
                    "priority_tier": alert["risk_level"],
                    "candidate_pool_size": d_res["candidate_pool_summary"]["total_eligible_candidates"],
                    "expected_response_yield": d_res["candidate_pool_summary"]["expected_top_k_response_yield"],
                    "top_candidates": d_res["top_donors"]
                })
        except Exception:
            pass

    # 6. Format Final Unified Command Center Response
    impact = opt_result["impact_summary"]
    pre = impact.get("pre_optimization", {})
    post = impact.get("post_optimization", {})
    trans = impact.get("transfers", {})
    donors = impact.get("donor_mobilization", {})
    trans_count = trans.get("order_count", len(opt_result.get("transfers", [])))
    tot_dist = trans.get("total_transport_distance_km", 0.0)
    avg_dist = round(tot_dist / max(1, trans_count), 1) if trans_count else 0.0

    network_metrics = {
        **impact,
        "total_shortages_before": pre.get("shortage_count", 0),
        "critical_shortages_before": pre.get("critical_shortage_count", 0),
        "total_shortage_units_before": pre.get("shortage_units", 0.0),
        "emergency_unmet_units_before": pre.get("emergency_unmet_units", 0.0),
        "total_shortages_after": post.get("shortage_count", 0),
        "total_shortage_units_after": post.get("shortage_units", 0.0),
        "emergency_unmet_units_after": post.get("emergency_unmet_units", 0.0),
        "emergency_protection_rate_pct": post.get("emergency_protection_rate_pct", 100.0),
        "total_units_transferred": trans.get("total_units_transferred", 0),
        "total_donor_units_mobilized": donors.get("total_donor_units_mobilized", 0),
        "fefo_expiring_units_rescued": trans.get("fefo_expiring_units_rescued", 0),
        "total_transport_distance_km": tot_dist,
        "average_transfer_distance_km": avg_dist,
        "average_eta_minutes": round(avg_dist * 1.6, 1),
        "decision_breakdown": impact.get("decision_breakdown", {})
    }

    return {
        "status": "success",
        "date": date,
        "horizon": horizon,
        "scenario": scenario,
        "optimization_status": opt_result["solver_status"],
        "solve_time_seconds": opt_result["solver_time_seconds"],
        "network_metrics": network_metrics,
        "shortage_alerts": shortage_alerts,
        "transfer_recommendations": opt_result["transfers"],
        "donor_recommendations": donor_recommendations,
        "unmet_shortages": opt_result["unmet_shortages"],
        "decision_breakdown": opt_result["impact_summary"]["decision_breakdown"],
        "explanations": transfer_explanations,
        "raw_explanations": raw_explanations,
        "disclaimer": (
            "AI BLOOD SUPPLY COMMAND CENTER — DECISION SUPPORT PROTOTYPE. "
            "All recommendations are logistical supply-chain optimizations and do not constitute clinical directives. "
            "Final transfusion compatibility and dispatch authorization require certified healthcare personnel."
        )
    }
