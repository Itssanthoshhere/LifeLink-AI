"""
AI Blood Supply Command Center - Shortage Model Training Pipeline
------------------------------------------------------------------
Trains multi-horizon (24h, 48h, 72h) XGBoost shortage early warning classifiers.
Evaluates against a rule-based inventory buffer baseline, handles class imbalance,
calibrates probabilities via isotonic regression, analyzes 9 operational scenarios,
and persists trained pipelines and metrics.
"""

import json
import pickle
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    brier_score_loss
)
from sklearn.isotonic import IsotonicRegression
import xgboost as xgb

from shortage_features import (
    prepare_shortage_feature_matrix,
    split_chronological,
    get_shortage_feature_columns,
    ShortagePredictorPipeline,
    PROJECT_ROOT,
    MODELS_DIR
)
import config


def calculate_classification_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """
    Calculate comprehensive binary classification metrics for shortage early warning.
    """
    y_true = np.asarray(y_true, dtype=int)
    y_pred = np.asarray(y_pred, dtype=int)
    y_prob = np.asarray(y_prob, dtype=float)

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    specificity = float(tn / max(1, tn + fp))
    fpr = float(fp / max(1, fp + tn))
    fnr = float(fn / max(1, fn + tp))

    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except ValueError:
        roc_auc = 0.5

    try:
        pr_auc = float(average_precision_score(y_true, y_prob))
    except ValueError:
        pr_auc = float(np.mean(y_true))

    brier = float(brier_score_loss(y_true, y_prob))

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "specificity": round(specificity, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "fpr": round(fpr, 4),
        "fnr": round(fnr, 4),
        "confusion_matrix": {
            "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)
        }
    }


def evaluate_rule_based_baseline(df: pd.DataFrame, horizon: str) -> Dict[str, Any]:
    """
    Evaluate rule-based buffer check baseline:
    projected_supply = current_units + incoming - expiring
    If projected_supply < forecast_demand + safety_reserve -> Shortage
    """
    exp_col = f"units_expiring_{horizon[0]}d" if f"units_expiring_{horizon[0]}d" in df.columns else "units_expiring_1d"
    inc_col = f"incoming_units_{horizon}"
    f_col = f"forecast_cumulative_{horizon}" if f"forecast_cumulative_{horizon}" in df.columns else f"forecast_{horizon}"
    target_col = f"shortage_{horizon}"

    projected_supply = df["current_units"] + df[inc_col] - df[exp_col]
    safety_buffer = config.SHORTAGE_SAFETY_RESERVE_DAYS * df["rolling_mean_7"]
    projected_demand = df[f_col] + safety_buffer

    pred = (projected_supply < projected_demand).astype(int)
    # Simple probability proxy based on deficit ratio
    deficit = np.maximum(0.0, projected_demand - projected_supply)
    prob = np.clip(deficit / np.maximum(1.0, projected_demand), 0.0, 1.0)

    y_true = df[target_col].values
    return calculate_classification_metrics(y_true, pred.values, prob.values)


