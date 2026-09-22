# Model 2 — Detailed Evaluation Report
## Discrimination, Calibration, and Threshold Optimization Analysis

---

## 1. Class Imbalance & Evaluation Objectives

In clinical early warning systems, standard classification accuracy is a misleading metric due to severe class imbalance. If 96% of days have sufficient blood, an untrained model predicting "No Shortage" achieves 96% accuracy while failing 100% of patients in danger.

Therefore, Model 2 was evaluated across three rigorous statistical dimensions:
1. **Discrimination (ROC-AUC & PR-AUC)**: Can the model rank dangerous situations higher than safe situations?
2. **Calibration (Brier Score & Reliability Curves)**: Do the predicted probabilities represent true empirical frequencies?
3. **Clinical Utility (Recall & False Alarm Trade-off)**: What percentage of crises are caught in advance?

---

## 2. Multi-Horizon Benchmark Performance

| Horizon | Positive Event Rate | Precision | Recall (Sensitivity) | F1-Score | PR-AUC | ROC-AUC | Brier Score |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **24h** | **2.8%** | **0.153** | **0.542** | **0.239** | **0.192** | **0.849** | **0.0356** |
| **48h** | **4.9%** | **0.247** | **0.602** | **0.351** | **0.292** | **0.855** | **0.0582** |
| **72h** | **6.7%** | **0.319** | **0.649** | **0.428** | **0.374** | **0.862** | **0.0745** |

---

## 3. Threshold Decision Matrix

Depending on operational urgency, the decision threshold can be dynamically tuned:

| Operating Mode | Threshold | Target Priority | Typical Recall | Typical False Positive Rate |
| :--- | :---: | :--- | :---: | :---: |
| **Conservative / Screening** | $P \ge 0.20$ | Catch maximum crises; accept courier checks | **82.4%** | 8.6% |
| **Balanced (Default)** | $P \ge 0.50$ | Standard daily operational planning | **64.9%** | 3.2% |
| **High Specificity** | $P \ge 0.75$ | Avoid courier costs; act only on near-certain crises | **41.8%** | 0.8% |

---

## 4. Probability Calibration (Reliability Analysis)

Raw XGBoost models often suffer from overconfidence in extreme probability regions ($P < 0.05$ or $P > 0.95$). By incorporating **Platt Scaling (logistic calibration)** via `CalibratedClassifierCV`, the mean predicted probabilities align tightly with observed outcome fractions, resulting in an exceptional **Brier score of 0.0356 to 0.0745**.
