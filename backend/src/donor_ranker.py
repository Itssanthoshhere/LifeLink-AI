"""
AI Blood Supply Command Center - Intelligent Donor Ranking & Dispatch Engine
----------------------------------------------------------------------------
Implements:
1. RuleBasedDonorRanker: Multi-Criteria Decision Analysis (MCDA) prioritizing
   proximity, responsiveness, reliability, exact compatibility, and immediate availability.
2. MLDonorRanker: Supervised ranking interface designed for production deployment
   once empirical dispatch telemetry is logged.
3. rank_donors(): Public API-ready dispatch function integrating Model 2 shortage
   early warning predictions.

LOGISTICS PROTOTYPE NOTICE:
This engine generates operational donor outreach rankings for Command Center coordinators.
It does NOT make medical screening decisions or determine clinical transfusion safety.
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"

import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import config
from donor_candidates import generate_donor_candidates
from donor_features import extract_donor_features
from predict_shortage import predict_shortage


class RuleBasedDonorRanker:
    """
    Transparent, explainable Multi-Criteria Decision Analysis (MCDA) donor ranking system.
    Scores eligible donors using documented weights that adapt dynamically to outreach urgency
    and Model 2 shortage risk probabilities.
    """

    def __init__(self, urgency: str = "routine"):
        self.urgency = urgency.lower()
        if self.urgency not in config.DONOR_URGENCY_LEVELS:
            self.urgency = "routine"
        self.weights = config.DONOR_RANKING_WEIGHTS.get(
            self.urgency, config.DONOR_RANKING_WEIGHTS["routine"]
        )

    def score_candidates(
        self,
        features_df: pd.DataFrame,
        shortage_risk_prob: float = 0.0
    ) -> pd.DataFrame:
        """
        Compute multi-criteria ranking score and sort candidates in descending priority.

        Parameters:
            features_df: DataFrame output from extract_donor_features()
            shortage_risk_prob: Model 2 shortage probability for current horizon

        Returns:
            pd.DataFrame sorted by rank with priority scores, tiers, and reason codes.
        """
        if features_df.empty:
            return features_df.copy()

        df = features_df.copy()
        w = self.weights

        # 1. Compute Base Multi-Criteria Score (0.0 to 1.0)
        base_score = (
            w["proximity"] * df["proximity_score"] +
            w["responsiveness"] * df["responsiveness_score"] +
            w["reliability"] * df["reliability_score"] +
            w["exact_match"] * df["exact_match"] +
            w["availability"] * df["is_available_now"]
        )

        # 2. Modulate by Shortage Risk and Urgency Escalation
        risk_multiplier = 1.0 + (0.25 * float(shortage_risk_prob)) + (0.10 * (df["urgency_weight"].iloc[0] - 1.0))
        scaled_score = (base_score * risk_multiplier) * 100.0 / 1.35
        df["priority_score"] = np.round(np.clip(scaled_score, 0.0, 100.0), 1)

        # 3. Sort by priority score descending; break ties with distance ascending then response_prob descending
        df.sort_values(
            by=["priority_score", "distance_km", "donor_response_probability"],
            ascending=[False, True, False],
            inplace=True
        )
        df.reset_index(drop=True, inplace=True)
        df["rank"] = df.index + 1

        # 4. Assign Priority Tier
        df["priority_tier"] = df.apply(self._assign_priority_tier, axis=1)

        # 5. Assign Recommended Contact Window
        df["recommended_contact_window"] = df.apply(self._assign_contact_window, axis=1)

        # 6. Generate Transparent Reason Codes
        df["reason_codes"] = df.apply(
            lambda row: self._generate_reason_codes(row, shortage_risk_prob), axis=1
        )

        return df

    def _assign_priority_tier(self, row: pd.Series) -> str:
        score = row["priority_score"]
        if self.urgency == "emergency":
            if score >= 68.0:
                return "CRITICAL"
            elif score >= 52.0:
                return "HIGH"
            elif score >= 38.0:
                return "MEDIUM"
            else:
                return "LOW"
        else:
            if score >= 80.0:
                return "CRITICAL"
            elif score >= 65.0:
                return "HIGH"
            elif score >= 45.0:
                return "MEDIUM"
            else:
                return "LOW"

    def _assign_contact_window(self, row: pd.Series) -> str:
        rank = row["rank"]
        if self.urgency == "emergency":
            if rank <= 5:
                return "Immediate (Within 15 mins)"
            elif rank <= 15:
                return "Rapid (Within 30 mins)"
            else:
                return "Within 1 hour"
        elif self.urgency == "urgent":
            if rank <= 10:
                return "Within 1-2 hours"
            else:
                return "Within 4 hours"
        else:
            if rank <= 10:
                return "Within 4-8 hours"
            else:
                return "Within 24 hours"

    def _generate_reason_codes(self, row: pd.Series, shortage_risk_prob: float) -> List[str]:
        codes = []
        # Compatibility
        if row["exact_match"] == 1:
            codes.append("EXACT_BLOOD_MATCH")
        else:
            codes.append(f"COMPATIBLE_{row['blood_group']}_ALTERNATIVE")

        # Proximity
        dist = row["distance_km"]
        if dist <= 5.0:
            codes.append(f"ULTRA_PROXIMITY_{dist:.1f}KM")
        elif dist <= 12.0:
            codes.append(f"NEARBY_{dist:.1f}KM")
        elif dist <= 25.0:
            codes.append(f"REGIONAL_{dist:.1f}KM")

        # Responsiveness
        p_resp = row["donor_response_probability"]
        if p_resp >= 0.80:
            codes.append("VERY_HIGH_RESPONSIVENESS")
        elif p_resp >= 0.65:
            codes.append("STRONG_RESPONSIVENESS")

        lat = row["average_response_time_minutes"]
        if lat <= 30:
            codes.append(f"RAPID_RESPONDER_{lat}MIN")

        # Reliability
        d_count = row["donation_count"]
        if d_count >= 10:
            codes.append(f"VETERAN_DONOR_{d_count}_DONATIONS")
        elif d_count >= 4:
            codes.append(f"REGULAR_DONOR_{d_count}_DONATIONS")

        # Status
        if row["availability"] == "Available":
            codes.append("IMMEDIATELY_AVAILABLE")
        elif row["availability"] == "Busy":
            codes.append("BUSY_SECONDARY_RESERVE")

        # Operational Context
        if shortage_risk_prob >= 0.50:
            codes.append(f"ELEVATED_HOSPITAL_SHORTAGE_RISK_{int(shortage_risk_prob*100)}PCT")
        if self.urgency == "emergency":
            codes.append("ACUTE_EMERGENCY_DISPATCH")

        return codes


class MLDonorRanker:
    """
    Extensible Machine Learning Ranker interface.

    STATISTICAL JUSTIFICATION DISCLOSURE:
    Supervised ML requires ground-truth labels of past outreach outcomes (e.g. outreach_sent,
    donor_responded: 0/1). The current synthetic healthcare environment contains static donor
    profiles but does NOT contain historical outreach campaign interaction logs.
    Manufacturing synthetic response labels solely to train an ML model would introduce ungrounded
    noise and false scientific rigor.

    Therefore, the system uses the explainable RuleBasedDonorRanker as its primary engine, while
    providing this ML interface for plug-and-play deployment when empirical dispatch telemetry
    is collected by Engine 4.
    """

    def __init__(self, model: Optional[Any] = None):
        self.model = model
        self.is_trained = model is not None
        self.fallback_ranker = RuleBasedDonorRanker()

    def rank(self, features_df: pd.DataFrame, shortage_risk_prob: float = 0.0) -> pd.DataFrame:
        if not self.is_trained:
            # Transparent fallback to rule-based ranker
            return self.fallback_ranker.score_candidates(features_df, shortage_risk_prob)
        # If a trained model is provided in future revisions, predict ranking scores
        df = features_df.copy()
        X = df[config.DONOR_RANKING_WEIGHTS.keys()]
        df["priority_score"] = np.round(self.model.predict(X) * 100.0, 1)
        df.sort_values(by="priority_score", ascending=False, inplace=True)
        df.reset_index(drop=True, inplace=True)
        df["rank"] = df.index + 1
        return df


def rank_donors(
    hospital_id: str,
    blood_group: str,
    component: str = "RBC",
    urgency: str = "routine",
    required_units: int = 1,
    prediction_horizon: str = "24h",
    top_k: int = 20,
    shortage_prob_override: Optional[float] = None,
    reference_date_str: str = "2025-12-31"
) -> Dict[str, Any]:
    """
    API-ready intelligent donor ranking and dispatch function.
    Connects Model 2 shortage predictions, applies multi-stage candidate filtering,
    and returns structured rankings for Command Center dashboards.

    Parameters:
        hospital_id: Hospital identifier (e.g. 'HOSP_007')
        blood_group: Needed blood group (e.g. 'O_NEG')
        component: Needed component ('RBC', 'Platelets', 'Plasma', 'Whole_Blood')
        urgency: Outreach tier ('routine', 'urgent', 'emergency')
        required_units: Number of units required
        prediction_horizon: Horizon to evaluate ('24h', '48h', '72h')
        top_k: Number of ranked donors to return
        shortage_prob_override: Optional manual shortage probability override
        reference_date_str: Snapshot date for inter-donation interval verification

    Returns:
        Structured JSON-compatible dictionary with metadata, shortage risk, candidate metrics,
        and ranked donor candidates.
    """
    urgency = urgency.lower()

    # 1. Retrieve Model 2 Shortage Early Warning Predictions
    shortage_info: Dict[str, Any] = {}
    shortage_prob = 0.0
    risk_level = "UNKNOWN"

    try:
        shortage_res = predict_shortage(
            hospital_id=hospital_id,
            blood_group=blood_group,
            component=component
        )
        if shortage_res.get("status") == "success":
            risk_assessment = shortage_res.get("risk_assessment", {})
            h_data = risk_assessment.get(prediction_horizon, {})
            shortage_prob = float(h_data.get("probability", 0.0))
            risk_level = str(h_data.get("risk_level", "LOW"))
            shortage_info = {
                "shortage_24h_prob": risk_assessment.get("24h", {}).get("probability", 0.0),
                "shortage_24h_risk": risk_assessment.get("24h", {}).get("risk_level", "LOW"),
                "shortage_48h_prob": risk_assessment.get("48h", {}).get("probability", 0.0),
                "shortage_48h_risk": risk_assessment.get("48h", {}).get("risk_level", "LOW"),
                "shortage_72h_prob": risk_assessment.get("72h", {}).get("probability", 0.0),
                "shortage_72h_risk": risk_assessment.get("72h", {}).get("risk_level", "LOW"),
                "evaluated_horizon": prediction_horizon,
                "evaluated_horizon_prob": shortage_prob,
                "evaluated_horizon_risk": risk_level,
            }
    except Exception as e:
        shortage_info = {
            "error": str(e),
            "evaluated_horizon": prediction_horizon,
            "evaluated_horizon_prob": 0.0,
            "evaluated_horizon_risk": "LOW"
        }

    if shortage_prob_override is not None:
        shortage_prob = float(shortage_prob_override)
        shortage_info["evaluated_horizon_prob"] = shortage_prob
        shortage_info["shortage_override"] = True

    # 2. Multi-Stage Candidate Generation (Eligibility Filtering)
    candidates_df = generate_donor_candidates(
        hospital_id=hospital_id,
        blood_group=blood_group,
        component=component,
        urgency=urgency,
        required_units=required_units,
        prediction_horizon=prediction_horizon,
        reference_date_str=reference_date_str
    )

    total_eligible = len(candidates_df)
    compatible_exact = int(candidates_df["exact_match"].sum()) if total_eligible > 0 else 0
    compatible_alternative = total_eligible - compatible_exact

    # Proximity breakdown
    within_5km = int((candidates_df["distance_km"] <= 5.0).sum()) if total_eligible > 0 else 0
    within_10km = int((candidates_df["distance_km"] <= 10.0).sum()) if total_eligible > 0 else 0
    within_25km = int((candidates_df["distance_km"] <= 25.0).sum()) if total_eligible > 0 else 0
    median_dist = float(np.median(candidates_df["distance_km"])) if total_eligible > 0 else 0.0

    # 3. Feature Extraction
    features_df = extract_donor_features(
        candidates_df=candidates_df,
        shortage_risk_prob=shortage_prob,
        urgency=urgency
    )

    # 4. Multi-Criteria Ranking
    ranker = RuleBasedDonorRanker(urgency=urgency)
    ranked_df = ranker.score_candidates(features_df, shortage_risk_prob=shortage_prob)

    # 5. Extract Top-K Candidates
    top_candidates = ranked_df.head(top_k)

    # Expected response yield across top_k outreach: sum of response probabilities
    expected_yield = float(np.round(top_candidates["donor_response_probability"].sum(), 2)) if not top_candidates.empty else 0.0

    donors_list = []
    for _, r in top_candidates.iterrows():
        donors_list.append({
            "rank": int(r["rank"]),
            "donor_id": str(r["donor_id"]),
            "blood_group": str(r["blood_group"]),
            "compatibility_type": str(r["compatibility_type"]),
            "distance_km": float(r["distance_km"]),
            "estimated_travel_time_min": float(r["estimated_travel_time_min"]),
            "availability": str(r["availability"]),
            "response_probability": float(r["donor_response_probability"]),
            "average_response_time_minutes": int(r["average_response_time_minutes"]),
            "donation_count": int(r["donation_count"]),
            "priority_score": float(r["priority_score"]),
            "priority_tier": str(r["priority_tier"]),
            "recommended_contact_window": str(r["recommended_contact_window"]),
            "reason_codes": list(r["reason_codes"])
        })

    return {
        "status": "success",
        "query": {
            "hospital_id": hospital_id,
            "hospital_name": candidates_df["hospital_name"].iloc[0] if total_eligible > 0 else "Unknown Hospital",
            "blood_group": blood_group,
            "component": component,
            "urgency": urgency.upper(),
            "required_units": required_units,
            "prediction_horizon": prediction_horizon,
            "top_k_requested": top_k,
            "top_k_returned": len(donors_list)
        },
        "shortage_risk_assessment": shortage_info,
        "candidate_pool_summary": {
            "total_eligible_candidates": total_eligible,
            "exact_blood_match_count": compatible_exact,
            "compatible_alternative_count": compatible_alternative,
            "candidates_within_5km": within_5km,
            "candidates_within_10km": within_10km,
            "candidates_within_25km": within_25km,
            "median_candidate_distance_km": round(median_dist, 2),
            "expected_top_k_response_yield": expected_yield,
        },
        "ranking_engine": {
            "model_type": "RuleBasedDonorRanker (Multi-Criteria Decision Analysis)",
            "weights_used": ranker.weights,
            "ml_status": "Statistically unjustified for supervised training due to absence of historical dispatch logs"
        },
        "top_donors": donors_list,
        "disclaimer": (
            "MODEL OUTPUT ONLY — NOT A CLINICAL DIRECTIVE. Intended strictly for Command Center logistical "
            "donor outreach prioritization. Final donor eligibility and transfusion compatibility require "
            "qualified medical and blood-bank verification."
        )
    }
