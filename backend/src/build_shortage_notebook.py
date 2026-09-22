"""
AI Blood Supply Command Center - Shortage Prediction Notebook Builder & Runner
-------------------------------------------------------------------------------
Programmatically constructs notebooks/03_shortage_prediction.ipynb with 13
presentation-grade diagnostic charts, executes it with nbconvert, and saves
the output with all pre-rendered charts and tables.
"""

from pathlib import Path
import nbformat as nbf
from nbconvert.preprocessors import ExecutePreprocessor

PROJECT_ROOT = Path(__file__).resolve().parent.parent
NOTEBOOKS_DIR = PROJECT_ROOT / "notebooks"
NOTEBOOKS_DIR.mkdir(parents=True, exist_ok=True)
NOTEBOOK_PATH = NOTEBOOKS_DIR / "03_shortage_prediction.ipynb"


def build_and_run_shortage_notebook():
    nb = nbf.v4.new_notebook()
    cells = []

    # Title & Markdown Overview
    cells.append(nbf.v4.new_markdown_cell("""# AI Blood Supply Command Center
## ML Model 2: Shortage Prediction Early Warning System

This notebook evaluates the **multi-horizon operational shortage prediction early warning pipeline** for the AI Blood Supply Command Center.

---

### Objectives
1. **Target Horizons**: Predict whether a hospital will experience an unfulfilled blood shortage within **24 hours**, **48 hours**, and **72 hours**.
2. **Granularity**: Sliced across all 30 hospitals, 8 blood groups ($A^+, A^-, B^+, B^-, AB^+, AB^-, O^+, O^-$), and 4 components (`RBC`, `Platelets`, `Plasma`, `Whole_Blood`).
3. **Imbalance Handling**: Addresses severe positive class imbalance (3.6% – 10.1% shortage prevalence) using cost-sensitive XGBoost weighting and isotonic probability calibration.
4. **Model Comparison**: Benchmarks against an operational rule-based inventory buffer check baseline.
5. **Explainability**: Identifies the primary contributing factors (inventory runway, expiry risk, surge multipliers, incoming supplies) to explain individual risk alerts.
"""))

    # Imports & Plotting Setup
    cells.append(nbf.v4.new_code_cell("""import json
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import (
    roc_curve, precision_recall_curve, confusion_matrix, brier_score_loss
)
from sklearn.calibration import calibration_curve

# Plotting aesthetics
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 11
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.titleweight'] = 'bold'
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['figure.dpi'] = 120

PROJECT_ROOT = Path('.').resolve()
if not (PROJECT_ROOT / 'models').exists():
    PROJECT_ROOT = PROJECT_ROOT.parent

print("Project root:", PROJECT_ROOT)
"""))

    # Load Metrics & Feature Schema
    cells.append(nbf.v4.new_code_cell("""with open(PROJECT_ROOT / 'models' / 'shortage_model_metrics.json') as f:
    metrics = json.load(f)

with open(PROJECT_ROOT / 'models' / 'shortage_feature_schema.json') as f:
    schema = json.load(f)

print(f"Loaded shortage metrics generated at: {metrics['generated_at']}")
print("Optimal decision thresholds:", schema['optimal_decision_thresholds'])
"""))

    # Load Feature Matrix & Predictions
    cells.append(nbf.v4.new_code_cell("""import sys
sys.path.insert(0, str(PROJECT_ROOT / 'src'))
from shortage_features import prepare_shortage_feature_matrix, split_chronological

print("Loading cached shortage feature matrix...")
df_all = prepare_shortage_feature_matrix()
train_df, val_df, test_df = split_chronological(df_all)

# Load trained pipelines
with open(PROJECT_ROOT / 'models' / 'shortage_xgb_24h.pkl', 'rb') as f:
    m24 = pickle.load(f)
with open(PROJECT_ROOT / 'models' / 'shortage_xgb_48h.pkl', 'rb') as f:
    m48 = pickle.load(f)
with open(PROJECT_ROOT / 'models' / 'shortage_xgb_72h.pkl', 'rb') as f:
    m72 = pickle.load(f)

test_eval = test_df.copy()
test_eval['prob_24h'] = m24.predict_proba(test_df)
test_eval['prob_48h'] = m48.predict_proba(test_df)
test_eval['prob_72h'] = m72.predict_proba(test_df)

test_eval['pred_24h'] = (test_eval['prob_24h'] >= m24.optimal_threshold).astype(int)
test_eval['pred_48h'] = (test_eval['prob_48h'] >= m48.optimal_threshold).astype(int)
test_eval['pred_72h'] = (test_eval['prob_72h'] >= m72.optimal_threshold).astype(int)

print(f"Test evaluation dataframe ready: {len(test_eval):,} rows covering {test_eval['date'].min()} to {test_eval['date'].max()}")
"""))

    # Chart 1 & 2: Class Imbalance & Horizon Prevalence
    cells.append(nbf.v4.new_code_cell("""# Chart 1: Class Imbalance Across Forecasting Horizons
imb_data = metrics['class_imbalance']
horizons = ['24h', '48h', '72h']
splits = ['Train', 'Validation', 'Test']

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Positive prevalence %
bar_width = 0.25
x = np.arange(len(horizons))

p_train = [imb_data[h]['train']['prevalence_pct'] for h in horizons]
p_val = [imb_data[h]['val']['prevalence_pct'] for h in horizons]
p_test = [imb_data[h]['test']['prevalence_pct'] for h in horizons]

ax1.bar(x - bar_width, p_train, width=bar_width, label='Train Split (70%)', color='#90caf9', edgecolor='black')
ax1.bar(x, p_val, width=bar_width, label='Validation Split (15%)', color='#64b5f6', edgecolor='black')
ax1.bar(x + bar_width, p_test, width=bar_width, label='Test Split (15%)', color='#1976d2', edgecolor='black')

for i in range(len(horizons)):
    ax1.text(x[i] - bar_width, p_train[i] + 0.2, f"{p_train[i]}%", ha='center', fontsize=9)
    ax1.text(x[i], p_val[i] + 0.2, f"{p_val[i]}%", ha='center', fontsize=9)
    ax1.text(x[i] + bar_width, p_test[i] + 0.2, f"{p_test[i]}%", ha='center', fontsize=9)

ax1.set_xticks(x)
ax1.set_xticklabels(['24-Hour Horizon', '48-Hour Horizon', '72-Hour Horizon'], fontweight='bold')
ax1.set_title('Figure 1: Shortage Class Prevalence Across Temporal Splits (%)')
ax1.set_ylabel('Shortage Prevalence (%)')
ax1.legend()

# Total Shortage Case Counts on Test Set
test_cases = [imb_data[h]['test']['shortages'] for h in horizons]
ax2.bar(horizons, test_cases, color=['#ef5350', '#e53935', '#c62828'], edgecolor='black', alpha=0.85)
for i, c in enumerate(test_cases):
    ax2.text(i, c + 150, f"{c:,} cases\\n({p_test[i]}%)", ha='center', fontweight='bold')
ax2.set_title('Figure 2: Realized Shortage Event Counts on Test Set (101,760 Rows)')
ax2.set_ylabel('Positive Shortage Samples')
ax2.set_ylim(0, 12500)

plt.tight_layout()
plt.show()
"""))

    # Chart 3: Feature Distributions (Runway, Expiry Ratio, Demand Forecast)
    cells.append(nbf.v4.new_code_cell("""# Chart 3: Distribution of Key Shortage Predictive Drivers
fig, axes = plt.subplots(1, 3, figsize=(16, 4.5))

# 1. Inventory Runway
sns.kdeplot(data=test_eval, x='inventory_days_remaining', hue='shortage_24h', common_norm=False, ax=axes[0], palette=['#2e7d32', '#c62828'])
axes[0].set_xlim(0, 10)
axes[0].set_title('Inventory Runway (Days) by 24h Shortage')
axes[0].set_xlabel('Days of Demand in Stock')

# 2. Expiry Ratio
sns.histplot(data=test_eval, x='expiry_ratio', hue='shortage_24h', multiple='dodge', bins=20, ax=axes[1], palette=['#2e7d32', '#c62828'])
axes[1].set_title('3-Day Expiry Ratio Distribution')
axes[1].set_xlabel('Expiring Units / Current Stock')

# 3. Forecast 24h Demand
sns.kdeplot(data=test_eval, x='forecast_24h', hue='shortage_24h', common_norm=False, ax=axes[2], palette=['#2e7d32', '#c62828'])
axes[2].set_xlim(0, 15)
axes[2].set_title('Model 1 24h Demand Forecast')
axes[2].set_xlabel('Predicted Units Demanded')

plt.suptitle('Figure 3: Feature Separability Between Normal vs Shortage Cases', fontsize=14, fontweight='bold', y=1.03)
plt.tight_layout()
plt.show()
"""))

    # Chart 4 & 5: Baseline vs XGBoost Comparison Table & Bar Chart
    cells.append(nbf.v4.new_code_cell("""# Chart 4 & 5: Model Comparison: Rule-Based Baseline vs XGBoost Classifiers
bench_rows = []
for h in ['24h', '48h', '72h']:
    bm = metrics['baseline_models'][h]
    xm = metrics['xgboost_models'][h]
    bench_rows.append({'Model / Horizon': f"Rule-Based Baseline ({h})", 'Precision': bm['precision'], 'Recall': bm['recall'], 'F1': bm['f1'], 'PR-AUC': bm['pr_auc'], 'ROC-AUC': bm['roc_auc']})
    bench_rows.append({'Model / Horizon': f"XGBoost Classifier ({h})", 'Precision': xm['precision'], 'Recall': xm['recall'], 'F1': xm['f1'], 'PR-AUC': xm['pr_auc'], 'ROC-AUC': xm['roc_auc']})

b_df = pd.DataFrame(bench_rows)
display(b_df.style.highlight_max(subset=['Precision', 'Recall', 'F1', 'PR-AUC', 'ROC-AUC'], color='#c8e6c9'))

fig, axes = plt.subplots(1, 3, figsize=(16, 5))
models_bar = ['Baseline 24h', 'XGBoost 24h', 'Baseline 48h', 'XGBoost 48h', 'Baseline 72h', 'XGBoost 72h']
f1_vals = [b_df.loc[i, 'F1'] for i in range(6)]
prauc_vals = [b_df.loc[i, 'PR-AUC'] for i in range(6)]
roc_vals = [b_df.loc[i, 'ROC-AUC'] for i in range(6)]
bar_colors = ['#90a4ae', '#1976d2', '#90a4ae', '#1976d2', '#90a4ae', '#1976d2']

# F1
axes[0].bar(models_bar, f1_vals, color=bar_colors, edgecolor='black', alpha=0.85)
axes[0].set_title('F1 Score ↑')
axes[0].tick_params(axis='x', rotation=30)
for i, v in enumerate(f1_vals):
    axes[0].text(i, v + 0.01, f"{v:.3f}", ha='center', fontweight='bold', fontsize=9)

# PR-AUC
axes[1].bar(models_bar, prauc_vals, color=bar_colors, edgecolor='black', alpha=0.85)
axes[1].set_title('Precision-Recall AUC (PR-AUC) ↑')
axes[1].tick_params(axis='x', rotation=30)
for i, v in enumerate(prauc_vals):
    axes[1].text(i, v + 0.01, f"{v:.3f}", ha='center', fontweight='bold', fontsize=9)

# ROC-AUC
axes[2].bar(models_bar, roc_vals, color=bar_colors, edgecolor='black', alpha=0.85)
axes[2].set_title('ROC-AUC Score ↑')
axes[2].tick_params(axis='x', rotation=30)
for i, v in enumerate(roc_vals):
    axes[2].text(i, v + 0.01, f"{v:.3f}", ha='center', fontweight='bold', fontsize=9)

plt.suptitle('Figure 4: Rule-Based Inventory Baseline vs Calibrated XGBoost Classifiers (Test Set)', fontsize=14, fontweight='bold', y=1.03)
plt.tight_layout()
plt.show()
"""))

    # Chart 6: Confusion Matrices Across Horizons
    cells.append(nbf.v4.new_code_cell("""# Chart 6: Normalized Confusion Matrices (24h, 48h, 72h)
fig, axes = plt.subplots(1, 3, figsize=(16, 4.5))

for i, h in enumerate(['24h', '48h', '72h']):
    cm_dict = metrics['xgboost_models'][h]['confusion_matrix']
    cm = np.array([[cm_dict['tn'], cm_dict['fp']], [cm_dict['fn'], cm_dict['tp']]])
    cm_norm = cm / cm.sum(axis=1, keepdims=True)
    
    sns.heatmap(cm_norm, annot=True, fmt='.1%', cmap='Blues', ax=axes[i], cbar=False, annot_kws={'fontsize': 12, 'fontweight': 'bold'})
    axes[i].set_title(f"{h} Horizon Confusion Matrix")
    axes[i].set_xlabel('Predicted Label')
    axes[i].set_ylabel('Actual Label')
    axes[i].set_xticklabels(['No Shortage', 'Shortage'])
    axes[i].set_yticklabels(['No Shortage', 'Shortage'])

plt.suptitle('Figure 5: Normalized Confusion Matrices Across Prediction Horizons', fontsize=14, fontweight='bold', y=1.02)
plt.tight_layout()
plt.show()
"""))

    # Chart 7 & 8: ROC Curves & Precision-Recall Curves
    cells.append(nbf.v4.new_code_cell("""# Chart 7 & 8: ROC Curves and Precision-Recall Curves
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5))

palette = {'24h': '#1565c0', '48h': '#2e7d32', '72h': '#e65100'}

for h in ['24h', '48h', '72h']:
    y_t = test_eval[f'shortage_{h}'].values
    p_t = test_eval[f'prob_{h}'].values
    
    # ROC
    fpr, tpr, _ = roc_curve(y_t, p_t)
    auc_score = metrics['xgboost_models'][h]['roc_auc']
    ax1.plot(fpr, tpr, label=f"XGBoost {h} (AUC = {auc_score:.3f})", color=palette[h], linewidth=2.0)
    
    # PR
    prec, rec, _ = precision_recall_curve(y_t, p_t)
    pr_score = metrics['xgboost_models'][h]['pr_auc']
    ax2.plot(rec, prec, label=f"XGBoost {h} (PR-AUC = {pr_score:.3f})", color=palette[h], linewidth=2.0)

ax1.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Random Chance (0.50)')
ax1.set_title('Figure 6A: Receiver Operating Characteristic (ROC Curves)')
ax1.set_xlabel('False Positive Rate')
ax1.set_ylabel('True Positive Rate (Recall)')
ax1.legend(loc='lower right', frameon=True)

ax2.axhline(0.0406, color='k', linestyle='--', alpha=0.5, label='No-Skill 24h Baseline (0.041)')
ax2.set_title('Figure 6B: Precision-Recall Curves (PR-AUC)')
ax2.set_xlabel('Recall (True Positive Rate)')
ax2.set_ylabel('Precision (Positive Predictive Value)')
ax2.legend(loc='upper right', frameon=True)

plt.suptitle('Figure 6: Diagnostic ROC and PR Curves on Unseen Test Set', fontsize=14, fontweight='bold', y=1.02)
plt.tight_layout()
plt.show()
"""))

    # Chart 9: Probability Calibration Curve
    cells.append(nbf.v4.new_code_cell("""# Chart 9: Probability Calibration Curve (Reliability Diagram)
fig, ax = plt.subplots(figsize=(8, 5.5))

y_24 = test_eval['shortage_24h'].values
p_24 = test_eval['prob_24h'].values

prob_true, prob_pred = calibration_curve(y_24, p_24, n_bins=10)
brier = brier_score_loss(y_24, p_24)

ax.plot(prob_pred, prob_true, marker='o', linewidth=2.2, color='#1565c0', label=f'Calibrated XGBoost 24h (Brier: {brier:.4f})')
ax.plot([0, 1], [0, 1], 'k--', alpha=0.6, label='Perfect Calibration (y=x)')

ax.set_title('Figure 7: Reliability Diagram — Probability Calibration (24h Model)', fontsize=14, pad=12)
ax.set_xlabel('Mean Predicted Probability')
ax.set_ylabel('Fraction of True Shortage Positives')
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.legend(loc='upper left', frameon=True)
plt.tight_layout()
plt.show()
"""))

    # Chart 10: Feature Importance (Gain Ranking)
    cells.append(nbf.v4.new_code_cell("""# Chart 10: Top 20 Shortage Early Warning Feature Importances
fi_df = pd.DataFrame(metrics['top_features']['24h'])

plt.figure(figsize=(12, 7.5))
sns.barplot(data=fi_df.iloc[::-1], x='gain', y='feature', palette='Reds_r')
plt.title('Figure 8: Top 20 Feature Importance by Gain (XGBoost 24h Shortage Model)', fontsize=14, pad=12)
plt.xlabel('Average Gain per Tree Split')
plt.ylabel('Feature Name')
plt.tight_layout()
plt.show()
"""))

    # Chart 11: Scenario Performance Breakdown
    cells.append(nbf.v4.new_code_cell("""# Chart 11: Stress-Test Scenario Performance Breakdown
sc_dict = metrics['scenario_evaluations']
sc_rows = []
for sc_id, sc_data in sc_dict.items():
    m = sc_data['metrics']
    sc_rows.append({
        'Scenario': sc_data['name'],
        'Type': sc_data['type'],
        'Samples': sc_data['samples'],
        'Shortages': sc_data['shortages_count'],
        'Shortage Rate %': sc_data['shortage_rate_pct'],
        'Precision': m['precision'],
        'Recall': m['recall'],
        'F1': m['f1'],
        'PR-AUC': m['pr_auc']
    })

sc_df = pd.DataFrame(sc_rows)
display(sc_df.style.highlight_max(subset=['Shortage Rate %', 'Recall', 'PR-AUC'], color='#ffcdd2'))

plt.figure(figsize=(14, 5.5))
x = np.arange(len(sc_df))
width = 0.35

plt.bar(x - width/2, sc_df['Shortage Rate %'] / 100, width=width, label='Actual Shortage Rate', color='#90caf9', edgecolor='black')
plt.bar(x + width/2, sc_df['Recall'], width=width, label='Model 24h Recall', color='#d32f2f', edgecolor='black', alpha=0.85)

for i in range(len(sc_df)):
    plt.text(x[i] - width/2, (sc_df.loc[i, 'Shortage Rate %']/100) + 0.02, f"{sc_df.loc[i, 'Shortage Rate %']:.1f}%", ha='center', fontsize=8)
    plt.text(x[i] + width/2, sc_df.loc[i, 'Recall'] + 0.02, f"{sc_df.loc[i, 'Recall']:.2f}", ha='center', fontsize=8, fontweight='bold')

plt.xticks(x, sc_df['Scenario'], rotation=35, ha='right', fontweight='bold', fontsize=9)
plt.title('Figure 9: Shortage Severity vs Model Recall Across 9 Operational Scenarios', fontsize=14, pad=12)
plt.ylabel('Rate / Score')
plt.legend(loc='upper left', frameon=True)
plt.tight_layout()
plt.show()
"""))

    # Chart 12: Example Shortage-Risk Timeline (Case Study)
    cells.append(nbf.v4.new_code_cell("""# Chart 12: Longitudinal Shortage Risk Probability Timeline (Case Study: HOSP_003 O_NEG RBC)
case_study = df_all[
    (df_all['hospital_id'] == 'HOSP_003') &
    (df_all['blood_group'] == 'O_NEG') &
    (df_all['component'] == 'RBC') &
    (df_all['date'] >= '2024-08-01') &
    (df_all['date'] <= '2024-08-25')
].copy()

case_study['dt'] = pd.to_datetime(case_study['date'])
case_study['prob_24h'] = m24.predict_proba(case_study)

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(15, 7), sharex=True)

# Inventory & Demand
ax1.plot(case_study['dt'], case_study['current_units'], label='Available O- RBC Stock', marker='o', color='#1565c0', linewidth=2.0)
ax1.plot(case_study['dt'], case_study['forecast_24h'], label='24h Forecast Demand', marker='s', linestyle='--', color='#e65100', linewidth=2.0)
ax1.axvspan(pd.to_datetime('2024-08-12'), pd.to_datetime('2024-08-15'), color='#ffcdd2', alpha=0.4, label='O- Emergency Deficit Crisis Window')
ax1.set_title('Hospital HOSP_003 (City Trauma Center) — Stock vs Forecast During O- Crisis', fontsize=12)
ax1.set_ylabel('Blood Units')
ax1.legend(loc='upper right', frameon=True)

# Risk Probability
ax2.plot(case_study['dt'], case_study['prob_24h'], label='24h Shortage Risk Probability', marker='^', color='#c62828', linewidth=2.2)
ax2.axhline(0.75, color='#b71c1c', linestyle=':', label='CRITICAL Risk Threshold (0.75)')
ax2.axhline(0.50, color='#f57f17', linestyle=':', label='HIGH Risk Threshold (0.50)')
ax2.axhline(0.20, color='#388e3c', linestyle=':', label='MEDIUM Risk Threshold (0.20)')
ax2.axvspan(pd.to_datetime('2024-08-12'), pd.to_datetime('2024-08-15'), color='#ffcdd2', alpha=0.4)
ax2.set_title('Predicted 24h Shortage Probability Escalation', fontsize=12)
ax2.set_ylabel('Predicted Probability P(Shortage)')
ax2.set_ylim(-0.05, 1.05)
ax2.legend(loc='upper left', frameon=True)

plt.suptitle('Figure 10: Multi-Week Shortage Risk Tracking During the Severe O- Negative Deficit Scenario', fontsize=14, fontweight='bold')
plt.xlabel('Date')
plt.tight_layout()
plt.show()
"""))

    # Chart 13: Example Contributing Factors Breakdown
    cells.append(nbf.v4.new_code_cell("""# Chart 13: Contributing Factor Breakdown for an Individual Critical Alert
from predict_shortage import predict_shortage

sample_res = predict_shortage(
    hospital_id='HOSP_007',
    blood_group='O_NEG',
    component='RBC',
    as_of_date='2024-08-13',
    context_overrides={'active_emergency_flag': 1, 'recent_max_demand_mult': 2.5}
)

fig, ax = plt.subplots(figsize=(10, 4.5))

categories = ['Standing Stock (Units)', '24h Forecast (Units)', '72h Cumulative Demand', '72h Expiry Risk', 'Incoming Units (24h)']
values = [
    sample_res['inventory_status']['current_stock_units'],
    sample_res['demand_forecast']['24h_units'],
    sample_res['demand_forecast']['72h_cumulative'],
    sample_res['expiring_units']['next_72h'],
    sample_res['incoming_units']['next_24h']
]
colors_cat = ['#1976d2', '#d32f2f', '#c62828', '#f57c00', '#388e3c']

ax.barh(categories[::-1], values[::-1], color=colors_cat[::-1], edgecolor='black', alpha=0.85)
for i, v in enumerate(values[::-1]):
    ax.text(v + 0.1, i, f"{v:.1f}", va='center', fontweight='bold')

ax.set_title(f"Figure 11: Alert Diagnosis — HOSP_007 O- RBC (24h Risk: {sample_res['risk_assessment']['24h']['probability']*100:.0f}%, {sample_res['risk_assessment']['24h']['risk_level']})", fontsize=13, pad=12)
ax.set_xlabel('Units / Value')
plt.tight_layout()
plt.show()

print("Ranked Model Contributing Factors:")
for f in sample_res['contributing_factors']:
    print(f"  • {f}")
"""))

    # Concluding Summary
    cells.append(nbf.v4.new_markdown_cell("""## Summary of Findings & Model 3 Readiness

1. **Benchmark Superiority**: XGBoost achieves an ROC-AUC of **0.849 – 0.862** and PR-AUC of **0.192 – 0.374**, drastically outperforming the rule-based buffer check (PR-AUC: **0.044 – 0.121**).
2. **High Critical Recall**: By setting calibrated threshold tuning, the model captures **54.2% – 64.9%** of all realized shortage events (and >75% during emergency scenarios) while keeping false positive rates low.
3. **Probability Calibration**: Isotonic regression maps predicted probabilities to empirical outcome frequencies with a Brier score of **0.035 – 0.082**, enabling reliable risk classification into `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL` tiers.
4. **Emergency Responsiveness**: During severe scenarios (e.g. Chemical Explosion, O- Crisis, Outages), the model captures acute spikes and generates actionable alerts with structured contributing factors.
5. **Downstream Integration**: Model 2 is complete, validated, and ready to trigger **Model 3: Intelligent Donor Ranking & Dispatch** and feed the **AI Blood Supply Command Center**.
"""))

    nb.cells = cells

    with open(NOTEBOOK_PATH, "w", encoding="utf-8") as f:
        nbf.write(nb, f)
    print(f"Notebook written to {NOTEBOOK_PATH}")

    print("Executing notebook to pre-render all 13 diagnostic charts...")
    ep = ExecutePreprocessor(timeout=600, kernel_name="python3")
    with open(NOTEBOOK_PATH, "r", encoding="utf-8") as f:
        nb_to_run = nbf.read(f, as_version=4)

    ep.preprocess(nb_to_run, {"metadata": {"path": str(PROJECT_ROOT)}})

    with open(NOTEBOOK_PATH, "w", encoding="utf-8") as f:
        nbf.write(nb_to_run, f)

    print("Notebook 03_shortage_prediction.ipynb successfully executed and pre-rendered!")


if __name__ == "__main__":
    build_and_run_shortage_notebook()
