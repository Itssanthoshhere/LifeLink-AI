"""
AI Blood Supply Command Center - Unit & Integration Tests for Demand Forecasting
---------------------------------------------------------------------------------
Tests temporal integrity, zero future leakage, chronological splitting,
lag/rolling calculations, non-negative predictions, and schema consistency.
"""

import os
import sys
from pathlib import Path
import pytest
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = PROJECT_ROOT / "src"
sys.path.insert(0, str(SRC_DIR))

from demand_features import (
    build_cartesian_demand_grid,
    aggregate_blood_requests_daily,
    prepare_demand_feature_matrix,
    split_chronological,
    get_feature_columns
)


@pytest.fixture(scope="module")
def demand_matrix():
    """Load and cache prepared demand feature matrix for testing."""
    return prepare_demand_feature_matrix()


class TestTemporalSplitsAndIntegrity:
    def test_chronological_splits_have_no_overlap(self, demand_matrix):
        train_df, val_df, test_df = split_chronological(demand_matrix)
        
        train_max = train_df["date"].max()
        val_min = val_df["date"].min()
        val_max = val_df["date"].max()
        test_min = test_df["date"].min()
        
        assert train_max < val_min, f"Train max ({train_max}) must be strictly before Val min ({val_min})"
        assert val_max < test_min, f"Val max ({val_max}) must be strictly before Test min ({test_min})"

    def test_splits_row_counts_and_completeness(self, demand_matrix):
        train_df, val_df, test_df = split_chronological(demand_matrix)
        total_rows = len(demand_matrix)
        
        assert len(train_df) + len(val_df) + len(test_df) == total_rows
        # Train should be roughly 70% of valid records, Val ~15%, Test ~15%
        assert 0.65 <= len(train_df) / total_rows <= 0.75
        assert 0.12 <= len(val_df) / total_rows <= 0.18
        assert 0.12 <= len(test_df) / total_rows <= 0.18

    def test_no_nan_values_in_feature_matrix(self, demand_matrix):
        feat_cols = get_feature_columns("24h")
        assert not demand_matrix[feat_cols].isna().any().any(), "Feature matrix contains NaN values in 24h features"
        assert not demand_matrix[["target_24h", "target_48h", "target_72h"]].isna().any().any(), "Targets contain NaNs"


class TestFeatureEngineeringCorrectness:
    def test_cartesian_grid_coverage(self):
        grid = build_cartesian_demand_grid(start_date="2024-01-01", end_date="2024-01-05")
        # 5 days * 30 hospitals * 8 blood groups * 4 components = 4800 rows
        expected_rows = 5 * 30 * 8 * 4
        assert len(grid) == expected_rows
        assert grid["hospital_id"].nunique() == 30
        assert grid["blood_group"].nunique() == 8
        assert grid["component"].nunique() == 4

    def test_lag_generation_strictly_historical(self, demand_matrix):
        # Pick one specific series and check that lag_1 is indeed previous day's demand
        sample_series = demand_matrix[
            (demand_matrix["hospital_id"] == "HOSP_001") &
            (demand_matrix["blood_group"] == "A_POS") &
            (demand_matrix["component"] == "RBC")
        ].sort_values("date").reset_index(drop=True)
        
        for i in range(1, len(sample_series)):
            expected_lag_1 = sample_series.loc[i - 1, "units_demanded"]
            actual_lag_1 = sample_series.loc[i, "lag_1"]
            assert actual_lag_1 == expected_lag_1, f"Row {i}: lag_1 ({actual_lag_1}) does not match previous units_demanded ({expected_lag_1})"

    def test_rolling_mean_strictly_historical(self, demand_matrix):
        # Verify rolling_mean_7 uses past 7 days and NOT day t
        sample = demand_matrix[
            (demand_matrix["hospital_id"] == "HOSP_003") &
            (demand_matrix["blood_group"] == "O_POS") &
            (demand_matrix["component"] == "RBC")
        ].sort_values("date").reset_index(drop=True)
        
        for i in range(7, 15):
            past_7 = sample.loc[i-7:i-1, "units_demanded"]
            expected_mean = float(past_7.mean())
            actual_mean = float(sample.loc[i, "rolling_mean_7"])
            assert pytest.approx(actual_mean, abs=1e-4) == expected_mean

    def test_target_horizons_alignment(self, demand_matrix):
        # Verify target_24h, 48h, 72h align with t+1, t+2, t+3
        sample = demand_matrix[
            (demand_matrix["hospital_id"] == "HOSP_005") &
            (demand_matrix["blood_group"] == "B_POS") &
            (demand_matrix["component"] == "Whole_Blood")
        ].sort_values("date").reset_index(drop=True)
        
        for i in range(len(sample) - 3):
            assert sample.loc[i, "target_24h"] == sample.loc[i + 1, "units_demanded"]
            assert sample.loc[i, "target_48h"] == sample.loc[i + 2, "units_demanded"]
            assert sample.loc[i, "target_72h"] == sample.loc[i + 3, "units_demanded"]


class TestModelInference:
    def test_prediction_pipeline_non_negative(self):
        from predict_demand import predict_demand
        
        res = predict_demand("HOSP_007", "O_NEG", "RBC")
        assert res["status"] == "success"
        forecast = res["forecast"]
        assert forecast["24h_units"] >= 0.0
        assert forecast["48h_units"] >= 0.0
        assert forecast["72h_units"] >= 0.0
        assert forecast["total_72h_cumulative"] >= 0.0

    def test_prediction_responds_to_emergency_override(self):
        from predict_demand import predict_demand
        
        res_normal = predict_demand("HOSP_011", "A_POS", "RBC", context_overrides={"active_emergency_flag": 0})
        res_emergency = predict_demand("HOSP_011", "A_POS", "RBC", context_overrides={"active_emergency_flag": 1, "recent_max_demand_mult": 3.0})
        
        assert res_normal["status"] == "success"
        assert res_emergency["status"] == "success"
        # In emergency conditions, predicted 24h demand should be higher or equal
        assert res_emergency["forecast"]["24h_units"] >= res_normal["forecast"]["24h_units"]

    def test_prediction_handles_all_components(self):
        from predict_demand import predict_demand
        
        for comp in ["RBC", "Platelets", "Plasma", "Whole_Blood"]:
            res = predict_demand("HOSP_003", "B_POS", comp)
            assert res["status"] == "success"
            assert res["forecast"]["24h_units"] >= 0.0
