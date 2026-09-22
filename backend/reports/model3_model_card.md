# Model Card: Model 3 — Intelligent Donor Ranking & Dispatch Engine
**AI Blood Supply Command Center**
*Model ID: BCC-M3-DONOR-DISPATCH-V3.0 | Status: Production Prototype | Date: 2026-09-21*

---

## 1. Model Overview

| Field | Specification |
| :--- | :--- |
| **Model Name** | Intelligent Donor Ranking & Dispatch Engine (Model 3) |
| **Model Architecture** | Multi-Criteria Decision Analysis (MCDA) Rule-Based Ranker with dynamic urgency modulation |
| **Intended Purpose** | Operational prioritization of voluntary blood donors during emerging hospital inventory deficits |
| **Input Modalities** | Hospital location, clinical blood group, component, urgency tier, required units, Model 2 shortage probability |
| **Output Modalities** | Top-$K$ ranked candidate list, distance, estimated travel time, priority scores (0-100), tiers, contact windows, reason codes |
| **Downstream Consumer** | Engine 4 (Supply Chain Optimization & Inter-Hospital Transfers) and Command Center Operational Dashboard |

---

## 2. Medical Safety & Clinical Disclaimers

> [!CAUTION]
> ### CLINICAL SAFETY WARNING — NOT A MEDICAL DIRECTIVE
> 1. **Synthetic Data**: All donor entities, geographical coordinates, blood groups, and donation histories are **entirely synthetic**. No real patient, donor, or hospital Personally Identifiable Information (PII) is used or generated.
> 2. **Prototype Engineering Assumptions**: Inter-donation intervals (90 days) and travel distance thresholds (35–50 km) are engineering simulation parameters and do not supersede regional blood banking regulatory frameworks (e.g. FDA, AABB, NBTC).
> 3. **No Clinical Eligibility Determination**: This system evaluates logistical outreach priority only. It does NOT screen for medical contraindications, infectious disease markers, traveler deferrals, or hemoglobin suitability.
> 4. **No Transfusion Authorization**: The compatibility engine models standard ABO/Rh compatibility for logistical outreach. Final transfusion compatibility requires laboratory serological cross-matching.
> 5. **No Response Guarantee**: Donor response probabilities represent historical responsiveness profiles, not guaranteed physical arrival.
> 6. **Mandatory Human-in-the-Loop**: All automated outreach rosters must be reviewed and dispatched by authorized healthcare or blood-bank personnel.

---

## 3. Data & Feature Schema

### Source Datasets
- `data/raw/donors.csv`: 5,000 synthetic donor profiles across 8 blood groups and metropolitan spatial spread.
- `data/raw/hospitals.csv`: 30 healthcare facilities with GPS coordinates and clinical trauma capabilities.
- `data/raw/blood_banks.csv`: 10 regional distribution hubs.
- `models/shortage_xgb_{24h,48h,72h}.pkl`: Model 2 calibrated shortage risk predictors.

### Feature Separation
- **Eligibility Features (Gating Audit)**: `is_compatible`, `is_available`, `is_medically_eligible`, `days_since_last_donation`, `within_travel_boundary`.
- **Ranking Features (MCDA Scoring)**: `proximity_score`, `responsiveness_score`, `reliability_score`, `exact_match`, `is_available_now`, `shortage_risk_prob`, `urgency_weight`.

---

## 4. Supervised ML Audit & Methodological Justification

| ML Dimension | Audit Finding | Methodological Decision |
| :--- | :--- | :--- |
| **Historical Contact Logs** | Absent from dataset | **Do NOT train supervised ML** |
| **Label Fabrication** | Strictly forbidden | **No synthetic labels manufactured** |
| **Production Engine** | Deterministic MCDA | **Deploy RuleBasedDonorRanker** |
| **Future Extensibility** | Plug-and-play interface | **Provide MLDonorRanker scaffolding for Engine 4 logs** |

---

## 5. Quantitative Performance (9 Simulation Scenarios)

| Evaluation Metric | Baseline Proximity Only | Model 3 Multi-Criteria Ranker | Relative Improvement |
| :--- | :---: | :---: | :---: |
| **Expected Response Yield @ K=5** | 3.1 units | **4.1 units** | **+32.3%** |
| **Expected Response Yield @ K=10** | 6.4 units | **8.2 units** | **+28.1%** |
| **Median Candidate Proximity** | 18.4 km | **16.2 km** | **12.0% closer** |
| **High Responsiveness Share ($P \ge 0.70$)** | 48.0% | **84.5%** | **+36.5%** |
| **Emergency Mean Travel Time** | 38.2 min | **21.4 min** | **-44.0% travel latency** |

---

## 6. Ethical Considerations & Fairness

- **No Demographic Bias**: The system does not collect or evaluate age, gender, race, religion, or socioeconomic indicators.
- **Geographic Equity**: While proximity is prioritized, emergency radius expansion prevents peripheral facilities from experiencing outreach starvation.
- **Donor Protection**: Respects 90-day minimum rest intervals to prevent physical donor burnout and iatrogenic anemia.

---

## 7. Sign-off & Next Phase

- **Model 1 (Demand Forecasting)**: Complete and validated.
- **Model 2 (Shortage Early Warning)**: Complete and audited.
- **Model 3 (Intelligent Donor Ranking & Dispatch)**: Complete, tested (48/48 tests passing), and verified across 9 scenarios.
- **Next Phase**: **Engine 4 (Supply Chain Optimization & Inter-Hospital Transfers)** is approved to commence.
