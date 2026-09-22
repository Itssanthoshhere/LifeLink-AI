"""
AI Blood Supply Command Center - Demand Model Training Pipeline
----------------------------------------------------------------
Trains multi-horizon (24h, 48h, 72h) XGBoost demand forecasting models.
Evaluates against 3 naive baselines, calculates MAE, RMSE, WAPE, Safe MAPE, R2,
analyzes operational regime performance (Normal vs Spikes vs Emergencies),
and persists trained model pipelines and metrics.
"""

import json
import pickle
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

from demand_features import (
    prepare_demand_feature_matrix,
    split_chronological,
    get_feature_columns,
    DemandForecasterPipeline,
    PROJECT_ROOT
)

MODELS_DIR = PROJECT_ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Calculate comprehensive forecasting metrics with zero-safe handling.
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)
    y_pred = np.clip(y_pred, 0.0, None)  # demand cannot be negative

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    
    # WAPE: sum(|y - y_hat|) / sum(y) * 100%
    sum_true = float(np.sum(y_true))
    wape = float(np.sum(np.abs(y_true - y_pred)) / max(1.0, sum_true) * 100.0)
    
    # Safe MAPE: computed over non-zero observations to prevent division by zero
    non_zero_mask = y_true > 0
    if np.sum(non_zero_mask) > 0:
        safe_mape = float(np.mean(np.abs(y_true[non_zero_mask] - y_pred[non_zero_mask]) / y_true[non_zero_mask]) * 100.0)
    else:
        safe_mape = 0.0

    r2 = float(r2_score(y_true, y_pred))

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "wape_pct": round(wape, 2),
        "safe_mape_pct": round(safe_mape, 2),
        "r2": round(r2, 4)
    }


