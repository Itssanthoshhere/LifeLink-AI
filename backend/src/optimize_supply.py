"""
AI Blood Supply Command Center - Engine 4 Supply Optimization CLI
-----------------------------------------------------------------
Command-line execution for the network supply optimization engine.
Solves inter-facility transshipment and voluntary donor mobilization orders.

LOGISTICS PROTOTYPE NOTICE:
Intended strictly for Command Center logistical decision-support.
Not a clinical directive.
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, Any, Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from optimization_data import build_network_optimization_data
from optimization_solver import solve_supply_network
from optimization_explainer import OptimizationExplainer


def format_cli_output(result: Dict[str, Any], explainer: Optional[OptimizationExplainer] = None, top_transfers_count: int = 8) -> str:
    """Format optimization results into the Command Center terminal display banner."""
    params = result["planning_parameters"]
    net = result["network_topology"]
    impact = result["impact_summary"]
    pre = impact["pre_optimization"]
    post = impact["post_optimization"]
    trans = impact["transfers"]
    donors = result["donor_mobilization_orders"]
    transfers = result["transfers"]

    lines = []
    lines.append("=" * 60)
    lines.append("AI BLOOD SUPPLY COMMAND CENTER")
    lines.append("ENGINE 4 — NETWORK OPTIMIZATION")
    lines.append("=" * 60)
    lines.append("")
    lines.append(f"Planning Date: {params['date']}")
    lines.append(f"Planning Horizon: {params['horizon_hours']} hours")
    lines.append(f"Scenario: {params['scenario'].upper()}")
    lines.append("")
    lines.append(f"Solver Status: {result['solver_status']}")
    lines.append(f"Solve Time: {result['solver_time_seconds']} seconds")
    lines.append("")
    lines.append("-" * 60)
    lines.append("NETWORK SUMMARY")
    lines.append("")
    lines.append(f"Hospitals: {net['hospitals_count']}")
    lines.append(f"Blood Banks: {net['blood_banks_count']}")
    lines.append(f"Active Routes: {net['active_routes_count']}")
    lines.append("")
    lines.append(f"Predicted Shortage Risks: {pre['shortage_count']}")
    lines.append(f"Critical Risks: {pre['critical_shortage_count']}")
    lines.append("")
    lines.append("-" * 60)
    lines.append("RECOMMENDED TRANSFERS")
    lines.append("")
    lines.append(f"{'SOURCE':<10}  {'DESTINATION':<12}  {'PRODUCT':<12}  {'UNITS':<6}  {'DISTANCE':<10}  {'ETA':<8}")

    for t in transfers[:top_transfers_count]:
        prod = f"{t['donor_blood_group'][:5]} {t['component'][:3]}"
        lines.append(
            f"{t['source']:<10}  {t['destination']:<12}  {prod:<12}  {t['units']:<6}  {t['distance_km']:>4.1f} km     {t['travel_time_minutes']:>3.0f} min"
        )

    if len(transfers) > top_transfers_count:
        lines.append(f"... and {len(transfers) - top_transfers_count} additional transfer orders.")

    lines.append("")
    lines.append("-" * 60)
    lines.append("DONOR MOBILIZATION")
    lines.append("")

    if donors:
        top_d = donors[0]
        lines.append(f"{top_d['hospital_id']} ({top_d['hospital_name']})")
        lines.append(f"{top_d['blood_group']} {top_d['component']}")
        lines.append(f"Priority: {top_d['priority_tier']}")
        lines.append("")
        lines.append(f"Recommended local donor candidates: {top_d['units_to_mobilize']}")
        if len(donors) > 1:
            lines.append(f"(Total donor orders across network: {len(donors)} facilities, {impact['donor_mobilization']['total_donor_units_mobilized']} units)")
    else:
        lines.append("No local voluntary donor mobilization required. Network stock covers demand.")

    lines.append("")
    lines.append("-" * 60)
    lines.append("EXPECTED IMPACT")
    lines.append("")
    lines.append(f"Predicted shortage before optimization: {pre['shortage_count']} ({pre['shortage_units']:.1f} units)")
    lines.append(f"Predicted shortage after optimization:  {post['shortage_count']} ({post['shortage_units']:.1f} units)")
    lines.append("")
    lines.append(f"Units transferred: {trans['total_units_transferred']}")
    lines.append(f"Transport distance: {trans['total_transport_distance_km']:.1f} km")
    lines.append(f"Potential expiry exposure rescued: {trans['fefo_expiring_units_rescued']} units")
    lines.append(f"Emergency demand protected: {post['emergency_protection_rate_pct']:.1f}%")
    lines.append("")
    lines.append("-" * 60)
    lines.append("")
    lines.append("MODEL OUTPUT ONLY.")
    lines.append("LOGISTICS OPTIMIZATION PROTOTYPE.")
    lines.append("NOT A CLINICAL DIRECTIVE.")
    lines.append("=" * 60)

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="AI Blood Supply Command Center — Engine 4 Network Supply Optimization CLI"
    )
    parser.add_argument("--date", type=str, default="2025-12-01", help="Planning date (YYYY-MM-DD)")
    parser.add_argument("--horizon", type=int, default=72, choices=[24, 48, 72], help="Planning horizon in hours")
    parser.add_argument("--scenario", type=str, default="normal", help="Operational scenario name")
    parser.add_argument("--top_transfers", type=int, default=8, help="Number of transfer orders to display in terminal")
    parser.add_argument("--timeout", type=float, default=30.0, help="Maximum solver time limit in seconds")

    args = parser.parse_args()

    try:
        data = build_network_optimization_data(
            target_date=args.date,
            horizon_hours=args.horizon,
            scenario=args.scenario
        )
        res = solve_supply_network(data, time_limit_seconds=args.timeout)
        explainer = OptimizationExplainer(data, res)
        print(format_cli_output(res, explainer=explainer, top_transfers_count=args.top_transfers))
    except Exception as e:
        print(f"Error executing supply chain optimization: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
