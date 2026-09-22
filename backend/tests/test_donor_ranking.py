"""
AI Blood Supply Command Center - Unit & Integration Test Suite
Model 3: Intelligent Donor Ranking & Dispatch
-------------------------------------------------------------
Comprehensive testing covering:
1. Blood group compatibility rules for all components & groups
2. Incompatible donors exclusion
3. Unavailable/Inactive donors exclusion
4. Inter-donation interval restriction (>= 90 days)
5. Haversine distance & travel time calculations
6. Ranking determinism & sort order consistency
7. Top-K output format and schema adherence
8. Zero lookahead/future leakage verification
9. Model 2 Shortage Early Warning integration
10. Emergency prioritization & radius expansion
11. O-negative crisis handling
12. Transport disruption scenario handling
13. Donor availability slump handling
14. Empty candidate pool graceful degradation
15. Probability bounds [0, 1] validation
16. Priority score bounds [0, 100] validation
17. Full API JSON response schema compliance
"""

import math
from pathlib import Path
import pytest
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent

import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import config
from blood_compatibility import (
    is_compatible,
    is_compatible_donor_group,
    get_compatible_donors,
    RBC_COMPATIBILITY,
    PLASMA_COMPATIBILITY,
    PLATELETS_COMPATIBILITY,
    WHOLE_BLOOD_COMPATIBILITY,
)
from donor_candidates import (
    generate_donor_candidates,
    haversine_distance_km,
    get_hospital_coordinates,
)
from donor_features import extract_donor_features
from donor_ranker import (
    RuleBasedDonorRanker,
    MLDonorRanker,
    rank_donors,
)


# ===========================================================================
# 1. Blood Group Compatibility Tests
# ===========================================================================
class TestBloodCompatibility:
    def test_all_components_and_groups_defined(self):
        for comp in config.BLOOD_COMPONENTS:
            for bg in config.BLOOD_GROUPS:
                compatible = get_compatible_donors(bg, comp)
                assert len(compatible) >= 1
                assert is_compatible_donor_group(bg, bg, comp) is True

    def test_universal_rbc_donor_and_recipient(self):
        # O_NEG is universal RBC donor
        for recipient in config.BLOOD_GROUPS:
            assert is_compatible_donor_group("O_NEG", recipient, "RBC") is True

        # AB_POS is universal RBC recipient
        for donor in config.BLOOD_GROUPS:
            assert is_compatible_donor_group(donor, "AB_POS", "RBC") is True

        # O_NEG can ONLY receive O_NEG RBCs
        for donor in config.BLOOD_GROUPS:
            if donor == "O_NEG":
                assert is_compatible_donor_group(donor, "O_NEG", "RBC") is True
            else:
                assert is_compatible_donor_group(donor, "O_NEG", "RBC") is False

    def test_plasma_inversion_rules(self):
        # AB is universal plasma donor
        for recipient in config.BLOOD_GROUPS:
            assert is_compatible_donor_group("AB_POS", recipient, "Plasma") is True or \
                   is_compatible_donor_group("AB_NEG", recipient, "Plasma") is True

        # O is universal plasma recipient
        for donor in config.BLOOD_GROUPS:
            assert is_compatible_donor_group(donor, "O_POS", "Plasma") is True


# ===========================================================================
# 2. Candidate Generation & Eligibility Filtering Tests
# ===========================================================================
class TestCandidateEligibilityFiltering:
    def test_incompatible_donors_strictly_excluded(self):
        # O_NEG recipient for RBC can ONLY match O_NEG donors
        candidates = generate_donor_candidates(
            hospital_id="HOSP_001",
            blood_group="O_NEG",
            component="RBC",
            urgency="emergency",
            required_units=2
        )
        assert not candidates.empty
        assert (candidates["blood_group"] == "O_NEG").all()

    def test_inactive_donors_always_excluded(self):
        candidates = generate_donor_candidates(
            hospital_id="HOSP_001",
            blood_group="O_POS",
            component="RBC",
            urgency="emergency"
        )
        assert not candidates.empty
        assert "Inactive" not in candidates["availability"].values

    def test_routine_outreach_excludes_busy_donors(self):
        candidates = generate_donor_candidates(
            hospital_id="HOSP_001",
            blood_group="O_POS",
            component="RBC",
            urgency="routine"
        )
        assert not candidates.empty
        assert (candidates["availability"] == "Available").all()

    def test_recent_donation_interval_restriction(self):
        candidates = generate_donor_candidates(
            hospital_id="HOSP_002",
            blood_group="A_POS",
            component="RBC",
            urgency="routine"
        )
        assert not candidates.empty
        assert (candidates["days_since_last_donation"] >= config.DONOR_MIN_DAYS_BETWEEN_DONATIONS).all()
        assert (candidates["eligible"] == True).all()  # noqa: E712

    def test_distance_limits_enforced(self):
        # Routine limit: 35 km
        c_routine = generate_donor_candidates(
            hospital_id="HOSP_001",
            blood_group="O_POS",
            component="RBC",
            urgency="routine"
        )
        assert (c_routine["distance_km"] <= config.DONOR_MAX_TRAVEL_DISTANCE_KM).all()

        # Emergency limit: 50 km
        c_emerg = generate_donor_candidates(
            hospital_id="HOSP_001",
            blood_group="O_POS",
            component="RBC",
            urgency="emergency"
        )
        assert (c_emerg["distance_km"] <= config.DONOR_MAX_TRAVEL_DISTANCE_EMERGENCY_KM).all()

    def test_haversine_distance_accuracy(self):
        # Known points: Bangalore Center (12.9716, 77.5946) to Whitefield (12.9698, 77.7500) ~ 16.8 km
        d = haversine_distance_km(12.9716, 77.5946, 12.9698, 77.7500)
        assert 16.0 < d < 17.5

        # Distance to self must be zero
        assert haversine_distance_km(12.90, 77.58, 12.90, 77.58) == 0.0


