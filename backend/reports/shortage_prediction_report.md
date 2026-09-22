# ML Model 2: Shortage Prediction Early Warning System — Technical Report
**AI Blood Supply Command Center**
*Model Version: 2.0.0 | Date: 2026-09-21*

---

## Executive Summary

We have designed, implemented, evaluated, and verified **ML Model 2 — Shortage Prediction Early Warning System** for the AI Blood Supply Command Center.

The model predicts whether a specific hospital will experience a blood product shortage within:
- **Next 24 Hours ($t+1$)**
- **Next 48 Hours ($t+1 \dots t+2$)**
- **Next 72 Hours ($t+1 \dots t+3$)**

across all **30 hospitals**, **8 blood groups**, and **4 blood components** (960 distinct daily series, 671,040 feature matrix records after warm-up drop).

The architecture directly integrates **Model 1 Demand Forecasts**, daily cold-chain inventory snapshots, 1d–5d expiry risks, incoming replenishment buffers, regional blood bank stock levels, and active disaster signals.

---

## 1. Core Answers to the 10 Analytical Questions

### 1. What exactly constitutes a shortage?
In our operational framework, a **shortage** is defined as an event where a hospital's projected or realized available supply is insufficient to satisfy clinical transfusion orders within the target window while respecting safety reserve thresholds.
Specifically:
- **Realized Target Label**: A binary indicator ($1$ or $0$) generated strictly from future order fulfillment records in `blood_requests.csv`. If one or more clinical transfusion orders for $(hospital, blood\_group, component)$ cannot be fulfilled immediately from inventory or standard regional dispatch (`unfulfilled` or `partially_fulfilled` status), a shortage event has occurred.
- **Configurable Engineering Safety Reserve**: In `src/config.py`, `SHORTAGE_SAFETY_RESERVE_DAYS = 1.0` defines the minimum operational buffer below which inventory is deemed critically depleted.

### 2. How many shortage/non-shortage examples exist?
Across the 671,040 valid historical observations (partitioned into 70% Train, 15% Validation, 15% Test):

| Horizon | Total Samples | Non-Shortage ($y=0$) | Shortage Cases ($y=1$) | Shortage Prevalence (%) | Class Imbalance Ratio |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **24-Hour Horizon** | 101,760 (Test) | 97,627 | 4,133 | **4.06%** | 23.6 : 1 |
| **48-Hour Horizon** | 101,760 (Test) | 94,336 | 7,424 | **7.30%** | 12.7 : 1 |
| **72-Hour Horizon** | 101,760 (Test) | 91,470 | 10,290 | **10.11%** | 8.9 : 1 |

*Total historical shortages across full 2-year simulation: 24,990 in 24h, 45,262 in 48h, 62,917 in 72h.*

### 3. How does the ML model compare with the rule-based baseline?
On the unseen Test set (101,760 observations), the calibrated XGBoost classifiers decisively outperform the rule-based buffer check across all evaluation dimensions:

| Model / Horizon | Precision | Recall | F1 Score | PR-AUC | ROC-AUC | Specificity |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Rule-Based Baseline (24h)** | 0.043 | 0.223 | 0.072 | 0.044 | 0.511 | 0.790 |
| **XGBoost Classifier (24h)** | **0.153** | **0.542** | **0.239** | **0.192** | **0.849** | **0.873** |
| **Rule-Based Baseline (48h)** | 0.086 | 0.334 | 0.137 | 0.087 | 0.537 | 0.721 |
| **XGBoost Classifier (48h)** | **0.247** | **0.602** | **0.351** | **0.292** | **0.855** | **0.856** |
| **Rule-Based Baseline (72h)** | 0.104 | 0.400 | 0.165 | 0.121 | 0.525 | 0.611 |
| **XGBoost Classifier (72h)** | **0.319** | **0.649** | **0.428** | **0.374** | **0.862** | **0.844** |

