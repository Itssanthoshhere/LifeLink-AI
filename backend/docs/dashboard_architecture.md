# AI Blood Supply Command Center — Operations Dashboard Architecture

## 1. System Overview & Purpose

The **AI Blood Supply Command Center Operations Dashboard** is an enterprise-grade, dark-themed operations management interface designed for regional healthcare logistics coordinators, transfusion medical officers, and blood bank directors.

Rather than acting as an administrative database viewer, the system functions as a real-time **Operations Command Center** providing automated intelligence, predictive early warnings, targeted donor mobilization queues, and mathematical transshipment schedules across a 40-node healthcare supply chain (30 hospitals and 10 regional blood banks).

```
+---------------------------------------------------------------------------------------+
|                                    COMMAND CENTER UI                                  |
|  [Header: Scenario, Horizon, Date, Live Badge]  |  [Sidebar: 8 Ops Navigation Views]  |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                        UNIFIED FASTAPI BRIDGE (src/api.py)                            |
|             CORS-enabled RESTful endpoints & in-memory optimization caching           |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                    MASTER INTELLIGENCE ORCHESTRATOR (command_center.py)               |
+---------------------------------------------------------------------------------------+
        |                        |                        |                       |
        v                        v                        v                       v
+----------------+      +----------------+      +----------------+      +----------------+
|    MODEL 1     |      |    MODEL 2     |      |    MODEL 3     |      |    ENGINE 4    |
| Demand Forecast|      | Shortage Early |      | Donor Ranking  |      | MILP Transship |
| (XGBoost Reg)  |      | Warning (XGB)  |      | (MCDA Engine)  |      | (OR-Tools CBC) |
+----------------+      +----------------+      +----------------+      +----------------+
```

---

## 2. Frontend Architecture (Next.js, TypeScript, Tailwind CSS)

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict typing enabled, 1-to-1 parity with backend schemas)
- **Styling**: Tailwind CSS with custom mission-control design tokens (`#0B0F17` background, `#111827` surface panels, `#202E42` borders)
- **Icons & Visuals**: `lucide-react` crisp vector icons, custom scalable vector graphics (SVG) geospatial network canvas
- **Data Resilience**: Dual-mode data fetching (`fetchCommandCenter`) with zero-latency live API query and automatic graceful fallback to verified mock snapshots

### Component Hierarchy
```
frontend/src/
├── app/
│   ├── layout.tsx                # Dark root wrapper with metadata
│   ├── page.tsx                  # Master state orchestrator (nav, scenarios, drawer)
│   └── globals.css               # Ops styling, custom dark scrollbar, radar pulses
├── components/
│   ├── Sidebar.tsx               # 8-item navigation, logo, operational status
│   ├── Header.tsx                # Date, 24/48/72h horizon, 9 scenarios, Demo Mode
│   ├── IntelligenceChain.tsx     # Visual story banner (Demand -> Risk -> Donors -> Opt -> Action)
│   ├── NetworkMap.tsx            # Interactive geospatial SVG map with nodes & route flows
│   ├── HospitalDrawer.tsx        # Slide-over deep-dive modal for single-facility intelligence
│   └── views/
│       ├── OverviewView.tsx      # Main ops dashboard (6 KPIs, map, feed, recommendations)
│       ├── ShortagesView.tsx     # Sortable & filterable early warning matrix
│       ├── InventoryView.tsx     # Multi-echelon stock audit, blood group & component charts
│       ├── NetworkView.tsx       # 40-node directory, 646 corridors, disruption table
│       ├── DonorsView.tsx        # Active donor mobilization & ranked candidates
│       ├── OptimizationView.tsx  # Engine 4 MILP metrics, transfer orders, constraint rationales
│       ├── ScenariosView.tsx     # 9-scenario stress simulator with before/after comparisons
│       └── AnalyticsView.tsx     # Empirical validation telemetry across Models 1–4
├── lib/
│   ├── apiClient.ts              # FastAPI fetch wrapper with connection state detection
│   └── mockData.ts               # Complete fallback dataset conforming to API contracts
└── types/
    └── commandCenter.ts          # Strongly typed domain entities & API payloads
```

---

## 3. Backend Architecture & API Contracts (`src/api.py`)

The backend microservice is built using **FastAPI** with in-memory execution caching for instant tab switching:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | GET | Health probe verifying all 4 intelligence subsystems are loaded. |
| `/api/command-center` | GET | Master unified intelligence payload for a specified date, horizon, and scenario. |
| `/api/shortages` | GET | Granular shortage alerts filterable by risk tier, blood group, and hospital. |
| `/api/inventory` | GET | Facility-level inventory, safety reserves, expiring batches, and utilization. |
| `/api/network` | GET | Geospatial node coordinates (30 hospitals, 10 blood banks) and transport routes. |
| `/api/donors` | GET | Model 3 candidate mobilization queues and MCDA score rankings. |
| `/api/optimization` | GET | Engine 4 transfer schedule, decision mix, and constraint-grounded rationales. |
| `/api/hospital/{id}` | GET | Comprehensive single-hospital intelligence payload for the detail drawer. |
| `/api/scenarios` | GET | Catalog of all 9 predefined operational stress test scenarios. |
| `/api/scenarios/{id}`| GET | Before vs. after optimization comparative metrics for a scenario. |
| `/api/analytics` | GET | Empirical accuracy and latency benchmarks for Models 1–3 and Engine 4. |
| `/api/optimize` | POST | Dynamic custom optimization supporting ad-hoc route disruptions and emergency surges. |