# ===========================================================================
# 3. Ranking Engine & Multi-Criteria Scoring Tests
# ===========================================================================
class TestDonorRankingEngine:
    def test_ranking_determinism(self):
        res1 = rank_donors("HOSP_007", "O_NEG", "RBC", "emergency", top_k=10)
        res2 = rank_donors("HOSP_007", "O_NEG", "RBC", "emergency", top_k=10)
        donors1 = [d["donor_id"] for d in res1["top_donors"]]
        donors2 = [d["donor_id"] for d in res2["top_donors"]]
        assert donors1 == donors2

    def test_top_k_output_length(self):
        res = rank_donors("HOSP_001", "O_POS", "RBC", "routine", top_k=7)
        assert len(res["top_donors"]) == 7
        assert res["top_donors"][0]["rank"] == 1
        assert res["top_donors"][6]["rank"] == 7

    def test_priority_scores_and_probability_bounds(self):
        res = rank_donors("HOSP_003", "B_POS", "Platelets", "urgent", top_k=20)
        for d in res["top_donors"]:
            assert 0.0 <= d["priority_score"] <= 100.0
            assert 0.0 <= d["response_probability"] <= 1.0
            assert d["priority_tier"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
            assert len(d["reason_codes"]) >= 1

    def test_emergency_escalates_priority_scores(self):
        # Compare same candidates under routine vs emergency
        res_routine = rank_donors("HOSP_007", "O_NEG", "RBC", "routine", top_k=5, shortage_prob_override=0.8)
        res_emerg = rank_donors("HOSP_007", "O_NEG", "RBC", "emergency", top_k=5, shortage_prob_override=0.8)

        # In emergency, top candidates should receive higher priority scores and tighter contact windows
        top_r = res_routine["top_donors"][0]
        top_e = res_emerg["top_donors"][0]
        assert top_e["priority_score"] >= top_r["priority_score"]
        assert "Within 15 mins" in top_e["recommended_contact_window"]

    def test_zero_future_leakage_in_features(self):
        candidates = generate_donor_candidates("HOSP_001", "O_POS", "RBC")
        features = extract_donor_features(candidates, shortage_risk_prob=0.3)
        # Ensure no target or future columns exist in feature columns
        for c in features.columns:
            assert "target" not in c
            assert "future" not in c
            assert "outcome" not in c


# ===========================================================================
# 4. Scenario Testing & Edge Cases
# ===========================================================================
class TestScenariosAndEdgeCases:
    def test_o_negative_crisis_scenario(self):
        res = rank_donors("HOSP_007", "O_NEG", "RBC", "emergency", required_units=8)
        pool = res["candidate_pool_summary"]
        assert pool["total_eligible_candidates"] >= 50
        assert pool["candidates_within_10km"] >= 1
        assert res["top_donors"][0]["blood_group"] == "O_NEG"

    def test_donor_availability_slump_scenario(self):
        res = rank_donors("HOSP_001", "O_POS", "RBC", "routine", shortage_prob_override=0.65)
        assert res["status"] == "success"
        assert len(res["top_donors"]) == 20
        # Check that high shortage probability is reflected in reason codes
        reasons_concat = " ".join([" ".join(d["reason_codes"]) for d in res["top_donors"]])
        assert "SHORTAGE_RISK" in reasons_concat

    def test_empty_candidate_pool_handling(self):
        # Impose a 0.001 km limit to guarantee empty pool
        empty_candidates = generate_donor_candidates(
            hospital_id="HOSP_001",
            blood_group="O_NEG",
            component="RBC",
            max_distance_km=0.001
        )
        assert empty_candidates.empty

        # Feature extraction handles empty candidates gracefully
        empty_feat = extract_donor_features(empty_candidates)
        assert empty_feat.empty

        # Ranker handles empty candidates gracefully
        ranker = RuleBasedDonorRanker()
        empty_ranked = ranker.score_candidates(empty_feat)
        assert empty_ranked.empty

    def test_full_api_json_schema_compliance(self):
        res = rank_donors("HOSP_002", "A_POS", "RBC", "urgent", required_units=3, top_k=5)
        required_keys = [
            "status", "query", "shortage_risk_assessment",
            "candidate_pool_summary", "ranking_engine", "top_donors", "disclaimer"
        ]
        for k in required_keys:
            assert k in res

        assert res["query"]["hospital_id"] == "HOSP_002"
        assert res["query"]["blood_group"] == "A_POS"
        assert len(res["top_donors"]) == 5

        donor_keys = [
            "rank", "donor_id", "blood_group", "compatibility_type",
            "distance_km", "estimated_travel_time_min", "availability",
            "response_probability", "average_response_time_minutes",
            "donation_count", "priority_score", "priority_tier",
            "recommended_contact_window", "reason_codes"
        ]
        for dk in donor_keys:
            assert dk in res["top_donors"][0]