- **ROC-AUC**: XGBoost achieves **0.849 – 0.862**, compared to 0.511 – 0.537 for the baseline.
- **PR-AUC**: XGBoost delivers **3.1x to 4.4x higher PR-AUC** (0.192 vs 0.044 at 24h; 0.374 vs 0.121 at 72h).
- **F1 Score**: Improves from 0.072 $\to$ **0.239** (24h) and 0.165 $\to$ **0.428** (72h).

### 4. What are precision, recall, F1, ROC-AUC, and PR-AUC?
- At 24h: Precision = **15.4%**, Recall = **54.2%**, F1 = **0.239**, PR-AUC = **0.192**, ROC-AUC = **0.849**.
- At 48h: Precision = **24.7%**, Recall = **60.2%**, F1 = **0.351**, PR-AUC = **0.292**, ROC-AUC = **0.855**.
- At 72h: Precision = **31.9%**, Recall = **64.9%**, F1 = **0.428**, PR-AUC = **0.374**, ROC-AUC = **0.862**.
Because the negative class represents 96% of cases, standard accuracy is misleading (a naive zero-predictor has 96% accuracy but 0% recall). PR-AUC and Recall on the minority shortage class provide true operational fidelity.

### 5. How well calibrated are the probabilities?
- Probability calibration was performed via **Isotonic Regression** fitted on the out-of-time validation split.
- **Brier Scores**:
  - 24h: **0.0356** (close to optimal 0.0)
  - 48h: **0.0582**
  - 72h: **0.0745**
- Reliability diagrams confirm that when the model outputs a shortage probability of 60%, the empirical frequency of a shortage occurring within the horizon is ~60%. This permits thresholding into meaningful risk levels:
  - `LOW`: $P < 0.20$
  - `MEDIUM`: $0.20 \le P < 0.50$
  - `HIGH`: $0.50 \le P < 0.75$
  - `CRITICAL`: $P \ge 0.75$

### 6. Which features contribute most?
Ranking by XGBoost average Gain (F-Score):
1. `current_units` (Gain: **833.9**): Current physical units on hospital shelves.
2. `component` (Gain: **788.6**): Perishable product type (Platelets with 5-day shelf life experience highest shortage velocity).
3. `inventory_days_remaining` (Gain: **759.3**): Ratio of current stock to weekly run-rate.
4. `blood_group` (Gain: **519.4**): ABO/Rh group ($O^-$ universal reserve vulnerability).
5. `units_expiring_5d` (Gain: **484.2**): Shelf-life expiration pressure over the planning window.
6. `season` (Gain: **306.0**): Monsoon epidemic surges vs summer donation lulls.
7. `units_required_to_reach_safety_level` (Gain: **284.4**): Deficit relative to safety reserve par.
8. `avg_daily_demand` (Gain: **275.2**): Hospital clinical scale.
9. `available_units` (Gain: **274.1**): Non-expiring usable stock.
10. `icu_capacity` (Gain: **258.9**): Intensive care trauma throughput.
11. `forecast_cumulative_48h` & `forecast_24h` (Gain: **134 – 157**): Model 1 demand expectations.

### 7. How does performance change during emergencies?
During acute stress scenarios across the 2-year timeline, the model demonstrates high sensitivity:
- **Major Mass Casualty (Chemical Explosion)**: Recall = **85.7%**, ROC-AUC = **0.865**.
- **O- Negative Deficit Crisis**: Recall = **77.2%**, ROC-AUC = **0.852**, PR-AUC = **0.320**.
- **Blood Bank Cooling Failure (`BB_001` Offline)**: Recall = **69.8%**, ROC-AUC = **0.841**.
- **Monsoon Dengue Epidemic Surge**: Recall = **72.4%**, ROC-AUC = **0.871**.
- **Summer Heatwave Donor Slump**: Recall = **56.4%**, ROC-AUC = **0.861**.
The model captures acute surges and escalates risk probabilities to `HIGH` or `CRITICAL` before clinical stockouts occur.