def evaluate_baselines(test_df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Evaluate Baseline 1 (Previous Day), Baseline 2 (7-Day Avg), Baseline 3 (Same Day Last Week).
    """
    baselines_report = {}
    
    for h_name, target_col in [("24h", "target_24h"), ("48h", "target_48h"), ("72h", "target_72h")]:
        y_test = test_df[target_col].values
        
        # Baseline 1: lag_1 (most recent known day)
        pred_b1 = test_df["lag_1"].values
        m_b1 = calculate_metrics(y_test, pred_b1)
        
        # Baseline 2: rolling_mean_7 (7-day moving average)
        pred_b2 = test_df["rolling_mean_7"].values
        m_b2 = calculate_metrics(y_test, pred_b2)
        
        # Baseline 3: lag_7 (same day last week)
        pred_b3 = test_df["lag_7"].values
        m_b3 = calculate_metrics(y_test, pred_b3)
        
        baselines_report[h_name] = {
            "previous_day_lag1": m_b1,
            "seven_day_moving_avg": m_b2,
            "same_day_last_week_lag7": m_b3
        }
        
    return baselines_report


def train_and_evaluate_all():
    print("=" * 70)
    print("AI BLOOD SUPPLY COMMAND CENTER — DEMAND FORECASTING TRAINING PIPELINE")
    print("=" * 70)

    # 1. Feature Engineering Matrix
    print("\n[1/5] Building zero-leakage feature matrix from simulated records...")
    df = prepare_demand_feature_matrix()
    train_df, val_df, test_df = split_chronological(df)
    
    print(f"Total valid time series records : {len(df):,}")
    print(f"Training split   (70%)          : {train_df['date'].min()} to {train_df['date'].max()} ({len(train_df):,} rows)")
    print(f"Validation split (15%)          : {val_df['date'].min()} to {val_df['date'].max()} ({len(val_df):,} rows)")
    print(f"Test split       (15%)          : {test_df['date'].min()} to {test_df['date'].max()} ({len(test_df):,} rows)")

    # 2. Evaluate Baselines
    print("\n[2/5] Evaluating statistical naive baselines on Test set...")
    baselines_report = evaluate_baselines(test_df)
    
    print("\nBaseline Comparison on 24h Horizon:")
    print("-" * 65)
    print(f"{'Baseline Model':<28} {'MAE':<8} {'RMSE':<8} {'WAPE %':<10} {'R2':<8}")
    print("-" * 65)
    for b_name, metrics in baselines_report["24h"].items():
        print(f"{b_name:<28} {metrics['mae']:<8.3f} {metrics['rmse']:<8.3f} {metrics['wape_pct']:<10.1f} {metrics['r2']:<8.3f}")
    print("-" * 65)

    # 3. Train Multi-Horizon XGBoost Models
    print("\n[3/5] Training Direct Multi-Step XGBoost Models (24h, 48h, 72h)...")
    horizons = [
        ("24h", "target_24h"),
        ("48h", "target_48h"),
        ("72h", "target_72h")
    ]
    
    xgb_models: Dict[str, DemandForecasterPipeline] = {}
    xgb_test_metrics: Dict[str, Dict[str, float]] = {}
    feature_importances: Dict[str, List[Dict[str, Any]]] = {}
    feature_schemas: Dict[str, List[str]] = {}

    xgb_params = {
        "n_estimators": 160,
        "learning_rate": 0.07,
        "max_depth": 7,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "tree_method": "hist",
        "random_state": 42,
        "enable_categorical": True
    }

    categorical_cols = ["hospital_id", "blood_group", "component", "hospital_type", "season", "weather"]

    for h_name, target_col in horizons:
        print(f"\n--> Training XGBoost for {h_name} Horizon (target={target_col})...")
        feat_cols = get_feature_columns(horizon=h_name)
        feature_schemas[h_name] = feat_cols
        
        # Prepare datasets with category dtypes
        X_train = train_df[feat_cols].copy()
        y_train = train_df[target_col].values
        X_val = val_df[feat_cols].copy()
        y_val = val_df[target_col].values
        X_test = test_df[feat_cols].copy()
        y_test = test_df[target_col].values

        for c in categorical_cols:
            if c in X_train.columns:
                X_train[c] = X_train[c].astype("category")
                X_val[c] = X_val[c].astype("category")
                X_test[c] = X_test[c].astype("category")

        model = xgb.XGBRegressor(**xgb_params)
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )

        pipeline = DemandForecasterPipeline(horizon=h_name, feature_cols=feat_cols, model=model)
        xgb_models[h_name] = pipeline

        # Save model pickle
        model_path = MODELS_DIR / f"demand_xgb_{h_name}.pkl"
        with open(model_path, "wb") as f:
            pickle.dump(pipeline, f)
        print(f"    Saved pipeline artifact to {model_path}")

        # Test evaluation
        preds = pipeline.predict(test_df)
        metrics = calculate_metrics(y_test, preds)
        xgb_test_metrics[h_name] = metrics
        print(f"    Test Metrics: MAE={metrics['mae']:.3f}, RMSE={metrics['rmse']:.3f}, WAPE={metrics['wape_pct']:.1f}%, R2={metrics['r2']:.3f}")

        # Feature importance
        booster = model.get_booster()
        score_dict = booster.get_score(importance_type="gain")
        sorted_fi = sorted(score_dict.items(), key=lambda x: x[1], reverse=True)
        feature_importances[h_name] = [
            {"feature": k, "gain": round(float(v), 2)}
            for k, v in sorted_fi[:20]
        ]

    # 4. Sliced Performance Analysis on Test Set (using 24h model as primary reference)
    print("\n[4/5] Conducting granular sliced analysis on Test Set...")
    p24 = xgb_models["24h"].predict(test_df)
    test_eval = test_df.copy()
    test_eval["y_true_24h"] = test_eval["target_24h"].values
    test_eval["y_pred_24h"] = p24

    # A. By Blood Group
    bg_sliced = {}
    for bg, group_data in test_eval.groupby("blood_group"):
        bg_sliced[bg] = calculate_metrics(group_data["y_true_24h"].values, group_data["y_pred_24h"].values)

    # B. By Component
    comp_sliced = {}
    for comp, group_data in test_eval.groupby("component"):
        comp_sliced[comp] = calculate_metrics(group_data["y_true_24h"].values, group_data["y_pred_24h"].values)

    # C. By Hospital Type
    hosp_sliced = {}
    for htype, group_data in test_eval.groupby("hospital_type"):
        hosp_sliced[htype] = calculate_metrics(group_data["y_true_24h"].values, group_data["y_pred_24h"].values)

    # D. Operational Regimes (Normal vs Demand Spike vs Emergency)
    # Define regimes:
    # Emergency: active_emergency_flag == 1 or recent_emergency_count_24h > 0
    # Demand Spike: holiday_flag == 1 or festival_flag == 1 or accident_count > 15
    # Normal: neither
    em_mask = (test_eval["active_emergency_flag"] == 1) | (test_eval["recent_emergency_count_24h"] > 0)
    spike_mask = (~em_mask) & (test_eval["holiday_flag"] == 1)
    normal_mask = (~em_mask) & (~spike_mask)

    regimes_sliced = {
        "normal_operations": calculate_metrics(test_eval.loc[normal_mask, "y_true_24h"].values, test_eval.loc[normal_mask, "y_pred_24h"].values),
        "demand_spikes": calculate_metrics(test_eval.loc[spike_mask, "y_true_24h"].values, test_eval.loc[spike_mask, "y_pred_24h"].values),
        "emergency_events": calculate_metrics(test_eval.loc[em_mask, "y_true_24h"].values, test_eval.loc[em_mask, "y_pred_24h"].values)
    }

    # 5. Persist Full Model Metrics & Feature Schema
    print("\n[5/5] Persisting schema and metrics reports...")
    
    schema_payload = {
        "model_version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "random_seed": 42,
        "horizons": ["24h", "48h", "72h"],
        "categorical_columns": categorical_cols,
        "feature_columns_by_horizon": feature_schemas,
        "chronological_split": {
            "train_period": [str(train_df['date'].min()), str(train_df['date'].max())],
            "val_period": [str(val_df['date'].min()), str(val_df['date'].max())],
            "test_period": [str(test_df['date'].min()), str(test_df['date'].max())]
        }
    }
    with open(MODELS_DIR / "feature_schema.json", "w") as f:
        json.dump(schema_payload, f, indent=2)

    full_metrics = {
        "generated_at": datetime.now().isoformat(),
        "random_seed": 42,
        "dataset_split": {
            "train_days": int(train_df["date"].nunique()),
            "val_days": int(val_df["date"].nunique()),
            "test_days": int(test_df["date"].nunique()),
            "train_rows": len(train_df),
            "val_rows": len(val_df),
            "test_rows": len(test_df)
        },
        "baseline_models": baselines_report,
        "xgboost_models": {
            "24h": xgb_test_metrics["24h"],
            "48h": xgb_test_metrics["48h"],
            "72h": xgb_test_metrics["72h"]
        },
        "operational_regimes": regimes_sliced,
        "sliced_by_blood_group": bg_sliced,
        "sliced_by_component": comp_sliced,
        "sliced_by_hospital_type": hosp_sliced,
        "top_features": feature_importances
    }
    with open(MODELS_DIR / "model_metrics.json", "w") as f:
        json.dump(full_metrics, f, indent=2)

    print(f"Saved feature schema to {MODELS_DIR / 'feature_schema.json'}")
    print(f"Saved complete metrics to {MODELS_DIR / 'model_metrics.json'}")

    # Summary Benchmark Table
    print("\n" + "=" * 75)
    print("FINAL BENCHMARK COMPARISON TABLE (TEST SET)")
    print("=" * 75)
    print(f"{'Model / Horizon':<32} {'MAE':<8} {'RMSE':<8} {'WAPE %':<10} {'R2':<8}")
    print("-" * 75)
    print(f"{'Baseline 1 (Previous Day 24h)':<32} {baselines_report['24h']['previous_day_lag1']['mae']:<8.3f} {baselines_report['24h']['previous_day_lag1']['rmse']:<8.3f} {baselines_report['24h']['previous_day_lag1']['wape_pct']:<10.1f} {baselines_report['24h']['previous_day_lag1']['r2']:<8.3f}")
    print(f"{'Baseline 2 (7-Day Moving Avg 24h)':<32} {baselines_report['24h']['seven_day_moving_avg']['mae']:<8.3f} {baselines_report['24h']['seven_day_moving_avg']['rmse']:<8.3f} {baselines_report['24h']['seven_day_moving_avg']['wape_pct']:<10.1f} {baselines_report['24h']['seven_day_moving_avg']['r2']:<8.3f}")
    print(f"{'Baseline 3 (Same Day L-W 24h)':<32} {baselines_report['24h']['same_day_last_week_lag7']['mae']:<8.3f} {baselines_report['24h']['same_day_last_week_lag7']['rmse']:<8.3f} {baselines_report['24h']['same_day_last_week_lag7']['wape_pct']:<10.1f} {baselines_report['24h']['same_day_last_week_lag7']['r2']:<8.3f}")
    print("-" * 75)
    print(f"{'XGBoost (24h Forecast)':<32} {xgb_test_metrics['24h']['mae']:<8.3f} {xgb_test_metrics['24h']['rmse']:<8.3f} {xgb_test_metrics['24h']['wape_pct']:<10.1f} {xgb_test_metrics['24h']['r2']:<8.3f}")
    print(f"{'XGBoost (48h Forecast)':<32} {xgb_test_metrics['48h']['mae']:<8.3f} {xgb_test_metrics['48h']['rmse']:<8.3f} {xgb_test_metrics['48h']['wape_pct']:<10.1f} {xgb_test_metrics['48h']['r2']:<8.3f}")
    print(f"{'XGBoost (72h Forecast)':<32} {xgb_test_metrics['72h']['mae']:<8.3f} {xgb_test_metrics['72h']['rmse']:<8.3f} {xgb_test_metrics['72h']['wape_pct']:<10.1f} {xgb_test_metrics['72h']['r2']:<8.3f}")
    print("=" * 75)

    print("\nOPERATIONAL REGIME BREAKDOWN (24h XGBoost):")
    print("-" * 65)
    for regime_name, r_metrics in regimes_sliced.items():
        print(f"{regime_name:<25} MAE={r_metrics['mae']:<6.3f} RMSE={r_metrics['rmse']:<6.3f} WAPE={r_metrics['wape_pct']:<6.1f}% R2={r_metrics['r2']:<6.3f}")
    print("-" * 65)


if __name__ == "__main__":
    train_and_evaluate_all()
