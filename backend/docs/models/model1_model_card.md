# Model Card: Model 1 — Multi-Horizon Demand Forecaster
## Standardized Machine Learning Model Documentation

---

## 1. Model Details
* **Model Name**: LifeLink AI Demand Forecaster (`Model 1`)
* **Version**: 1.0.0
* **Model Type**: Supervised Gradient Boosted Decision Tree Regressor (XGBoost)
* **Framework**: `xgboost` 2.0.3, Python 3.12, scikit-learn
* **Target Output**: Continuous non-negative blood units demanded over $t+1$ (24h), $t+2$ (48h), and $t+3$ (72h)
* **Developer**: LifeLink AI Engineering Team
* **License**: Academic Research Open-Source

---

## 2. Intended Use & Clinical Scope
* **Intended Use**: Operational decision support for hospital blood bank inventory managers and regional logistics coordinators to anticipate product-specific demand volume.
* **Out-of-Scope Use**: Must **not** be used for autonomous clinical ordering, blood product dosing, or modifying individual patient care plans.

---

## 3. Training & Evaluation Data
* **Dataset**: 2-year synthetic metropolitan healthcare simulation (`daily_demand.csv`, `events_context.csv`, `emergency_events.csv`).
* **Scale**: 30 hospitals $\times$ 8 blood groups $\times$ 4 components = 960 distinct time series evaluated daily across 730 days (700,800 total observation points).
* **Split Protocol**: Chronological temporal split (Train: 80%, Validation: 10%, Out-of-time Test: 10%).

---

## 4. Feature Architecture (75 Features)
* **Lags**: $t-1, t-2, t-3, t-7, t-14, t-28$ daily demand.
* **Rolling Statistics**: 7-day and 14-day rolling mean, standard deviation, min, max.
* **Calendar Seasonality**: Day of week, month, day of month, weekend flag.
* **Categorical Embeddings**: Hospital ID, Blood Group, Component Type.
* **Context**: Emergency trauma incidents, regional temperature anomalies, weather alert flags.

---

## 5. Performance Metrics (Out-of-Time Test Set)
* **24-Hour Horizon**: MAE = 1.209 units | RMSE = 2.417 units | $R^2$ = 0.459 | Safe MAPE = 65.6%
* **48-Hour Horizon**: MAE = 1.211 units | RMSE = 2.415 units | $R^2$ = 0.460 | Safe MAPE = 65.6%
* **72-Hour Horizon**: MAE = 1.206 units | RMSE = 2.399 units | $R^2$ = 0.464 | Safe MAPE = 65.4%

---

## 6. Ethical & Operational Safeguards
* **Synthetic Data**: Trained exclusively on simulated data; zero human personal health information (PHI) utilized.
* **Physical Plausibility**: Enforces non-negative bounding ($\max(0, \hat{y})$) to prevent impossible negative consumption projections.
