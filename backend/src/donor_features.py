"""
AI Blood Supply Command Center - Donor Feature Engineering
----------------------------------------------------------
Constructs auditable, leakage-free feature vectors for donor candidate ranking.
Strictly separates:
A. Eligibility Features (used for inclusion/exclusion gating)
B. Ranking Features (used for multi-criteria scoring and dispatch prioritization)

LOGISTICS PROTOTYPE NOTICE:
Features are designed for logistical dispatch prioritization in the Command Center.
No medical screening or transfusion authorization is performed by these features.
"""

from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd


ELIGIBILITY_FEATURE_COLUMNS = [
    "is_compatible",
    "is_available",
    "is_medically_eligible",
    "days_since_last_donation",
    "within_travel_boundary"
]

RANKING_FEATURE_COLUMNS = [
    "distance_km",
    "estimated_travel_time_min",
    "donor_response_probability",
    "average_response_time_minutes",
    "donation_count",
    "is_frequent_donor",
    "is_available_now",
    "exact_match",
    "shortage_risk_prob",
    "urgency_weight",
    "proximity_score",
    "responsiveness_score",
    "reliability_score"
]


def extract_donor_features(
    candidates_df: pd.DataFrame,
    shortage_risk_prob: float = 0.0,
    urgency: str = "routine",
    max_distance_km: float = 35.0
) -> pd.DataFrame:
    """
    Compute normalized feature representations for a candidate pool.

    Parameters:
        candidates_df: Output from generate_donor_candidates()
        shortage_risk_prob: Model 2 shortage probability for current horizon (0.0 to 1.0)
        urgency: Outreach urgency ('routine', 'urgent', 'emergency')
        max_distance_km: Maximum travel distance ceiling

    Returns:
        pd.DataFrame with added normalized ranking and eligibility feature columns.
    """
    if candidates_df.empty:
        df = candidates_df.copy()
        for col in ELIGIBILITY_FEATURE_COLUMNS + RANKING_FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = []
        return df

    df = candidates_df.copy()

    # -----------------------------------------------------------------------
    # A. Eligibility Features (Verification audit trail)
    # -----------------------------------------------------------------------
    df["is_compatible"] = 1
    df["is_available"] = (df["availability"].isin(["Available", "Busy"])).astype(int)
    df["is_medically_eligible"] = (df["eligible"] == True).astype(int)  # noqa: E712
    df["within_travel_boundary"] = (df["distance_km"] <= max_distance_km).astype(int)

    # -----------------------------------------------------------------------
    # B. Normalized Ranking Features
    # -----------------------------------------------------------------------
    # 1. Proximity score: decays smoothly with distance (1.0 at 0km to ~0.1 at max_distance_km)
    # Exponential decay provides sharp discrimination for very close donors (< 5km)
    tau = max_distance_km / 2.3  # decay rate parameter
    df["proximity_score"] = np.round(np.exp(-df["distance_km"] / tau), 4)

    # 2. Donor responsiveness: profile probability combined with latency penalty
    # Normalize avg response time (15 min = fast = 1.0, 180 min = slow = 0.0)
    norm_latency = np.clip(1.0 - (df["average_response_time_minutes"] - 15.0) / 165.0, 0.0, 1.0)
    df["donor_response_probability"] = df["response_probability"].astype(float)
    df["responsiveness_score"] = np.round(
        0.70 * df["donor_response_probability"] + 0.30 * norm_latency, 4
    )

    # 3. Donor reliability / commitment: log-scaled lifetime donation experience
    # 0 donations = 0.30, 5 donations = 0.70, 15+ donations = 1.0
    df["donation_count"] = df["donation_count"].astype(int)
    df["reliability_score"] = np.round(
        np.clip(0.30 + 0.70 * (np.log1p(df["donation_count"]) / np.log1p(15.0)), 0.30, 1.0), 4
    )
    df["is_frequent_donor"] = (df["donation_count"] >= 5).astype(int)

    # 4. Immediate availability: Available = 1.0, Busy = 0.45
    df["is_available_now"] = np.where(df["availability"] == "Available", 1.0, 0.45)

    # 5. Exact match vs alternative compatible
    df["exact_match"] = df["exact_match"].astype(int)

    # 6. Context / Command Center signals
    df["shortage_risk_prob"] = float(np.clip(shortage_risk_prob, 0.0, 1.0))
    urgency_map = {"routine": 1.0, "urgent": 1.5, "emergency": 2.5}
    df["urgency_weight"] = urgency_map.get(urgency.lower(), 1.0)

    return df


def get_feature_schema() -> Dict[str, Any]:
    """Return dictionary describing eligibility and ranking feature schemas."""
    return {
        "eligibility_features": ELIGIBILITY_FEATURE_COLUMNS,
        "ranking_features": RANKING_FEATURE_COLUMNS,
        "description": "Multi-criteria features for donor outreach ranking without medical decision claims."
    }
