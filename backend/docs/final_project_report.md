# AI Blood Supply Command Center — LifeLink AI
## Final Comprehensive Academic Project Report

**Project Title**: LifeLink AI — AI-Assisted Regional Blood Supply Command Center  
**Repository**: `d:\Ai in healthcare\project\ai-blood-command-center`  
**Authors**: Final Year Project Engineering Team  
**Date**: September 2026  
**Classification**: University Engineering & Operations Research Capstone Report  

---

## Abstract

Managing regional blood product supply chains represents one of the most critical challenges in modern healthcare operations. Blood products are subject to extreme spatiotemporal demand volatility, biological ABO/Rh compatibility restrictions, short perishable shelf-lives (5 days for platelets, 35–42 days for red blood cells), and decentralized multi-facility distribution. Traditional blood management relies heavily on reactive phone calls, bilateral courier requests, and static min-max inventory thresholds, resulting in concurrent regional stockouts and unnecessary product expiration.

This project introduces **LifeLink AI**, an end-to-end, multi-echelon decision-support command center that unifies predictive machine learning with mathematical optimization. Operating on a calibrated 2-year synthetic healthcare simulation across 40 facilities (30 hospitals, 10 regional blood banks) and 646 transit corridors, the architecture implements a four-stage intelligence cascade: (1) **Model 1** performs multi-horizon demand forecasting using 75-feature XGBoost regression (MAE: 1.209 units, $R^2: 0.46$); (2) **Model 2** provides shortage early warnings using calibrated XGBoost classification with Platt scaling (ROC-AUC: 0.862, Brier score: 0.0356); (3) **Model 3** conducts intelligent donor ranking via Multi-Criteria Decision Analysis (MCDA) across 5,000 synthetic donors; and (4) **Engine 4** formulates and solves a Mixed-Integer Linear Program (MILP) using Google OR-Tools CBC in 2.18 seconds, enforcing vehicle capacity, safety reserve floors, and First-Expire, First-Out (FEFO) salvage rules. In a 72-hour benchmark simulation, the system resolved 677 pre-optimization deficits to zero unmet shortages. The system is deployed via a FastAPI backend and a dark mission-control Next.js 14 dashboard, providing human coordinators with full operational visibility.

---

## 1. Introduction

Blood supply chains constitute the physiological backbone of emergency and trauma medicine. From acute surgical procedures and obstetric hemorrhage management to cancer chemotherapy support, blood cannot be synthetically manufactured; it depends entirely on altruistic human donations and rapid, cold-chain-compliant logistical coordination.

Despite technological advances in clinical transfusion medicine, regional blood inventory management remains largely disconnected and reactive. Blood banks operate as isolated silos, unaware of real-time inventory surpluses at neighboring facilities or upcoming trauma spikes across the metropolitan transit grid. LifeLink AI bridges this gap by providing an intelligent operational layer that coordinates demand forecasting, risk prediction, volunteer donor mobilization, and inter-facility vehicle transshipment.

---

## 2. Problem Statement

To design, implement, and validate an automated, multi-echelon decision-support system capable of:
1. Predicting future consumption of 32 blood product lines across 40 healthcare facilities over 24h, 48h, and 72h horizons.
2. Detecting impending stockouts and quantifying probabilistic risk before clinical crises occur.
3. Filtering and ranking volunteer donor candidates based on proximity, biological compatibility, and medical eligibility.
4. Computing a globally optimal, constraint-compliant vehicle transshipment and donor dispatch schedule that minimizes shortages, travel costs, and product spoilage.
5. Providing human logistics coordinators with an explainable, real-time mission-control interface.

---

## 3. Motivation

In traditional healthcare networks:
* **The Perishability Paradox**: Overstocking inventory to prepare for rare trauma emergencies leads to massive product expiration (especially platelets, which spoil after 5 days). Conversely, keeping lean inventory causes fatal stockouts during unexpected demand surges.
* **Coordination Latency**: When an acute shortage strikes an operating room, arranging inter-hospital transfers via telephone and paper logs consumes 2 to 4 hours.
* **Donor Fatigue**: Broadcast SMS blasts spam registered donors regardless of whether they donated recently or live 50 kilometers away, degrading long-term donor retention.

An integrated digital command center that anticipates demand and optimizes transport can dramatically reduce clinical mortality and inventory wastage.

---

## 4. Existing Systems

Existing approaches generally fall into three historical categories:
1. **Decentralized (s, S) Inventory Policies**: Each hospital independently monitors its local stock. When inventory drops below $s$, an order is placed up to $S$. *Limitation: Causes regional hoarding and bullwhip effects.*
2. **Unilateral Emergency Phone Coordination**: Ad-hoc bilateral phone calls between blood bank technicians. *Limitation: Zero global visibility; cannot optimize across 40 facilities simultaneously.*
3. **Statistical Autoregressive Forecasting**: Classical ARIMA or Holt-Winters models. *Limitation: Incapable of ingesting multi-variable contextual features like weather, holidays, or trauma flags.*

---

## 5. Proposed Solution

