# AI Blood Supply Command Center — Synthetic Healthcare Dataset Generator

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Validation: 100% PASS](https://img.shields.io/badge/validation-100%25%20PASS-brightgreen.svg)]()

> **IMPORTANT DISCLAIMER**:
> All data in this repository is **strictly synthetic**. It does **NOT** contain, use, or mimic real patient, donor, or hospital Personally Identifiable Information (PII) or protected clinical records. It represents a mathematically modeled simulation of an urban regional blood banking ecosystem designed exclusively for ML training, demand forecasting, logistics optimization, and command-center dashboard prototyping.

---

## 1. Project Overview

The **AI Blood Supply Command Center** is an intelligent healthcare logistics platform designed to prevent blood shortages, reduce waste from expired units, dynamically match eligible donors, and optimize inter-hospital blood transfers during emergencies.

This module provides a **reproducible, fully interconnected synthetic healthcare dataset generator** simulating 2 years (730 days) of operations across:
- **30 synthetic hospitals** (Trauma Centers, Teaching Hospitals, General, Government, Private, Specialty)
- **10 synthetic blood banks** (Regional Hubs & District Blood Centers)
- **5,000 synthetic non-PII voluntary donors**
- **400,000+ cold-chain inventory batches** tracked through their full lifecycle (available, reserved, expired, transferred)
- **260,000+ clinical blood requisition orders**
- **390 dynamic emergency events** (mass casualties, road accidents, facility failures, transit disruptions)
- **730 days of meteorological and epidemiological context** (monsoon dengue spikes, festivals, weather)

---

## 2. System Architecture

```text
Synthetic Simulation Engine (generate_all.py)
                   │
                   ▼
       ┌───────────────────────┐
       │     data/raw/*.csv    │
       │ (9 Connected Datasets)│
       └───────────┬───────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │   PostgreSQL / Data   │
       │       Warehouse       │
       └───────────┬───────────┘
                   │
       ┌───────────┴───────────────────────────┐
       │                                       │
       ▼                                       ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│ Model 1: Demand Forecast  │       │ Model 2: Shortage Predict │
│ (XGBoost / LightGBM)      │       │ (Early-Warning Classifier)│
└─────────────┬─────────────┘       └─────────────┬─────────────┘
              │                                   │
              │     ┌───────────────────────┐     │
              ├────►│ Model 3: Donor Ranker ◄─────┤
              │     │ (Urgent Matching)     │     │
              │     └───────────────────────┘     │
              ▼                                   ▼
       ┌─────────────────────────────────────────────────┐
       │ Engine 4: Network Optimization (OR-Tools / MILP)│
       │ Transshipment, FEFO perishability & routes     │
       └────────────────────────┬────────────────────────┘
                                │
                                ▼
       ┌─────────────────────────────────────────────────┐
       │         AI BLOOD SUPPLY COMMAND CENTER          │
       │   (Real-Time Hospital & Regional Dashboard)     │
       └─────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```text
ai-blood-command-center/
│
├── data/
│   ├── raw/
│   │   ├── hospitals.csv               # 30 facility profiles & storage capacities
│   │   ├── blood_banks.csv             # 10 regional hubs & district collection centers
│   │   ├── transport_network.csv       # Road transit graph, travel times & disruptions
│   │   ├── donors.csv                  # 5,000 synthetic non-PII donor profiles
│   │   ├── events_context.csv          # 730 days of weather, holidays & dengue spikes
│   │   ├── emergency_events.csv        # 390 emergency incidents with demand multipliers
│   │   ├── daily_demand.csv            # 175,200 records (surgeries, trauma, emergencies)
│   │   ├── inventory_batches.csv       # 400,000+ cold-chain batches tracked over time
│   │   └── blood_requests.csv          # 260,000+ clinical requisition orders
│   │
│   ├── processed/                      # Target directory for ML-engineered feature sets
│   └── dataset_summary.json            # Machine-readable summary metrics & metadata
│
├── src/
│   ├── config.py                       # Central hyperparameters, shelf lives & rules
│   ├── blood_compatibility.py          # Clinical compatibility matrices (RBC, FFP, PLT)
│   ├── generate_hospitals.py           # Hospital entity generator
│   ├── generate_blood_banks.py         # Blood bank entity generator
│   ├── generate_transport.py           # Transit network & Haversine distance calculator
│   ├── generate_donors.py              # Donor entity generator (90d interval check)
│   ├── generate_context.py             # Weather, festival, and disease outbreak generator
│   ├── generate_emergencies.py         # Emergency incidents generator
│   ├── generate_demand.py              # Daily hospital demand generator
│   ├── generate_requests.py            # Clinical requisition orders generator
│   ├── generate_inventory.py           # FEFO inventory engine & cold-chain tracker
│   ├── generate_all.py                 # Master chronological simulation coordinator
│   ├── build_notebook.py               # Programmatic exploration notebook builder
│   └── validation.py                   # Automated validation suite (12 integrity checks)
│
├── notebooks/
│   └── 01_dataset_exploration.ipynb    # Executed Jupyter notebook with all 10 visual checks
│
├── tests/
│   └── test_simulation.py              # Pytest unit & integration test suite (11 test cases)
│
├── requirements.txt                    # Project dependencies
├── README.md                           # Documentation & architecture guide
└── .gitignore                          # Standard gitignore
```

---

## 4. Dataset Data Dictionary

### 1. `hospitals.csv` (30 records)
| Column | Type | Description |
| :--- | :--- | :--- |
| `hospital_id` | String | Unique identifier (`HOSP_001` to `HOSP_030`) |
| `hospital_name` | String | Facility name (e.g., *Metro Trauma Center*, *Trinity Teaching Hospital*) |
| `city` | String | Simulated region (`Metro Metropolis`) |
| `latitude` | Float | Latitude coordinate (clustered around 12.9716 N) |
| `longitude` | Float | Longitude coordinate (clustered around 77.5946 E) |
| `hospital_type` | String | `Trauma`, `Teaching`, `General`, `Government`, `Private`, `Specialty` |
| `bed_capacity` | Integer | Inpatient bed count (100 to 1,200 beds) |
| `icu_capacity` | Integer | Critical care ICU beds |
| `blood_storage_capacity`| Integer | Cold-chain storage capacity (units) |
| `avg_daily_demand` | Float | Baseline average daily units demanded |
| `emergency_capacity` | Integer | Surge capacity for emergency trauma patients |
| `operational_status` | String | `Operational` or `Reduced Capacity` |

### 2. `blood_banks.csv` (10 records)
| Column | Type | Description |
| :--- | :--- | :--- |
| `blood_bank_id` | String | Unique identifier (`BB_001` to `BB_010`) |
| `name` | String | Center name (Regional Hubs vs District Centers) |
| `city` | String | Simulated region (`Metro Metropolis`) |
| `latitude` | Float | Geographic latitude |
| `longitude` | Float | Geographic longitude |
| `storage_capacity` | Integer | Cold-chain storage capacity (1,200 to 6,000 units) |
| `daily_collection_capacity`| Integer | Average daily voluntary donor blood collection units |
| `emergency_support` | Boolean | 24/7 emergency dispatch capability (`True`/`False`) |
| `operational_status` | String | `Operational` or `Maintenance` |

### 3. `transport_network.csv` (Routes graph)
| Column | Type | Description |
| :--- | :--- | :--- |
| `route_id` | String | Unique route identifier (`RT_00001`...) |
| `source_id` | String | Origin facility (`BB_xxx` or `HOSP_xxx`) |
| `source_type` | String | `Blood_Bank` or `Hospital` |
| `destination_id` | String | Destination hospital (`HOSP_xxx`) |
| `destination_type` | String | `Hospital` |
| `distance_km` | Float | Road transit distance (Haversine $\times$ 1.28 urban tortuosity) |
| `travel_time_minutes`| Float | Travel time factoring urban speed (38 km/h) and traffic multiplier |
| `transport_capacity` | Integer | Cooler container capacity per transfer run (20 to 120 units) |
| `traffic_factor` | Float | Traffic congestion coefficient (1.05 to 1.50) |
| `route_status` | String | `Active`, `Congested`, `Disrupted` |

### 4. `donors.csv` (5,000 records)
| Column | Type | Description |
| :--- | :--- | :--- |
| `donor_id` | String | Non-PII identifier (`DONOR_00001` to `DONOR_05000`) |
| `blood_group` | String | $A^+, A^-, B^+, B^-, AB^+, AB^-, O^+, O^-$ |
| `latitude` | Float | Residential/work spatial coordinates |
| `longitude` | Float | Residential/work spatial coordinates |
| `last_donation_date`| String | Date of most recent whole blood donation |
| `eligible` | Boolean | Clinical eligibility ($\ge 90$ days since last donation) |
| `availability` | String | `Available`, `Busy`, `Inactive` |
| `donation_count` | Integer | Lifetime donation count |
| `response_probability`| Float | Modeled probability of accepting an emergency call (0.25 to 0.98) |
| `average_response_time_minutes`| Integer | Typical time to arrive at a donation center (15 to 180 min) |

### 5. `events_context.csv` (730 days)
| Column | Type | Description |
| :--- | :--- | :--- |
| `date` | String | Date string (`YYYY-MM-DD`, 2024-01-01 to 2025-12-30) |
| `city` | String | `Metro Metropolis` |
| `temperature` | Float | Daily average ambient temperature in °C |
| `rainfall` | Float | Daily rainfall in mm |
| `weather` | String | `Sunny`, `Cloudy`, `Rainy`, `Heavy Rain`, `Foggy` |
| `holiday_flag` | Integer | `1` if weekend or public holiday, else `0` |
| `festival` | String | Major cultural festival or `None` |
| `accident_count` | Integer | Daily municipal road accidents |
| `disease_spike_flag`| Integer | `1` during peak monsoon dengue/malaria outbreak waves |
| `blood_drive_flag` | Integer | `1` when scheduled corporate/university blood drive active |
| `transport_disruption_flag`| Integer | `1` during transit corridor closures |

### 6. `emergency_events.csv` (390 events)
| Column | Type | Description |
| :--- | :--- | :--- |
| `event_id` | String | Unique incident identifier (`EVT_0001`...) |
| `timestamp` | String | Incident date and time (`YYYY-MM-DD HH:MM:SS`) |
| `location_id` | String | Geographic sector or facility identifier |
| `event_type` | String | `road_accident`, `mass_casualty`, `industrial_accident`, `natural_disaster`, `surgery_surge`, `disease_spike`, `blood_bank_failure`, `transport_disruption` |
| `severity` | String | `Minor`, `Moderate`, `Severe`, `Critical` |
| `affected_hospitals`| String | Comma-separated list of receiving hospitals |
| `estimated_patients`| Integer | Casualty/patient count |
| `blood_demand_multiplier`| Float | Demand amplification coefficient (1.15 to 3.50) |
| `duration_hours` | Integer | Incident duration in hours (2 to 72 hours) |

### 7. `daily_demand.csv` (175,200 records)
| Column | Type | Description |
| :--- | :--- | :--- |
| `date` | String | `YYYY-MM-DD` |
| `hospital_id` | String | `HOSP_001` to `HOSP_030` |
| `blood_group` | String | 8 standard blood groups |
| `units_used` | Integer | Total units demanded on this day |
| `emergency_units_used`| Integer | Acute emergency transfusions (amplified by emergency events) |
| `scheduled_surgery_units`| Integer | Elective/scheduled surgeries (higher Mon-Fri) |
| `trauma_units` | Integer | Trauma resuscitations (higher Fri-Sun nights) |
| `day_of_week` | String | Monday through Sunday |
| `month` | Integer | 1 through 12 |
| `season` | String | `Winter`, `Summer`, `Monsoon`, `Autumn` |
| `festival_flag` | Integer | `1` if festival surge day |
| `disease_spike_flag`| Integer | `1` if disease outbreak wave active |

### 8. `inventory_batches.csv` (400,000+ records)
| Column | Type | Description |
| :--- | :--- | :--- |
| `batch_id` | String | Discrete cold-chain unit batch ID (`BAT_0000001`...) |
| `location_id` | String | Facility holding the batch (`HOSP_xxx` or `BB_xxx`) |
| `location_type` | String | `Hospital` or `Blood_Bank` |
| `blood_group` | String | Blood group |
| `component` | String | `RBC`, `Platelets`, `Plasma`, `Whole_Blood` |
| `units` | Integer | Current available unit count |
| `collection_date` | String | Date collected from donor |
| `expiry_date` | String | Calculated strictly as `collection_date + shelf_life` |
| `days_to_expiry` | Integer | Remaining shelf life at terminal simulation snapshot |
| `status` | String | `available`, `reserved` (consumed), `expired`, `transferred` |

### 9. `blood_requests.csv` (260,000+ records)
| Column | Type | Description |
| :--- | :--- | :--- |
| `request_id` | String | Order requisition number (`REQ_000001`...) |
| `timestamp` | String | Time request submitted |
| `hospital_id` | String | Requesting hospital |
| `blood_group` | String | Requested blood group |
| `component` | String | `RBC`, `Platelets`, `Plasma`, `Whole_Blood` |
| `units_required` | Integer | Requisition quantity |
| `urgency` | String | `routine` (12-24h), `urgent` (2-4h), `emergency` (1h), `critical` (30m) |
| `required_by` | String | Clinical deadline |
| `status` | String | `fulfilled`, `delayed`, `partially_fulfilled`, `unfulfilled` |
| `fulfilled_from` | String | Facility ID fulfilling order or `hospital_local` / `none` |

---

## 5. Clinical Rules & Compatibility Engine

Transfusion safety rules are encapsulated in `src/blood_compatibility.py`:

```text
Packed Red Blood Cells (RBC):
Recipient   Compatible Donor Blood Groups
─────────────────────────────────────────────────────────────
A_POS    :  A_POS, A_NEG, O_POS, O_NEG
A_NEG    :  A_NEG, O_NEG
B_POS    :  B_POS, B_NEG, O_POS, O_NEG
B_NEG    :  B_NEG, O_NEG
AB_POS   :  All 8 Blood Groups (Universal Recipient)
AB_NEG   :  AB_NEG, A_NEG, B_NEG, O_NEG
O_POS    :  O_POS, O_NEG
O_NEG    :  O_NEG only (Universal Donor to all groups)

Fresh Frozen Plasma (FFP):
Recipient   Compatible Donor Blood Groups (Inverted ABO!)
─────────────────────────────────────────────────────────────
O_POS / NEG :  All 8 Blood Groups (Universal Recipient)
A_POS / NEG :  A_POS, A_NEG, AB_POS, AB_NEG
B_POS / NEG :  B_POS, B_NEG, AB_POS, AB_NEG
AB_POS / NEG:  AB_POS, AB_NEG only (Universal Plasma Donor)
```

### Component Storage Rules & Shelf Lives
- **Packed Red Blood Cells (RBC)**: 42 days (refrigerated 1–6 °C in CPDA-1 additive solution)
- **Platelets**: 5 days (room temp 20–24 °C under continuous agitation — highest perishability risk!)
- **Fresh Frozen Plasma (FFP)**: 365 days (frozen $\le -18$ °C)
- **Whole Blood**: 35 days (refrigerated 1–6 °C)

---

## 3. Simulation Realism & Calibration Audit

A thorough realism audit and calibration was conducted to eliminate pathological feedback loops while maintaining challenging operational stress for downstream ML and optimization models.

### Audit Findings & Underlying Root Causes
1. **Initial Unrealistic Metric**: 247,369 transfers for 260,660 requests (~95% transfer frequency).
   - **Root Cause**: The initial simulation lacked a routine morning replenishment delivery cycle from blood banks to hospitals. Hospitals started with an initial buffer that exhausted after ~10 days. From that point on, hospitals held zero inventory, forcing *every single patient requisition order* to dispatch an ad-hoc road transfer.
2. **Initial Unrealistic Metric**: 46,087 shortages (17.7% shortage rate), with 75% occurring on routine elective surgeries.
   - **Root Cause**: Because hospitals had no working inventory, any momentary route disruption or blood bank stock mismatch immediately resulted in an unfulfilled patient shortage.
3. **Severe Universal O- Negative Depletion**: 38.8% shortage rate for $O^-$.
   - **Root Cause**: The raw FEFO algorithm allowed universal $O^-$ blood to be consumed by any compatible patient ($A^+, B^+, AB^+$ routine elective cases), rapidly wiping out the emergency universal donor reserve.

### Calibration Engineering Targets & Comparative Results

| Performance Metric | Pre-Calibration (Baseline) | Calibrated Prototype | Simulation Target Range | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Shortages Count** | 46,087 | **27,318** | 15,000 – 30,000 | **Met** |
| **Shortage Rate** | 17.68% | **10.48%** | 5.0% – 11.0% | **Met** |
| **Total Transfers** | 247,369 | **35,262** | 15,000 – 40,000 | **Met** |
| **Transfers / Request** | 0.949 | **0.135** | 0.10 – 0.20 | **Met** |
| **Overall Fulfillment Rate** | 82.32% | **89.52%** | 88.0% – 94.0% | **Met** |
| **Immediate Fulfillment** | 42.55% | **88.32%** | 85.0% – 92.0% | **Met** |
| **Expired Units** | 6,811 | **41,714** | 3.0% – 7.0% | **Met (4.46%)** |

> *Note: These are engineering simulation targets for this prototype to balance realistic operational stability with enough friction for ML/OR-Tools, not claims about real-world clinical statistics.*

### 9 Explicit Operational Scenarios (Stress Tests)
The 2-year simulation embeds 9 reproducible stress scenarios to test different operational challenges:
1. **Normal Operations** (`2024-02-12` to `2024-02-18`): Predictable caseload, 95.62% fulfillment, baseline working stock.
2. **Holiday Demand Spike** (`2024-03-24` to `2024-03-26`): Spring festival creates +30% trauma demand and elective surgery surge.
3. **Major Mass Casualty** (`2024-05-18` to `2024-05-19`): Sector 4 chemical explosion (120 casualties), demand multiplier 2.8x, emergency transfers surge.
4. **Multiple Hospital Shortages** (`2024-07-20` to `2024-07-28`): Monsoon dengue outbreak simultaneously strains all 30 hospitals, shortage rate rises to 13.54%.
5. **O-Negative Crisis** (`2024-08-12` to `2024-08-15`): Cluster of major highway trauma cases exhausts universal $O^-$ reserves (20.08% shortage rate for $O^-$).
6. **Blood Bank Hub Failure** (`2024-09-05` to `2024-09-08`): Cooling compressor failure at `BB_001` takes regional hub offline; district centers surge supply.
7. **Transport Corridor Inundation** (`2024-10-10` to `2024-10-12`): Heavy cyclone waterlogging blocks northern transit corridor, causing delivery delays and localized shortages.
8. **Platelet Expiry Wave** (`2025-01-02` to `2025-01-07`): Post-New Year donor drive surplus meets post-holiday surgery lull, elevating 5-day platelet expiry.
9. **Donor Turnout Slump** (`2025-05-01` to `2025-05-10`): Extreme heatwave causes 48% reduction in donor turnout, drawing down blood bank reserves (18.76% shortage rate).

---

## 4. How the Calibrated Simulation Works

The simulation runs chronologically day-by-day ($t = 1 \dots 730$):

1. **Context & Scenarios**: Evaluates weather, holiday status, disease flags, active stress scenarios, and facility outages.
2. **Voluntary Donor Collections**: Blood banks collect daily donor donations (factoring blood drives and heatwave slumps).
3. **Routine Morning Hospital Replenishment**: Blood banks dispatch scheduled consolidation shipments to hospitals to maintain their 3-day working par levels.
4. **Local FEFO Consumption**: Clinical requests draw from local hospital inventory using First-Expired, First-Out.
5. **$O^-$ Clinical Stewardship**: Universal $O^-$ blood is reserved strictly for emergency/trauma and Rh- patients; routine elective surgeries use ABO-identical blood.
6. **Acute Emergency Transfers**: When local stock cannot cover an acute trauma surge, the Command Center routes an emergency courier from the nearest blood bank or surplus peer facility.
7. **Daily Expirations Sweep**: Batches reaching their clinical shelf life (Platelets: 5d, Whole Blood: 35d, RBC: 42d, FFP: 365d) are swept and recorded.

---

## 7. How to Run, Validate, and Explore

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Regenerate All Datasets from Scratch
```bash
python src/generate_all.py
```
*Executes full 730-day simulation in ~35 seconds, writing all CSVs to `data/raw/` and summary to `data/dataset_summary.json`.*

### Step 3: Run the Automated Validation Suite
```bash
python src/validation.py
```
Output:
```text
==================================================
DATASET VALIDATION REPORT
==================================================
Hospitals               : PASS
Blood Banks             : PASS
Transport Network       : PASS
Donors                  : PASS
Demand                  : PASS
Inventory               : PASS
Emergency Events        : PASS
Requests                : PASS
Foreign Keys            : PASS
Blood Compatibility     : PASS
--------------------------------------------------
Negative Inventory      : PASS
Duplicate IDs           : PASS
==================================================
OVERALL RESULT: ALL VALIDATION SUITES PASSED (100%)
```

### Step 4: Run Unit & Integration Tests
```bash
pytest tests/ -v
```
*Validates universal donor/recipient rules, Rh anti-D prevention, donor eligibility intervals, and transport distances (11 passed).*

### Step 5: Launch Jupyter Exploration Notebook
```bash
jupyter notebook notebooks/01_dataset_exploration.ipynb
```
*Inspect pre-rendered charts covering all 10 required exploration areas.*

---

---

## 8. Machine Learning & Optimization Modules

### Model 1 — Demand Forecasting (COMPLETED & VALIDATED)
- **Objective**: Predict next 24h ($t+1$), 48h ($t+2$), and 72h ($t+3$) blood units demanded per hospital, blood group, and component.
- **Granularity**: 960 distinct daily time series (30 hospitals $\times$ 8 blood groups $\times$ 4 components).
- **Architecture**: Direct Multi-Step XGBoost Regressors (`models/demand_xgb_{24h,48h,72h}.pkl`).
- **Features**: Strictly shifted historical lags ($t-1 \dots t-28$), past rolling statistics (3, 7, 14, 28-day mean & std), target calendar/weekend attributes, weather/context signals, pre-prediction emergency signals, and hospital capacity metadata.
- **Test Set Benchmark Results**:
  | Model / Horizon | MAE | RMSE | WAPE | $R^2$ Score |
  | :--- | :---: | :---: | :---: | :---: |
  | Baseline 1: Previous Day (`lag_1`) [24h] | 1.461 | 3.396 | 114.9% | -0.068 |
  | Baseline 2: 7-Day Moving Avg (`rolling_mean_7`) [24h] | 1.245 | 2.563 | 97.9% | 0.392 |
  | Baseline 3: Same Day Last Week (`lag_7`) [24h] | 1.469 | 3.415 | 115.5% | -0.080 |
  | **XGBoost (24h Forecast)** | **1.209** | **2.417** | **95.1%** | **0.459** |
  | **XGBoost (48h Forecast)** | **1.211** | **2.415** | **95.2%** | **0.460** |
  | **XGBoost (72h Forecast)** | **1.206** | **2.399** | **95.1%** | **0.464** |

- **CLI Inference**:
  ```bash
  python src/predict_demand.py --hospital HOSP_007 --blood_group O_NEG --component RBC
  ```
- **Exploration Notebook**: See [`notebooks/02_demand_forecasting.ipynb`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/notebooks/02_demand_forecasting.ipynb) for 10 presentation-grade charts.
- **Technical Report**: Full analysis in [`reports/demand_forecasting_report.md`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/reports/demand_forecasting_report.md).

---

---

### Model 2 — Shortage Early-Warning Prediction (COMPLETED & VALIDATED)
- **Objective**: Predict whether a hospital will experience an unfulfilled shortage in the next 24h, 48h, or 72h across all 30 hospitals, 8 blood groups, and 4 components.
- **Architecture**: Multi-Horizon Direct XGBoost Classifiers (`models/shortage_xgb_{24h,48h,72h}.pkl`) calibrated via Isotonic Regression.
- **Integrated Signals**: Cold-chain inventory snapshots, 1d–5d shelf-life expiry pressures, Model 1 demand forecasts, inventory runway days, incoming supplies, and regional blood bank availability.
- **Test Set Benchmark Results**:
  | Model / Horizon | Precision | Recall | F1 Score | PR-AUC | ROC-AUC |
  | :--- | :---: | :---: | :---: | :---: | :---: |
  | Rule-Based Baseline (24h) | 0.043 | 0.223 | 0.072 | 0.044 | 0.511 |
  | **XGBoost Classifier (24h)** | **0.153** | **0.542** | **0.239** | **0.192** | **0.849** |
  | Rule-Based Baseline (48h) | 0.086 | 0.334 | 0.137 | 0.087 | 0.537 |
  | **XGBoost Classifier (48h)** | **0.247** | **0.602** | **0.351** | **0.292** | **0.855** |
  | Rule-Based Baseline (72h) | 0.104 | 0.400 | 0.165 | 0.121 | 0.525 |
  | **XGBoost Classifier (72h)** | **0.319** | **0.649** | **0.428** | **0.374** | **0.862** |

- **CLI Inference**:
  ```bash
  python src/predict_shortage.py --hospital HOSP_007 --blood_group O_NEG --component RBC
  ```
- **Exploration Notebook**: See [`notebooks/03_shortage_prediction.ipynb`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/notebooks/03_shortage_prediction.ipynb) for 13 diagnostic charts.
- **Technical Report**: Full analysis in [`reports/shortage_prediction_report.md`](file:///d:/Ai%20in%20healthcare/project/ai-blood-command-center/reports/shortage_prediction_report.md).

---

### Model 3 — Intelligent Donor Matching & Ranking

### Model 3 — Intelligent Donor Matching & Ranking
- **Objective**: When a rare blood group deficit occurs, rank candidate donors.
- **Features**: Blood group compatibility, Haversine distance to facility, donor response probability, availability status, days since last donation ($> 90$ days).
- **Output**: Ranked prioritized call list for automated SMS/app notification.

### Engine 4 — Mathematical Network Optimization (Google OR-Tools / MILP)
- **Objective**: Transshipment optimization without relying on black-box ML.
- **Decision Variables**: $X_{i, j, b, c, t}$ = units of blood group $b$, component $c$ transferred from source $i$ to destination $j$ on day $t$.
- **Objective Function**:
  $$\min \sum \text{Shortage Penalty} + \sum \text{Expiry Risk Penalty} + \sum \text{Transport Cost} \times \text{Distance}$$
- **Constraints**:
  1. Transfer quantity $\le$ Source available batch inventory.
  2. Total units per vehicle $\le$ Transport container capacity.
  3. Travel time $\le$ Critical urgency window (for emergency requests).
  4. Disrupted routes unavailable ($X_{i, j} = 0$).
  5. Minimum safety reserves maintained at Regional Hubs.

---

## 9. Limitations of Synthetic Data

1. **No Real Clinical Records**: The data does not capture patient-level hemovigilance reactions, rare minor red cell antigen phenotypes (e.g., Kell, Duffy, Kidd), or HLA platelet cross-matching.
2. **Simplified Traffic**: Urban traffic is modeled using distance, average speeds, and stochastic congestion factors rather than live GPS telematics.
3. **Regional Homogeneity**: The metropolitan climate assumes a tropical/subtropical seasonal cycle; adapting to other climates requires tuning `events_context.py`.
4. **Cold-Chain Sensor Telemetry**: Temperature logs during transport are assumed within standard tolerances unless flagged as a route disruption.
