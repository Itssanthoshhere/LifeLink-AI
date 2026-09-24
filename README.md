<div align="center">

# LifeLink AI — AI Blood Supply Command Center

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Command_Center-crimson?style=for-the-badge&logo=vercel)](https://life-link-ai-mu.vercel.app/)

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat-square&logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Google OR-Tools](https://img.shields.io/badge/OR--Tools-9.6+-4285F4.svg?style=flat-square&logo=google)](https://developers.google.com/optimization)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0+-FF6F00.svg?style=flat-square)](https://xgboost.readthedocs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

> **IMPORTANT CLINICAL DISCLAIMER**:
> All outputs produced by LifeLink AI are operational decision-support recommendations. They require qualified healthcare and blood-bank professional verification prior to execution. All dataset records in this repository are **strictly synthetic** and contain zero Personally Identifiable Information (PII) or real clinical records.

---

## 1. Executive Summary & Problem Statement

Healthcare networks face severe operational friction when managing blood supply chains:
- **Imminent Shortages**: Sudden emergency trauma surges or seasonal disease outbreaks (e.g. monsoon dengue spikes) rapidly drain critical $O^-$ universal donor reserves.
- **Perishability & Waste**: Platelets expire in 5 days at room temperature, leading to preventable spoilage when surplus stock is isolated at non-trauma facilities.
- **Logistics Fragmentation**: Transshipment routes between blood bank hubs and regional hospitals are often coordinated manually without mathematical optimization.

**LifeLink AI** bridges Machine Learning, Mathematical Operations Research (MILP), and a Command Center Dashboard to:
1. **Forecast Demand** (24h, 48h, 72h) across 960 time-series streams.
2. **Predict Imminent Shortages** using calibrated early-warning classifiers.
3. **Rank & Mobilize Eligible Donors** based on ABO/Rh compatibility, spatial proximity, and response yield.
4. **Optimize Inter-Hospital Transshipment** using Mixed-Integer Linear Programming (MILP) with First-Expired, First-Out (FEFO) rescue prioritization.

---

## 2. Platform Architecture & Data Flow

```text
               ┌─────────────────────────────────────────────────────────┐
               │  730-Day Synthetic Dataset Generator (generate_all.py)  │
               │    30 Hospitals • 10 Blood Banks • 5,000 Donors         │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │  data/raw/*.csv Datasets │
                               └────────────┬────────────┘
                                            │
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │             FastAPI Backend Server (src/api.py)          │
               │   Exposes /api/command-center, /api/hospital, etc.       │
               └──────┬──────────────────────┬────────────────────┬──────┘
                      │                      │                    │
                      ▼                      ▼                    ▼
           ┌────────────────────┐  ┌───────────────────┐  ┌──────────────────┐
           │ Model 1: Demand    │  │ Model 2: Shortage │  │ Model 3: Donor   │
           │ Forecast (XGBoost) │  │ Warning (Classifier) │ Matcher (Ranker) │
           └──────────┬─────────┘  └─────────┬─────────┘  └────────┬─────────┘
                      │                      │                    │
                      └──────────────────────┼────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │ Engine 4: OR-Tools MILP   │
                               │ Transshipment Optimizer   │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
               ┌─────────────────────────────────────────────────────────┐
               │            Next.js 14 Command Center Dashboard           │
               │      Interactive Network Map • Scrubber • Manifests     │
               └─────────────────────────────────────────────────────────┘
```

---

## 3. High-Impact Dashboard Features

### 🗺️ Interactive Regional Corridor Network Map
- **Multi-Layer Toggle Filters**: Toggle visibility of Critical, High Risk, Nominal hospitals, Blood Bank hubs, and Transfer Arcs.
- **Live Facility & Route Count Badges**: Real-time counter pills showing facility counts in each risk tier (`Critical [3]`, `High Risk [5]`, `Nominal [30]`, `Blood Banks [10]`, `Transfers [596]`).
- **Directional Supply Flow Particles**: Animated SVG flow markers moving along active transfer routes from Source Hub ➔ Target Hospital.
- **Floating Controls Toolbar**: Zoom controls, **Compass (Orient North & Reset Camera View)** button, **Radio Beacon Radar Toggle** button, and **Web Audio API Sound Ping Alert Toggle** button.

### ⏱️ 72-Hour Forecast Horizon Scrubber
- Interactive timeline scrubber with **Play/Pause**, **Speed Multipliers (`1x`, `2x`, `5x`)**, and **Step Forward/Back** buttons.
- Dynamically updates map network state, inventory runway indicators, and shortage alerts in real time across 24h, 48h, and 72h horizons.

### ⌨️ Command Palette (`⌘K` / `Ctrl+K`)
- Searchable modal overlay indexing all 30 hospitals, 10 blood banks, active shortage alerts, and navigation views for instant fuzzy lookup and keyboard-driven navigation.

### 📋 Dispatch Manifest Export & Chain-of-Custody Slips
- Multi-format exporter supporting:
  - 📄 **Printable PDF Document**: Official A4 manifest complete with allocation tables, header metadata, and **Dual Signature Authorization Boxes** (Origin Officer Dispatch Signature & Destination Clinician Acceptance Signature). Automatically opens native browser print / "Save as PDF" dialog (`window.print()`).
  - 📝 **Chain-of-Custody ASCII Text Slips**: Text slips with signature placeholders, temperature verification, and seal intact checkboxes.
  - 📊 **CSV Spreadsheet**: Structured tabular export for supply chain logistics teams.
  - 💻 **JSON Data**: Structured JSON payload for API integration.

### 🧠 AI Decision Inspector & MILP Sensitivity Stress-Tester
- **MILP Objective Function Breakdown**: Displays mathematical penalty formulations ($\min \sum C_{\text{trans}} \cdot d + \sum P_{\text{shortage}} \cdot S + \sum P_{\text{expiry}} \cdot E$).
- **Rejected Counterfactual Analysis**: Explains why alternative candidate routes were rejected during solver optimization (e.g. cold-chain threshold violation, safety buffer drop).
- **Interactive Sensitivity Sliders**: Real-time stress-testing controls for **Traffic Congestion Multiplier**, **Transit Delay (+mins)**, and **Cold-Chain Temperature Anomaly (+°C)**.

### 🔗 Next.js App Router & Deep-Link URL Navigation
- Synchronizes current view state seamlessly with browser location history:
  - `/overview` ➔ Command Center Dashboard
  - `/shortages` ➔ Critical Shortage Early-Warning Matrix
  - `/inventory` ➔ Regional Inventory Breakdown
  - `/network` ➔ Geospatial Network Topology & Map
  - `/donors` ➔ Donor Callout Dispatch
  - `/optimization` ➔ MILP Transshipment Engine
  - `/scenarios` ➔ 9-Scenario Stress Tests
  - `/analytics` ➔ Regional Performance Benchmarks
  - `/manifests` ➔ Dispatch Manifest Export Modal
  - `/facility/[id]` ➔ Deep-link single facility intelligence drawer (e.g., `/facility/HOSP_003`)

---

## 4. Machine Learning & Optimization Engine Specifications

### Model 1 — Demand Forecasting Engine (XGBoost Regressors)
- **Objective**: Predict 24h, 48h, and 72h blood units demanded per hospital, blood group, and component.
- **Granularity**: 960 daily time series (30 hospitals $\times$ 8 blood groups $\times$ 4 components).
- **Benchmark Performance**:
  - XGBoost 24h Forecast MAE: **1.209** | WAPE: **95.1%** | $R^2$: **0.459** (vs Lag-1 baseline MAE 1.461).

### Model 2 — Shortage Early-Warning Classifier (Calibrated XGBoost)
- **Objective**: Predict whether a hospital will experience an unfulfilled shortage in the next 24h, 48h, or 72h.
- **Calibration**: Isotonic Regression probability calibration.
- **Benchmark Performance**:
  - XGBoost 72h Classifier: **ROC-AUC 0.862** | **PR-AUC 0.374** | **Recall 64.9%** (vs Rule-based baseline ROC-AUC 0.525).

### Model 3 — Intelligent Donor Matching & Ranking
- **Objective**: When a rare blood group deficit occurs, rank candidate donors.
- **Features**: Blood group compatibility, Haversine distance, donor response yield probability, availability, and 90-day donation interval eligibility.

### Engine 4 — Mathematical Network Optimization (Google OR-Tools / MILP)
- **Decision Variables**: $X_{i, j, b, c, t}$ = units of blood group $b$, component $c$ transferred from source $i$ to destination $j$ on day $t$.
- **Objective Function**:
  $$\min \sum (C_{\text{trans}} \cdot d_{ij} \cdot x_{ij}) + \sum (P_{\text{shortage}} \cdot S_k) + \sum (P_{\text{expiry}} \cdot E_i) - \sum (W_{\text{fefo}} \cdot R_{ij})$$
- **Hard Constraints**:
  1. Transfer quantity $\le$ Source available batch inventory.
  2. Total units per vehicle $\le$ Transport container capacity.
  3. Travel time $\le$ Critical urgency window (for emergency requests).
  4. Disrupted routes unavailable ($X_{i, j} = 0$).
  5. Minimum safety reserves maintained at Regional Hubs.

---

## 5. Clinical Rules & Compatibility Engine

### Component Storage Rules & Shelf Lives
- **Packed Red Blood Cells (RBC)**: 42 days (refrigerated 1–6 °C in CPDA-1 additive solution)
- **Platelets**: 5 days (room temp 20–24 °C under continuous agitation — highest perishability risk!)
- **Fresh Frozen Plasma (FFP)**: 365 days (frozen $\le -18$ °C)
- **Whole Blood**: 35 days (refrigerated 1–6 °C)

### ABO/Rh Transfusion Compatibility Matrix

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

---

## 6. Directory Structure

```text
LifeLink-AI/
├── backend/
│   ├── api/
│   │   └── index.py                    # Vercel Serverless Function entrypoint
│   ├── data/
│   │   ├── raw/                        # 9 connected synthetic datasets (CSVs)
│   │   └── dataset_summary.json        # Machine-readable summary metrics & metadata
│   ├── docs/                           # Academic & architecture documentation
│   ├── models/                         # Trained XGBoost models (.pkl)
│   ├── notebooks/                      # Exploration & evaluation Jupyter notebooks
│   ├── reports/                        # Model evaluation & audit reports
│   ├── src/
│   │   ├── api.py                      # FastAPI Backend Server & REST endpoints
│   │   ├── blood_compatibility.py       # Clinical compatibility matrices
│   │   ├── command_center.py           # Core payload builder & model aggregator
│   │   ├── config.py                   # Central hyperparameters & shelf life rules
│   │   ├── donor_ranker.py             # Model 3 donor matching engine
│   │   ├── generate_all.py             # Chronological dataset generator (730 days)
│   │   ├── optimization_explainer.py   # Rationale & counterfactual explainer
│   │   ├── optimization_model.py       # Engine 4 Google OR-Tools MILP solver
│   │   ├── predict_demand.py           # Model 1 demand forecasting script
│   │   ├── predict_donors.py           # Model 3 donor ranking script
│   │   ├── predict_shortage.py         # Model 2 shortage classifier script
│   │   └── validation.py               # Automated 12-suite validation checker
│   ├── tests/                          # Pytest integration tests
│   ├── pyproject.toml                  # Vercel FastAPI deployment configuration
│   ├── requirements.txt                # Python dependencies
│   └── vercel.json                     # Vercel build mapping configuration
│
└── frontend/
    ├── public/
    │   ├── logo.png                    # LifeLink AI emblem logo
    │   └── favicon.ico
    ├── src/
    │   ├── app/
    │   │   ├── [view]/page.tsx          # Dynamic route handler (/shortages, /inventory, etc.)
    │   │   ├── facility/[id]/page.tsx   # Facility deep link route handler
    │   │   ├── manifests/page.tsx       # Manifest export route handler
    │   │   ├── globals.css              # Global styles & micro-animations
    │   │   ├── layout.tsx               # App layout & Google Fonts configuration
    │   │   └── page.tsx                 # Main Command Center page
    │   ├── components/
    │   │   ├── views/                   # 8 specialized dashboard views
    │   │   │   ├── AnalyticsView.tsx
    │   │   │   ├── DonorsView.tsx
    │   │   │   ├── InventoryView.tsx
    │   │   │   ├── NetworkView.tsx
    │   │   │   ├── OptimizationView.tsx
    │   │   │   ├── OverviewView.tsx
    │   │   │   ├── ScenariosView.tsx
    │   │   │   └── ShortagesView.tsx
    │   │   ├── CommandPalette.tsx       # ⌘K Searchable modal component
    │   │   ├── DecisionExplainerModal.tsx # MILP Audit & Stress-Test modal
    │   │   ├── DispatchManifest.tsx     # Manifest & PDF print exporter
    │   │   ├── Header.tsx               # Top command header & scenario selector
    │   │   ├── HorizonScrubber.tsx      # 72-Hour forecast horizon playback scrubber
    │   │   ├── HospitalDrawer.tsx       # Facility intelligence slide-over drawer
    │   │   ├── NetworkMap.tsx           # Interactive canvas map with controls & legend
    │   │   └── Sidebar.tsx              # Navigation sidebar
    │   ├── lib/
    │   │   ├── apiClient.ts             # FastAPI bridge client & mock fallbacks
    │   │   └── mockData.ts              # Reliable fallback snapshot data
    │   └── types/
    │       └── commandCenter.ts         # TypeScript schema definitions
    ├── package.json
    └── tailwind.config.ts               # Tailwind CSS color system & theme extensions
```

---

## 7. Local Setup & Quickstart Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10.0 or higher

### Step 1: Clone Repository
```bash
git clone https://github.com/Itssanthoshhere/LifeLink-AI.git
cd LifeLink-AI
```

### Step 2: Set Up Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3: Run Backend Data Generator & Validation
```bash
# Regenerate full 730-day dataset (~35s)
python src/generate_all.py

# Run validation checks (100% PASS)
python src/validation.py

# Run unit tests
pytest tests/ -v
```

### Step 4: Start FastAPI Backend Server
```bash
python src/api.py
```
*The FastAPI server will start at `http://localhost:8000`. You can inspect interactive API documentation at `http://localhost:8000/docs`.*

### Step 5: Set Up & Launch Frontend Dashboard
Open a new terminal window:
```bash
cd LifeLink-AI/frontend
npm install
npm run dev
```
*Open `http://localhost:3000` in your browser to view the Command Center.*

---

## 8. API Reference Summary

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/command-center` | `GET` | Master unified payload containing metrics, alerts, transfers, and donor recommendations |
| `/api/shortages` | `GET` | Granular hospital shortage risk matrix across 8 blood groups and 4 components |
| `/api/inventory` | `GET` | Regional inventory breakdown by facility, shelf life, and expiration pressure |
| `/api/network` | `GET` | Geospatial network topology (40 nodes, transit routes, and disruption flags) |
| `/api/donors` | `GET` | Ranked candidate donor mobilization callout lists (Model 3 output) |
| `/api/optimization` | `GET` | MILP transshipment allocations, metrics, and decision rationale (Engine 4 output) |
| `/api/hospital/{hospital_id}` | `GET` | Deep-dive intelligence for a single facility |
| `/api/scenarios` | `GET` | 9 operational stress test simulation evaluations |
| `/api/analytics` | `GET` | Comparative benchmarks for Models 1–3 and Engine 4 |
| `/api/optimize` | `POST` | Execute custom optimization scenario with custom weights |

---

## 9. Deployment Guide (Vercel)

### Frontend (Next.js)
1. Import repository `LifeLink-AI` on Vercel.
2. Set root directory to `frontend`.
3. Build command: `npm run build`, Framework Preset: `Next.js`.

### Backend (FastAPI Python)
1. Import repository `LifeLink-AI` on Vercel.
2. Set root directory to `backend`.
3. Vercel automatically detects `backend/pyproject.toml` and `backend/vercel.json` pointing to `src/api.py`.

---

## 10. License

This project is open-source software licensed under the **[MIT License](LICENSE)**.
