"""
AI Blood Supply Command Center - Intelligent Donor Dispatch CLI
---------------------------------------------------------------
Provides command-line execution for ranking and prioritizing eligible blood donors
during emerging shortages and emergency surges.

LOGISTICS PROTOTYPE NOTICE:
Intended strictly for Command Center logistical dispatch decision-support.
Does NOT determine medical fitness, clinical donor eligibility, or transfusion safety.
"""

import argparse
import sys
from pathlib import Path
from typing import List, Dict, Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from donor_ranker import rank_donors


def format_cli_output(result: Dict[str, Any]) -> str:
    """Format structured ranking result into the Command Center terminal display."""
    q = result["query"]
    risk = result["shortage_risk_assessment"]
    pool = result["candidate_pool_summary"]
    donors = result["top_donors"]

    r24 = risk.get("shortage_24h_risk", "LOW")
    r48 = risk.get("shortage_48h_risk", "LOW")
    r72 = risk.get("shortage_72h_risk", "LOW")

    lines = []
    lines.append("=" * 60)
    lines.append("AI BLOOD SUPPLY COMMAND CENTER")
    lines.append("INTELLIGENT DONOR DISPATCH")
    lines.append("=" * 60)
    lines.append("")
    lines.append(f"Hospital: {q['hospital_id']} ({q['hospital_name']})")
    lines.append(f"Blood Group: {q['blood_group']}")
    lines.append(f"Component: {q['component']}")
    lines.append(f"Urgency: {q['urgency']}")
    lines.append(f"Required Units: {q['required_units']}")
    lines.append("")
    lines.append("Shortage Risk:")
    lines.append(f"  24h: {r24}")
    lines.append(f"  48h: {r48}")
    lines.append(f"  72h: {r72}")
    lines.append("")
    lines.append(f"Eligible Candidates: {pool['total_eligible_candidates']}")
    lines.append(f"Compatible Candidates: {pool['exact_blood_match_count'] + pool['compatible_alternative_count']}")
    lines.append(f"Candidates within 5 km: {pool['candidates_within_5km']}")
    lines.append(f"Candidates within 10 km: {pool['candidates_within_10km']}")
    lines.append(f"Expected Top-{len(donors)} Response Yield: {pool['expected_top_k_response_yield']:.1f} units")
    lines.append("")
    lines.append("TOP DONORS")
    lines.append("-" * 60)
    lines.append(f"{'Rank':<5} | {'Donor':<12} | {'Distance':<10} | {'Response Prob':<14} | {'Priority':<8}")
    lines.append("-" * 60)

    for d in donors:
        lines.append(
            f"{d['rank']:<5} | {d['donor_id']:<12} | {d['distance_km']:>5.1f} km   | {d['response_probability']:>12.2f}  | {d['priority_tier']:<8}"
        )

    lines.append("-" * 60)
    lines.append("")
    lines.append("MODEL CONTRIBUTING FACTORS:")
    lines.append("• Compatible ABO/Rh blood group for requested clinical component")
    lines.append("• Proximity and road travel time to destination trauma/care center")
    lines.append("• Historical donor responsiveness profile and latency rating")
    lines.append("• Active Model 2 shortage early warning and clinical demand urgency")
    lines.append("")
    lines.append("MODEL OUTPUT ONLY — NOT A CLINICAL DIRECTIVE.")
    lines.append("Final donor eligibility and blood collection decisions require")
    lines.append("qualified healthcare/blood-bank personnel.")
    lines.append("=" * 60)

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="AI Blood Supply Command Center — Intelligent Donor Dispatch CLI"
    )
    parser.add_argument("--hospital", type=str, required=True, help="Destination hospital ID (e.g. HOSP_007)")
    parser.add_argument("--blood_group", type=str, required=True, help="Needed blood group (e.g. O_NEG, A_POS)")
    parser.add_argument("--component", type=str, default="RBC", choices=["RBC", "Platelets", "Plasma", "Whole_Blood"], help="Requested blood component")
    parser.add_argument("--urgency", type=str, default="routine", choices=["routine", "urgent", "emergency"], help="Outreach urgency tier")
    parser.add_argument("--required_units", type=int, default=1, help="Number of blood units required")
    parser.add_argument("--horizon", type=str, default="24h", choices=["24h", "48h", "72h"], help="Prediction horizon to evaluate")
    parser.add_argument("--top_k", type=int, default=10, help="Number of top-ranked donors to display")
    parser.add_argument("--shortage_prob", type=float, default=None, help="Manual override for shortage probability")

    args = parser.parse_args()

    try:
        result = rank_donors(
            hospital_id=args.hospital,
            blood_group=args.blood_group,
            component=args.component,
            urgency=args.urgency,
            required_units=args.required_units,
            prediction_horizon=args.horizon,
            top_k=args.top_k,
            shortage_prob_override=args.shortage_prob
        )
        print(format_cli_output(result))
    except Exception as e:
        print(f"Error executing donor dispatch ranking: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