def train_and_evaluate_shortage_models():
    print("=" * 75)
    print("AI BLOOD SUPPLY COMMAND CENTER — SHORTAGE PREDICTION MODEL PIPELINE")
    print("=" * 75)

    # 1. Load Data Matrix
    print("\n[1/6] Loading preprocessed shortage feature matrix...")
    df = prepare_shortage_feature_matrix()
    train_df, val_df, test_df = split_chronological(df)

    print(f"Total dataset records: {len(df):,}")
    print(f"Train : {train_df['date'].min()} to {train_df['date'].max()} ({len(train_df):,} rows)")
    print(f"Val   : {val_df['date'].min()} to {val_df['date'].max()} ({len(val_df):,} rows)")
    print(f"Test  : {test_df['date'].min()} to {test_df['date'].max()} ({len(test_df):,} rows)")

    # 2. Class Imbalance Analysis
    print("\n[2/6] Analyzing multi-horizon class imbalance...")
    imbalance_stats = {}
    for h in ["24h", "48h", "72h"]:
        col = f"shortage_{h}"
        tr_pos = int(train_df[col].sum())
        val_pos = int(val_df[col].sum())
        te_pos = int(test_df[col].sum())
        imbalance_stats[h] = {
            "train": {"total": len(train_df), "shortages": tr_pos, "prevalence_pct": round(tr_pos / len(train_df) * 100, 2)},
            "val": {"total": len(val_df), "shortages": val_pos, "prevalence_pct": round(val_pos / len(val_df) * 100, 2)},
            "test": {"total": len(test_df), "shortages": te_pos, "prevalence_pct": round(te_pos / len(test_df) * 100, 2)}
        }
        print(f"  {h} Horizon Shortage Prevalence:")
        print(f"    Train: {tr_pos:,} / {len(train_df):,} ({imbalance_stats[h]['train']['prevalence_pct']}%)")
        print(f"    Val  : {val_pos:,} / {len(val_df):,} ({imbalance_stats[h]['val']['prevalence_pct']}%)")
        print(f"    Test : {te_pos:,} / {len(test_df):,} ({imbalance_stats[h]['test']['prevalence_pct']}%)")

    # 3. Rule-Based Baselines
    print("\n[3/6] Evaluating rule-based inventory buffer baselines on Test set...")
    baseline_metrics = {}
    for h in ["24h", "48h", "72h"]:
        m = evaluate_rule_based_baseline(test_df, h)
        baseline_metrics[h] = m
        print(f"  Baseline ({h}): Precision={m['precision']:.3f}, Recall={m['recall']:.3f}, F1={m['f1']:.3f}, PR-AUC={m['pr_auc']:.3f}, ROC-AUC={m['roc_auc']:.3f}")

    # 4. Train Multi-Horizon XGBoost Classifiers
    print("\n[4/6] Training XGBoost Classifiers and Calibrating Probabilities...")
    feature_cols = get_shortage_feature_columns()
    categorical_cols = ["hospital_id", "blood_group", "component", "hospital_type", "season"]

    xgb_metrics = {}
    models_dict = {}
    feature_importances = {}

    for h in ["24h", "48h", "72h"]:
        print(f"\n--> Training XGBoost Classifier for {h} Horizon...")
        target_col = f"shortage_{h}"

        # Compute scale_pos_weight
        num_pos = int(train_df[target_col].sum())
        num_neg = len(train_df) - num_pos
        spw = min(12.0, (num_neg / max(1, num_pos)) * 0.75)
        print(f"    Class balance ratio: {num_neg/num_pos:.1f}:1 | scale_pos_weight: {spw:.2f}")

        X_train = train_df[feature_cols].copy()
        y_train = train_df[target_col].values
        X_val = val_df[feature_cols].copy()
        y_val = val_df[target_col].values
        X_test = test_df[feature_cols].copy()
        y_test = test_df[target_col].values

        for c in categorical_cols:
            if c in X_train.columns:
                X_train[c] = X_train[c].astype("category")
                X_val[c] = X_val[c].astype("category")
                X_test[c] = X_test[c].astype("category")

        clf = xgb.XGBClassifier(
            n_estimators=180,
            learning_rate=0.06,
            max_depth=6,
            subsample=0.85,
            colsample_bytree=0.85,
            scale_pos_weight=spw,
            eval_metric=["logloss", "aucpr"],
            tree_method="hist",
            random_state=config.RANDOM_SEED,
            enable_categorical=True
        )
        clf.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )

        # Calibrate probabilities on validation set via isotonic regression
        val_raw_probs = clf.predict_proba(X_val)[:, 1]
        iso_cal = IsotonicRegression(out_of_bounds="clip")
        iso_cal.fit(val_raw_probs, y_val)
        val_cal_probs = iso_cal.predict(val_raw_probs)

        # Find optimal threshold on validation set targeting best F1 with recall >= 0.50
        best_th = 0.20
        best_f1 = 0.0
        for th in np.arange(0.05, 0.70, 0.02):
            val_pred = (val_cal_probs >= th).astype(int)
            rec = recall_score(y_val, val_pred, zero_division=0)
            f1_val = f1_score(y_val, val_pred, zero_division=0)
            if rec >= 0.50 and f1_val > best_f1:
                best_f1 = f1_val
                best_th = round(float(th), 2)

        print(f"    Optimal probability threshold on Validation: {best_th} (Validation F1: {best_f1:.3f})")

        # Evaluate on Test set
        pipeline = ShortagePredictorPipeline(
            horizon=h,
            feature_cols=feature_cols,
            model=clf,
            calibrator=iso_cal,
            optimal_threshold=best_th
        )
        models_dict[h] = pipeline

        # Save pipeline pickle
        model_path = MODELS_DIR / f"shortage_xgb_{h}.pkl"
        with open(model_path, "wb") as f:
            pickle.dump(pipeline, f)
        print(f"    Saved pipeline artifact to {model_path}")

        # Metrics on Test set
        test_probs = pipeline.predict_proba(test_df)
        test_preds = (test_probs >= best_th).astype(int)
        m_test = calculate_classification_metrics(y_test, test_preds, test_probs)
        xgb_metrics[h] = m_test

        print(f"    Test Metrics: Precision={m_test['precision']:.3f}, Recall={m_test['recall']:.3f}, F1={m_test['f1']:.3f}, PR-AUC={m_test['pr_auc']:.3f}, ROC-AUC={m_test['roc_auc']:.3f}")

        # Feature importance
        booster = clf.get_booster()
        score_dict = booster.get_score(importance_type="gain")
        sorted_fi = sorted(score_dict.items(), key=lambda x: x[1], reverse=True)
        feature_importances[h] = [
            {"feature": k, "gain": round(float(v), 2)}
            for k, v in sorted_fi[:20]
        ]

    # 5. Stress Testing Across 9 Operational Scenarios
    print("\n[5/6] Evaluating model robustness across 9 operational scenarios on full dataset...")
    scenario_evaluations = {}
    p24_all = models_dict["24h"].predict_proba(df)
    df_eval = df.copy()
    df_eval["prob_24h"] = p24_all
    df_eval["pred_24h"] = (p24_all >= models_dict["24h"].optimal_threshold).astype(int)

    for sc_id, sc_info in config.EXPLICIT_SCENARIOS.items():
        s_start, s_end = sc_info["date_range"]
        sc_data = df_eval[(df_eval["date"] >= s_start) & (df_eval["date"] <= s_end)]
        if len(sc_data) == 0:
            continue
        y_sc = sc_data["shortage_24h"].values
        pred_sc = sc_data["pred_24h"].values
        prob_sc = sc_data["prob_24h"].values
        m_sc = calculate_classification_metrics(y_sc, pred_sc, prob_sc)
        scenario_evaluations[sc_id] = {
            "name": sc_info["name"],
            "type": sc_info["type"],
            "date_range": sc_info["date_range"],
            "samples": len(sc_data),
            "shortages_count": int(np.sum(y_sc)),
            "shortage_rate_pct": round(float(np.mean(y_sc) * 100), 2),
            "metrics": m_sc
        }

    # 6. Save Feature Schema & Metrics
    print("\n[6/6] Persisting feature schema and metrics...")
    schema_payload = {
        "model_version": "2.0.0",
        "created_at": datetime.now().isoformat(),
        "random_seed": config.RANDOM_SEED,
        "horizons": ["24h", "48h", "72h"],
        "feature_columns": feature_cols,
        "categorical_columns": categorical_cols,
        "risk_thresholds": config.SHORTAGE_RISK_THRESHOLDS,
        "optimal_decision_thresholds": {
            h: models_dict[h].optimal_threshold for h in ["24h", "48h", "72h"]
        },
        "chronological_split": {
            "train_period": [str(train_df['date'].min()), str(train_df['date'].max())],
            "val_period": [str(val_df['date'].min()), str(val_df['date'].max())],
            "test_period": [str(test_df['date'].min()), str(test_df['date'].max())]
        }
    }
    with open(MODELS_DIR / "shortage_feature_schema.json", "w") as f:
        json.dump(schema_payload, f, indent=2)

    full_metrics = {
        "generated_at": datetime.now().isoformat(),
        "random_seed": config.RANDOM_SEED,
        "class_imbalance": imbalance_stats,
        "baseline_models": baseline_metrics,
        "xgboost_models": xgb_metrics,
        "scenario_evaluations": scenario_evaluations,
        "top_features": feature_importances
    }
    with open(MODELS_DIR / "shortage_model_metrics.json", "w") as f:
        json.dump(full_metrics, f, indent=2)

    # Print Final Benchmark Summary
    print("\n" + "=" * 85)
    print("FINAL BENCHMARK COMPARISON TABLE — SHORTAGE EARLY WARNING (TEST SET)")
    print("=" * 85)
    print(f"{'Model / Horizon':<32} {'Precision':<11} {'Recall':<10} {'F1':<8} {'PR-AUC':<10} {'ROC-AUC':<10}")
    print("-" * 85)
    for h in ["24h", "48h", "72h"]:
        bm = baseline_metrics[h]
        print(f"{'Rule-Based Baseline (' + h + ')':<32} {bm['precision']:<11.3f} {bm['recall']:<10.3f} {bm['f1']:<8.3f} {bm['pr_auc']:<10.3f} {bm['roc_auc']:<10.3f}")
    print("-" * 85)
    for h in ["24h", "48h", "72h"]:
        xm = xgb_metrics[h]
        print(f"{'XGBoost Classifier (' + h + ')':<32} {xm['precision']:<11.3f} {xm['recall']:<10.3f} {xm['f1']:<8.3f} {xm['pr_auc']:<10.3f} {xm['roc_auc']:<10.3f}")
    print("=" * 85)


if __name__ == "__main__":
    train_and_evaluate_shortage_models()