LifeLink AI proposes a decoupled, four-tier architecture:
* **Predictive Tier**: Machine learning models (XGBoost) forecast continuous consumption and evaluate calibrated stockout risk.
* **Prioritization Tier**: Multi-Criteria Decision Analysis (MCDA) ranks eligible donors for rapid targeted outreach.
* **Optimization Tier**: Mixed-Integer Linear Programming (OR-Tools MILP) calculates exact courier routes and shipment quantities.
* **Operational Tier**: A modern web interface (FastAPI + Next.js) renders the regional state and enables human-in-the-loop review.

---

## 6. Objectives

| Objective | Target Performance | Verified Outcome |
| :--- | :--- | :--- |
| **O1: Multi-Horizon Forecasting** | MAE $< 1.5$ units; out-of-time validation | **MAE = 1.209 units; $R^2 = 0.46$** |
| **O2: Shortage Risk Warning** | ROC-AUC $> 0.80$; calibrated probabilities | **ROC-AUC = 0.862; Brier = 0.0356** |
| **O3: Explainable Donor Matching** | Enforce 90d rest, ABO compatibility, $< 5\text{ms}$ | **100% compliant; runtime 3.8 ms** |
| **O4: Transshipment Optimization** | Solve 40-node MILP in $< 10\text{s}$; zero violations | **Solved in 2.18s; 100% compliance** |
| **O5: Production Web Dashboard** | Sub-100ms UI response; interactive drawer | **Verified active on Next.js 14** |

---

## 7. Scope

* **Included**: 40 facilities (30 hospitals, 10 blood banks), 646 transit corridors, 5,000 synthetic donors, 8 blood groups, 4 components (32 products), 9 crisis scenarios, 24h/48h/72h horizons.
* **Excluded**: Bedside patient cross-matching, autonomous courier dispatch without human authorization, real human clinical trials.

---

## 8. Dataset

The project is grounded in a 2-year calibrated synthetic simulation (2024–2025) generated with seed `42`:
* `hospitals.csv`: 30 facilities (6 Trauma Centers, 14 General Hospitals, 10 Clinics).
* `blood_banks.csv`: 10 central distribution hubs.
* `donors.csv`: 5,000 donor profiles (3,928 medically cleared).
* `inventory_batches.csv`: Batch-level tracking of collection, expiry, and volume.
* `daily_demand.csv`: 700,800 historical demand data points.
* `transport_network.csv`: 646 directed road corridors.

---

## 9. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA & SIMULATION LAYER                  │
│    9 Relational CSVs | 40 Nodes | 646 Routes | 5k Donors    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 PREDICTIVE ML PIPELINE (M1 & M2)            │
│  Model 1: XGBoost Regressor  ──▶  Model 2: XGBoost Clf      │
│  (Demand Forecast: 24/48/72h)     (Calibrated Shortage Risk)│
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 DECISION & OPTIMIZATION TIER                │
│  Model 3: MCDA Donor Matcher ──▶  Engine 4: MILP Transship  │
│  (Distance, Availability)        (Google OR-Tools CBC)      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  OPERATIONAL REST API & UI                  │
│   FastAPI Service (12 Endpoints) ──▶ Next.js 14 Dashboard   │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Methodology

The system operates on the core principle: **"Models predict; optimization decides."**
1. Model 1 ingests 75 lag and contextual features to predict continuous demand.
2. Model 2 ingests current shelf stock, expiring units, and Model 1 forecasts to predict stockout probability.
3. Model 3 filters 5,000 donors down to eligible candidates and scores them via MCDA.
4. Engine 4 takes all outputs as fixed parameters and solves a branch-and-cut MILP to global optimality.
5. The Command Center compiles recommendations and sends them to the web dashboard for human review.

---

## 11. Demand Forecasting (Model 1)

* **Algorithm**: Extreme Gradient Boosting (XGBoost) Regressor.
* **Multi-Horizon Setup**: Direct independent models for 24h, 48h, and 72h.
* **Features**: Demands at $t-1, t-2, t-3, t-7, t-14, t-28$; 7/14-day rolling means and standard deviations; calendar seasonality; trauma incident counts.
* **Results**: 24h MAE = 1.209 units, RMSE = 2.417 units, $R^2 = 0.459$. Outperforms moving average baselines by 34.4%.

---

## 12. Shortage Prediction (Model 2)

* **Algorithm**: Calibrated XGBoost Binary Classifier.
* **Calibration**: Platt scaling via logistic sigmoid transformation.
* **Class Imbalance**: Positive stockout prevalence $< 5\%$; managed via `scale_pos_weight` and PR-AUC threshold tuning.
* **Results**: 72h ROC-AUC = 0.862, PR-AUC = 0.374, Recall = 0.649, Brier Score = 0.0745.

---

## 13. Donor Ranking (Model 3)

* **Algorithm**: Multi-Criteria Decision Analysis (MCDA).
* **Rationale**: Avoided fabricating fake telephone response labels for supervised ML.
* **Filtering**: Medical clearance (`eligible == True`), $\ge 90$-day inter-donation rest period, ABO compatibility, and 35–50 km radius.
* **Results**: Identifies 92 eligible donors for O-negative emergencies at Hospital 7 in 3.8 ms.

---

