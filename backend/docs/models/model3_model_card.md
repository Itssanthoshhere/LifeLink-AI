# Model Card: Model 3 — Donor Matching & Dispatch Engine
## Standardized Decision Engine Documentation

---

## 1. Engine Details
* **Engine Name**: LifeLink AI Intelligent Donor Ranker (`Model 3`)
* **Version**: 1.0.0
* **Engine Type**: Deterministic Multi-Criteria Decision Analysis (MCDA) Utility Scorer
* **Framework**: Python 3.12, NumPy, Pandas, Haversine geodesics
* **Target Output**: Prioritized candidate queue, composite priority scores ($0–100$), and priority tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
* **Developer**: LifeLink AI Engineering Team
* **License**: Academic Research Open-Source

---

## 2. Intended Use & Clinical Scope
* **Intended Use**: Operational decision support for hospital blood bank coordinators to prioritize volunteer blood donors for phone and SMS dispatch during impending blood shortages.
* **Out-of-Scope Use**: Must not replace licensed phlebotomist clinical pre-screening (hemoglobin fingerstick, blood pressure check, infectious disease serology).

---

## 3. Data Ingestion & Filtering Rules
* **Database**: 5,000 synthetic donor records (`donors.csv`).
* **Medical Rest Period**: Rejects any donor with less than 90 days elapsed since `last_donation_date`.
* **Clinical Clearance**: Requires `eligible == True`.
* **ABO/Rh Compatibility**: Evaluates standard component transfusion matrices via `get_compatible_donors()`.
* **Spatial Reach**: Enforces 35 km ceiling (routine) or 50 km ceiling (emergency) using Haversine great-circle calculation and a 1.25 road tortuosity factor.

---

## 4. Performance & Scalability
* **Inference Speed**: $< 4.5\text{ ms}$ across 5,000 candidates.
* **Determinism**: 100% deterministic ranking (identical inputs produce identical scores).
* **Extensibility**: Includes `MLDonorRanker` interface ready for supervised conversion learning once empirical dispatch telemetry is logged.