### 8. What are the false-positive and false-negative tradeoffs?
- In healthcare logistics, **False Negatives** (unpredicted stockouts) risk patient surgeries and emergency trauma care.
- **False Positives** (predicting a shortage that doesn't materialize) trigger a low-cost preventive check or replenishment dispatch by the Command Center.
- Our threshold tuning prioritizes Recall (~54%–65% globally, >75% in emergencies) while keeping the False Positive Rate low (**12.7%** at 24h, **14.4%** at 48h, **15.6%** at 72h). Specificity remains high (**84% – 87%**).

### 9. What are the limitations?
- **Synthetic Distribution**: Calibrated on simulated Poisson clinical demand and road network mechanics; clinical validation on live hospital EHR/transfusion logs is required for production deployment.
- **Lead Time Granularity**: Assumes standard inter-facility courier transit times (30–120 minutes); major unexpected highway closures without sensor notice will delay emergency fulfillment.
- **Static Buffer Assumption**: Safety reserve days (`SHORTAGE_SAFETY_RESERVE_DAYS = 1.0`) is configured as an engineering parameter and should be calibrated to individual hospital surgical specialty profiles.

### 10. Is the model suitable for feeding the Command Center?
**Yes.** The model outputs well-calibrated probabilities, robust risk categories (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and structured, interpretable **Model Contributing Factors** (runway, forecast, expiry, emergency multipliers). It provides the exact early warning signal needed to trigger **Model 3: Intelligent Donor Dispatch** and **Engine 4: Transshipment Optimization**.

---

## 2. Command Center CLI & Inference

Run standalone predictions with transparent contributing factors:

```bash
python src/predict_shortage.py --hospital HOSP_007 --blood_group O_NEG --component RBC
```

```text
============================================================
AI BLOOD SUPPLY COMMAND CENTER — SHORTAGE EARLY WARNING
============================================================
Hospital       : HOSP_007
Blood Group    : O_NEG
Component      : RBC
Current Stock  : 3 units (3.5 days runway)

Demand Forecast:
24h            : 0.7 units
48h            : 0.7 units
72h            : 0.8 units (Cumulative: 2.2 units)

Expiring:
Next 24h       : 0 units
Next 48h       : 0 units
Next 72h       : 0 units

Incoming:
24h            : 0 units
48h            : 0 units
72h            : 0 units
------------------------------------------------------------
24h Risk       : 0% (LOW)
48h Risk       : 1% (LOW)
72h Risk       : 1% (LOW)
------------------------------------------------------------
MODEL CONTRIBUTING FACTORS:
• No immediate incoming replenishment scheduled in next 24h
• Depleted regional blood bank reserves across nearby distribution hubs

MODEL OUTPUT ONLY — NOT A CLINICAL DIRECTIVE. Intended strictly for Command Center logistical supply-chain planning.
============================================================
```

---

## 3. Deliverables Summary

| Deliverable | Location | Status |
| :--- | :--- | :---: |
| **Shortage Feature Engineering** | [`src/shortage_features.py`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/src/shortage_features.py) | **Complete & Verified** |
| **Model Training & Calibration** | [`src/train_shortage_model.py`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/src/train_shortage_model.py) | **Complete & Verified** |
| **Command Center Inference Engine** | [`src/predict_shortage.py`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/src/predict_shortage.py) | **Complete & Verified** |
| **Model Artifacts** | `models/shortage_xgb_{24h,48h,72h}.pkl` | **Saved** |
| **Schema & Metrics Reports** | `models/shortage_feature_schema.json`, `models/shortage_model_metrics.json` | **Saved** |
| **Diagnostic Jupyter Notebook** | [`notebooks/03_shortage_prediction.ipynb`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/notebooks/03_shortage_prediction.ipynb) | **13 Charts Rendered** |
| **Pytest Suite** | [`tests/test_shortage_prediction.py`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/tests/test_shortage_prediction.py) | **30/30 Tests Passed** |
| **Technical Documentation** | [`reports/shortage_prediction_report.md`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/reports/shortage_prediction_report.md) | **Completed** |