---

## 4. End-to-End Intelligence Integration

The Command Center orchestrates four distinct mathematical and statistical models into an automated decision loop:

### 1. Model 1 — Demand Forecasting
- **Mechanism**: Multi-horizon gradient boosted regression (`models/demand_xgb_{24h,48h,72h}.pkl`).
- **Role in Dashboard**: Provides baseline unit expectations ($d_{h,b,c}$) for each hospital, blood group, and component across 24h, 48h, and 72h horizons. Displayed in the Hospital Intelligence drawer as a demand trajectory.

### 2. Model 2 — Shortage Early Warning
- **Mechanism**: Isotonically calibrated probabilistic classification (`models/shortage_xgb_{24h,48h,72h}.pkl`).
- **Role in Dashboard**: Flags impending deficits before clinical stockouts occur. Categorizes demands into `CRITICAL` ($p \ge 0.85$ or emergency), `HIGH` ($p \ge 0.60$), `MEDIUM`, and `LOW`. Directly scales the penalty weight ($P_{h,b,c}$) in Engine 4.

### 3. Model 3 — Intelligent Donor Ranking & Dispatch
- **Mechanism**: Multi-Criteria Decision Analysis (MCDA) in `src/donor_ranker.py`.
- **Role in Dashboard**: When a critical shortage is flagged, screens synthetic donor rosters for universal/exact ABO/Rh compatibility, inter-donation eligibility ($\ge 90$ days), medical clearance, and Haversine proximity. Ranks candidates and displays outreach priority tiers (`P1_Immediate`, `P2_High`, `P3_Standard`). Never discloses real PII.

### 4. Engine 4 — Supply Network Optimization & Inter-Facility Transshipment
- **Mechanism**: Google OR-Tools Mixed-Integer Linear Program (MILP) in `src/optimization_model.py`.
- **Role in Dashboard**: Solves multi-commodity network flow balancing inventory conservation, source safety reserves ($\max(0, \text{current} - \text{reserve})$), route travel capacities, and First-Expired First-Out (FEFO) negative cost rebates. Output is transformed into dispatch orders and plain-English constraint rationales.

---

## 5. Visual Intelligence Story: The 5-Step Chain

The dashboard emphasizes a transparent, traceable decision sequence:

```
[01 DEMAND]       --> What will we need?        (Model 1 Forecast)
      |
[02 RISK]         --> Where will shortages be?  (Model 2 Early Warning)
      |
[03 DONORS]       --> Who can help locally?     (Model 3 Candidate Pool)
      |
[04 OPTIMIZATION] --> Where should stock move?  (Engine 4 MILP Transshipment)
      |
[05 ACTION]       --> What do we recommend?     (Command Center Dispatch Board)
```

---

## 6. One-Click Demo Mode Workflow

To enable instant presentation in clinical, logistical, or academic reviews, the dashboard features a prominent **DEMO MODE** button:
1. **Trigger**: Clicking `DEMO MODE` in the top header.
2. **Scenario Loaded**: Switches scenario to **Major Mass Casualty Incident** and planning horizon to **72 Hours**.
3. **Target Node Activated**: Automatically selects `HOSP_007` (Valley Trauma Center) under acute trauma conditions for `O_NEG RBC`.
4. **End-to-End Chain Exposed**:
   - Model 1 projects acute trauma surge (+45 units O_NEG RBC).
   - Model 2 triggers **CRITICAL (96.2%) Shortage Alert**.
   - Model 3 displays top ranked compatible donors (`DONOR_01421`, `DONOR_00889`, `DONOR_02150`).
   - Engine 4 recommends dispatching 12 units from `BB_003` (City Health Authority) via route `RT_00067` (ETA: 32.5 min), rescuing 4 FEFO near-expiry units.
   - Hospital Intelligence drawer slides open displaying the full facility diagnostic and plain-English solver explanation.

---

## 7. Safety, Clinical Boundaries & Medical Disclaimers

> [!CAUTION]
> **DECISION SUPPORT SYSTEM — NOT A CLINICAL DIRECTIVE**
> - The AI Blood Supply Command Center is an operational supply-chain decision support prototype built with synthetic simulation data.
> - Recommendations generated by Engine 4 (transfers) and Model 3 (donor mobilization) are logistical suggestions.
> - They do NOT constitute automated clinical orders.
> - All blood product transfers, compatibility cross-matches, and outreach calls require verified human authorization by qualified blood-bank technologists and transfusion medicine specialists.
> - Mandatory disclaimers are persistently displayed on the global footer, API responses, and the hospital intelligence drawer.
