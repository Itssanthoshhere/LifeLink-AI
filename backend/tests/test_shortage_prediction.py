"""
AI Blood Supply Command Center - Unit & Integration Tests for Shortage Prediction (Model 2)
--------------------------------------------------------------------------------------------
Tests temporal integrity, binary label validity, non-negative stock, expiry horizons,
Model 1 forecast integration, calibrated probabilities, risk tiers, and inference API.
"""

import sys
from pathlib import Path
import pytest
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = PROJECT_ROOT / "src"
sys.path.insert(0, str(SRC_DIR))

from shortage_features import (
    prepare_shortage_feature_matrix,
    split_chronological,
    get_shortage_feature_columns,
    ShortagePredictorPipeline
)
import config


@pytest.fixture(scope="module")
def shortage_matrix():
    """Load cached shortage feature matrix."""
    return prepare_shortage_feature_matrix()


class TestShortageTemporalIntegrity:
    def test_chronological_splits_strictly_ordered(self, shortage_matrix):
        train_df, val_df, test_df = split_chronological(shortage_matrix)
        
        assert train_df["date"].max() < val_df["date"].min(), "Train max date must precede Val min date"
        assert val_df["date"].max() < test_df["date"].min(), "Val max date must precede Test min date"

    def test_labels_are_binary(self, shortage_matrix):
        for h in ["24h", "48h", "72h"]:
            col = f"shortage_{h}"
            assert set(shortage_matrix[col].unique()).issubset({0, 1}), f"{col} contains non-binary values"

    def test_horizon_monotonicity_in_labels(self, shortage_matrix):
        # A shortage in 24h must also imply a shortage occurred within 48h and 72h
        # shortage_24h <= shortage_48h <= shortage_72h
        s24 = shortage_matrix["shortage_24h"].values
        s48 = shortage_matrix["shortage_48h"].values
        s72 = shortage_matrix["shortage_72h"].values

        assert np.all(s24 <= s48), "24h shortage must be a subset of 48h shortage"
        assert np.all(s48 <= s72), "48h shortage must be a subset of 72h shortage"


class TestFeatureEngineeringValidity:
    def test_inventory_and_expiry_validity(self, shortage_matrix):
        assert (shortage_matrix["current_units"] >= 0).all(), "Negative inventory detected"
        assert (shortage_matrix["available_units"] >= 0).all(), "Negative available inventory detected"
        
        # Expiry hierarchy: 1d <= 2d <= 3d <= 5d
        e1 = shortage_matrix["units_expiring_1d"].values
        e2 = shortage_matrix["units_expiring_2d"].values
        e3 = shortage_matrix["units_expiring_3d"].values
        e5 = shortage_matrix["units_expiring_5d"].values

        assert np.all(e1 <= e2), "1-day expiring units cannot exceed 2-day expiring units"
        assert np.all(e2 <= e3), "2-day expiring units cannot exceed 3-day expiring units"
        assert np.all(e3 <= e5), "3-day expiring units cannot exceed 5-day expiring units"

    def test_forecast_integration(self, shortage_matrix):
        for h in ["24h", "48h", "72h"]:
            f_col = f"forecast_{h}"
            assert f_col in shortage_matrix.columns, f"Model 1 forecast column {f_col} missing"
            assert (shortage_matrix[f_col] >= 0.0).all(), f"Negative forecast found in {f_col}"

    def test_no_nan_values_in_feature_columns(self, shortage_matrix):
        feat_cols = get_shortage_feature_columns()
        for c in feat_cols:
            assert not shortage_matrix[c].isna().any(), f"Feature column {c} contains NaN values"


class TestModelInferenceAndRiskTiers:
    def test_risk_level_mapping(self):
        assert ShortagePredictorPipeline.get_risk_level(0.05) == "LOW"
        assert ShortagePredictorPipeline.get_risk_level(0.35) == "MEDIUM"
        assert ShortagePredictorPipeline.get_risk_level(0.65) == "HIGH"
        assert ShortagePredictorPipeline.get_risk_level(0.85) == "CRITICAL"

    def test_predict_shortage_api(self):
        from predict_shortage import predict_shortage

        res = predict_shortage("HOSP_007", "O_NEG", "RBC")
        assert res["status"] == "success"
        risk = res["risk_assessment"]
        
        for h in ["24h", "48h", "72h"]:
            prob = risk[h]["probability"]
            level = risk[h]["risk_level"]
            assert 0.0 <= prob <= 1.0, f"Probability for {h} out of bounds: {prob}"
            assert level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

        assert len(res["contributing_factors"]) > 0, "Contributing factors list cannot be empty"

    def test_emergency_override_escalates_risk(self):
        from predict_shortage import predict_shortage

        res_norm = predict_shortage("HOSP_003", "A_POS", "RBC", context_overrides={"active_emergency_flag": 0})
        res_emerg = predict_shortage("HOSP_003", "A_POS", "RBC", context_overrides={"active_emergency_flag": 1, "recent_max_demand_mult": 3.0})

        p_norm = res_norm["risk_assessment"]["24h"]["probability"]
        p_emerg = res_emerg["risk_assessment"]["24h"]["probability"]
        # Emergency condition should escalate or maintain shortage probability
        assert p_emerg >= p_norm - 1e-4