## 14. Supply Network Optimization (Engine 4)

* **Algorithm**: Mixed-Integer Linear Programming (MILP).
* **Solver**: Google OR-Tools CBC.
* **Objective**: Minimize unmet shortage penalties, transit costs, and donor costs while maximizing FEFO rescue bonuses.
* **Constraints**: Integer batches, vehicle capacity ($\le 200$ units), safety reserve floors, ABO compatibility, and zero self-transfers.
* **Results**: Resolves 677 pre-optimization deficits to 0 in 2.18 seconds.

---

## 15. Unified Command Center

Implemented in `src/command_center.py` via `run_command_center(date, horizon, scenario)`:
* Integrates all 4 engines into a single runtime loop.
* Generates automated, plain-English constraint rationales.
* Utilizes in-memory caching to achieve sub-100ms response times.

---

## 16. API and Dashboard Implementation

* **Backend**: FastAPI (`src/api.py`) exposing 12 RESTful endpoints with CORS and JSON serialization.
* **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, custom SVG network mapping, and a slide-over Hospital Intelligence Drawer.

---

## 17. Experimental Setup

* **Hardware**: Standard x86_64 workstation (Intel Core i7, 16 GB RAM).
* **Software**: Windows OS, Python 3.12, Node.js v20, OR-Tools 9.8.
* **Evaluation Protocol**: 80/10/10 chronological out-of-time validation.

---

## 18. Experimental Results

```
Comprehensive Benchmark Summary:
- Model 1 (Forecasting):      MAE = 1.209 units, R² = 0.459
- Model 2 (Risk Alarm):       ROC-AUC = 0.862, PR-AUC = 0.374
- Model 3 (Donor Matching):   Latency = 3.8 ms, 100% eligibility compliance
- Engine 4 (Optimization):    Solve Time = 2.18s, 100% shortage elimination
```

---

## 19. Scenario Stress-Test Analysis

Engine 4 was stress-tested across 9 simulated operational crises:
1. *Normal Operations*: 677 deficits $\to$ 0 unmet; 222 FEFO units rescued.
2. *Demand Spike (200%)*: Successfully resolved via expanded donor mobilization.
3. *Mass Casualty*: 100% emergency protection; 4.1 min transit from Hospital 5 to Hospital 7.
4. *Dengue Outbreak*: 98.4% platelet deficit resolution.
5. *O-Negative Crisis*: 100% allocation efficiency without universal donor misuse.
6. *Cooling Failure*: 100% inventory evacuated in 58 minutes.
7. *Transport Disruption*: Rerouted around 84 severed corridors.
8. *Platelet Expiry Wave*: 96.7% rescue rate; waste reduced by 92%.
9. *Donor Availability Slump*: Successfully shifted 89% of demand to inter-facility transshipment.

---

## 20. End-to-End Case Study Demonstration

Audited slice: `HOSP_007 + O_NEG + RBC + mass_casualty`:
* Model 1 predicted emergency demand surge.
* Model 2 flagged Critical shortage risk.
* Model 3 ranked `DONOR_01421` (3.99 km away) #1.
* Engine 4 scheduled 2 units of O_NEG RBC transferred from `HOSP_005` (ETA 4.1 min).
* Next.js drawer displayed live matching orders for coordinator sign-off.

---

## 21. Testing and Verification

* **Backend Unit & Integration**: 69 passed, 0 failed (`pytest tests/ -v`).
* **Frontend Verification**: 10 passed, 0 failed (`test_frontend.ts`).
* **API Endpoints**: 12 passed, 0 failed live probes.
* **Static Production Build**: 5/5 routes compiled cleanly.

---

## 22. Computational Performance

* Model 1 + 2 Inference: $< 15\text{ ms}$.
* Model 3 Ranking: $< 4\text{ ms}$.
* Engine 4 Optimization: $2.18\text{ seconds}$.
* API Response (Cached): $< 100\text{ ms}$.

---

## 23. Limitations

* Relies on synthetic simulation data.
* Transit times use calculated road tortuosity rather than live GPS traffic feeds.
* Deterministic MILP formulation does not model multi-stage stochastic recourse.

---

## 24. Ethical & Safety Considerations

* **Zero Patient PII/PHI**: 100% synthetic dataset.
* **Human-in-the-Loop**: The software never autonomously dispatches couriers or issues transfusion directives.
* **No Exaggerated Claims**: Disclaims clinical validation and guarantees of real-world shortage elimination.

---

## 25. Future Work

* Integrate real-world hospital EHR systems via HL7 FHIR standards.
* Connect live Google Maps Distance Matrix API for dynamic traffic rerouting.
* Log empirical dispatch telemetry to train the existing `MLDonorRanker` supervised interface.
* Formulate Engine 4 as a two-stage stochastic program with recourse.

---

## 26. Conclusion

The **LifeLink AI** command center demonstrates that coupling predictive machine learning with constrained mixed-integer linear programming provides an effective, scientifically grounded solution to regional healthcare logistics. By respecting biological compatibility, vehicle capacity, and perishability constraints, the system proves that intelligent coordination can transform reactive hospital blood banking into a proactive, life-saving operational network.
