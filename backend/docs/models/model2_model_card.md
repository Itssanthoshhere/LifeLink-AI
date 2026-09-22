# Model Card: Model 2 — Shortage Early Warning Classifier
## Standardized Machine Learning Model Documentation

---

## 1. Model Details
* **Model Name**: LifeLink AI Shortage Early Warning Classifier (`Model 2`)
* **Version**: 1.0.0
* **Model Type**: Calibrated Gradient Boosted Decision Tree Classifier (XGBoost + Platt Scaling)
* **Framework**: `xgboost` 2.0.3, `scikit-learn` CalibratedClassifierCV, Python 3.12
* **Target Output**: Calibrated probability $P(\text{Shortage} \in \{0, 1\})$ and operational risk tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
* **Developer**: LifeLink AI Engineering Team
* **License**: Academic Research Open-Source

---

## 2. Intended Use & Clinical Scope
* **Intended Use**: Operational decision support for hospital inventory managers and regional dispatch coordinators to identify facilities at risk of stockouts over 24h, 48h, and 72h horizons.
* **Out-of-Scope Use**: Must not be used as an autonomous medical diagnostic tool or to deny emergency transfusions.

---

## 3. Training & Evaluation Data
* **Dataset**: 2-year synthetic metropolitan healthcare simulation (`daily_demand.csv`, `inventory_batches.csv`, `events_context.csv`).
* **Scale**: 30 hospitals $\times$ 8 blood groups $\times$ 4 components = 960 time-series evaluated across 730 days.
* **Class Balance**: Highly imbalanced ($< 5\%$ positive stockout instances).
* **Split Protocol**: Chronological temporal split (Train: 80%, Validation: 10%, Out-of-time Test: 10%).

---

## 4. Input Features (82 Features)
* **Inventory State**: Current units available, days of inventory remaining, expiring units ($< 24$h, $< 48$h, $< 72$h).
* **Model 1 Ingestion**: Ingested forecasted demand units ($\hat{D}_{24}, \hat{D}_{48}, \hat{D}_{72}$).
* **Regional Network Supply**: Total compatible units available at regional blood banks within 30 km.
* **Contextual Features**: Trauma emergency flags, seasonal disease indicators, calendar seasonality.

---

## 5. Performance Metrics (Out-of-Time Test Set)
* **24-Hour Horizon**: ROC-AUC = 0.849 | PR-AUC = 0.192 | Recall = 0.542 | Brier Score = 0.0356
* **48-Hour Horizon**: ROC-AUC = 0.855 | PR-AUC = 0.292 | Recall = 0.602 | Brier Score = 0.0582
* **72-Hour Horizon**: ROC-AUC = 0.862 | PR-AUC = 0.374 | Recall = 0.649 | Brier Score = 0.0745

---

## 6. Ethical & Operational Safeguards
* **Zero Data Leakage**: Audited strictly against temporal data leakage; features at date $t$ never ingest inventory or demand at $t+1$.
* **Probability Calibration**: Uses Platt scaling to guarantee that risk scores correspond to empirical historical frequencies.
