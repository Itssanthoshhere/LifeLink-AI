# LifeLink AI — REST API Documentation
## A Plain-English and Technical Guide to All 12 Backend Endpoints

> **"What is an API? Think of an API (Application Programming Interface) as a waiter in a restaurant. The web dashboard sits at the table and looks at the menu. When the user clicks a button, the dashboard asks the waiter (the API) to go to the kitchen (the Python backend) and bring back the requested information as a structured JSON message."**

---

## 1. API Architecture & Server Configuration

* **Backend Framework**: Python 3.12 with **FastAPI**
* **Server Command**: `python -m uvicorn api:app --app-dir src --host 127.0.0.1 --port 8000`
* **Base URL**: `http://127.0.0.1:8000`
* **Data Format**: `application/json` (UTF-8 encoded)
* **CORS Middleware**: Enabled with wildcard origin support (`*`) allowing communication with the Next.js frontend running on port 3000.
* **Performance Caching**: High-speed in-memory caching stores computed optimization results keyed by `(date, horizon, scenario)` to deliver sub-100ms response times for repeated user queries.

---

## 2. The 12 RESTful Endpoints

```
                                      FASTAPI ENDPOINTS MAP
                                                │
         ┌───────────────────────────────┬──────┴────────────────────────┬───────────────────────────────┐
         ▼                               ▼                               ▼                               ▼
 [ System & Core ]               [ Logistics ]                   [ Single Facility ]             [ Operations ]
 /api/health                     /api/shortages                  /api/hospital/{id}              /api/scenarios
 /api/command-center             /api/inventory                  /api/donors                     /api/scenarios/{id}
 /api/network                    /api/optimization                                               /api/analytics
                                                                                                 /api/optimize (POST)
```

---

### Endpoint 1: System Health Probe
* **Route**: `GET /api/health`
* **Simple Explanation**: The dashboard uses this endpoint to check if the Python backend is awake and if all four AI and optimization engines are loaded into memory.
* **Query Parameters**: None
* **Sample Response**:
```json
{
  "status": "healthy",
  "service": "AI Blood Supply Command Center API",
  "version": "1.0.0",
  "backend_ready": true,
  "subsystems": {
    "model_1_demand_forecasting": "loaded",
    "model_2_shortage_prediction": "loaded",
    "model_3_donor_ranking": "loaded",
    "engine_4_optimization": "loaded"
  }
}
```

---

### Endpoint 2: Master Command Center Intelligence Feed
* **Route**: `GET /api/command-center`
* **Simple Explanation**: The central endpoint that returns the complete operational picture for a selected date, horizon, and scenario. It executes the entire 4-stage pipeline in one call.
* **Query Parameters**:
  - `date` (string, optional, default: `"2025-12-01"`): Operational evaluation date.
  - `horizon` (int, optional, default: `72`): Planning horizon in hours (`24`, `48`, or `72`).
  - `scenario` (string, optional, default: `"normal"`): Target operational scenario.
* **Sample Response**:
```json
{
  "status": "success",
  "date": "2025-12-01",
  "horizon": 72,
  "scenario": "normal",
  "network_summary": { "hospitals": 30, "blood_banks": 10 },
  "shortage_alerts": [ ... ],
  "transfer_recommendations": [ ... ],
  "donor_recommendations": [ ... ],
  "explanations": [ ... ]
}
```

---

### Endpoint 3: Granular Shortage Early Warnings
* **Route**: `GET /api/shortages`
* **Simple Explanation**: Returns the list of all facilities and blood products predicted to experience a shortage, complete with risk probabilities and urgency tiers.
* **Query Parameters**:
  - `horizon` (int, default: `72`): Time window in hours.
  - `risk_level` (string, default: `"all"`): Filter by tier (`"critical"`, `"high"`, `"medium"`, `"all"`).
* **Sample Response**:
```json
{
  "total_alerts": 74,
  "critical_count": 12,
  "high_count": 28,
  "alerts": [
    {
      "hospital_id": "HOSP_007",
      "hospital_name": "Valley Trauma Center",
      "blood_group": "O_NEG",
      "component": "RBC",
      "current_stock": 17,
      "forecasted_demand": 2.65,
      "shortage_probability": 0.784,
      "risk_level": "CRITICAL"
    }
  ]
}
```

---

### Endpoint 4: Regional Inventory Audit
* **Route**: `GET /api/inventory`
* **Simple Explanation**: The dashboard uses this endpoint to display total stock levels across all 32 product categories, tracking which blood bags are nearing their expiration date.
* **Query Parameters**: None
* **Sample Response**:
```json
{
  "summary": { "total_units": 8420, "expiring_within_48h": 222 },
  "by_blood_group": { "O_NEG": 512, "O_POS": 2140, "A_POS": 1820, ... },
  "by_component": { "RBC": 4120, "Platelets": 980, "Plasma": 2340, "Whole_Blood": 980 }
}
```

---

### Endpoint 5: Network Topology & Transit Corridors
* **Route**: `GET /api/network`
* **Simple Explanation**: Provides the geographic GPS coordinates of all 40 hospitals and blood banks, along with the 646 road delivery routes connecting them.
* **Query Parameters**: None
* **Sample Response**:
```json
{
  "nodes": [
    { "id": "HOSP_001", "name": "City Memorial Hospital", "lat": 12.9716, "lon": 77.5946, "type": "hospital" }
  ],
  "routes": [
    { "source": "HOSP_001", "destination": "HOSP_007", "distance_km": 8.4, "travel_time_min": 14.4, "is_active": true }
  ]
}
```

---

### Endpoint 6: Donor Candidate Outreach
* **Route**: `GET /api/donors`
* **Simple Explanation**: Retrieves the ranked list of volunteer blood donors generated by Model 3 for a specific hospital emergency.
* **Query Parameters**:
  - `hospital_id` (string, required, e.g., `"HOSP_007"`): Requesting facility.
  - `blood_group` (string, required, e.g., `"O_NEG"`): Needed blood group.
  - `component` (string, default: `"RBC"`): Needed component.
  - `urgency` (string, default: `"emergency"`): Urgency tier (`"routine"`, `"urgent"`, `"emergency"`).
* **Sample Response**:
```json
{
  "total_mobilizations": 10,
  "recommendations": [
    {
      "rank": 1,
      "donor_id": "DONOR_01421",
      "distance_km": 3.99,
      "travel_time_min": 11.4,
      "priority_score": 69.5,
      "priority_tier": "CRITICAL",
      "availability": "Available"
    }
  ]
}
```

---

### Endpoint 7: Global Optimization Results
* **Route**: `GET /api/optimization`
* **Simple Explanation**: Returns the courier transshipment schedule and constraint-based rationales computed by Engine 4.
* **Query Parameters**:
  - `scenario` (string, default: `"normal"`): Target scenario.
* **Sample Response**:
```json
{
  "solver_status": "OPTIMAL",
  "solve_time_seconds": 2.18,
  "network_metrics": {
    "units_transferred": 1389,
    "shortages_resolved": 677,
    "near_expiry_rescued": 222
  },
  "transfers": [
    {
      "source": "HOSP_005",
      "destination": "HOSP_007",
      "units": 2,
      "blood_group": "O_NEG",
      "component": "RBC",
      "eta_minutes": 4.1
    }
  ]
}
```

---

### Endpoint 8: Single Hospital Intelligence Deep-Dive
* **Route**: `GET /api/hospital/{hospital_id}`
* **Simple Explanation**: Powers the slide-over Hospital Intelligence Drawer. When you click on any hospital on the dashboard, it calls this endpoint to get all details for that single facility.
* **Path Parameters**:
  - `hospital_id` (string, e.g., `"HOSP_007"`): Hospital identifier.
* **Sample Response**:
```json
{
  "hospital_id": "HOSP_007",
  "name": "Valley Trauma Center",
  "city": "Metro Metropolis",
  "type": "Tier-1 Trauma Center",
  "inventory": [ ... ],
  "forecasts": { "24h_units": 0.86, "48h_units": 0.95, "72h_units": 0.84 },
  "active_shortages": [ ... ]
}
```

---

### Endpoint 9: Catalog of Stress-Test Scenarios
* **Route**: `GET /api/scenarios`
* **Simple Explanation**: Lists all 9 operational crisis scenarios available in the simulation lab.
* **Query Parameters**: None
* **Sample Response**:
```json
{
  "scenarios": [
    { "id": "normal", "name": "Normal Operations", "description": "Standard baseline operational demands" },
    { "id": "mass_casualty", "name": "Mass Casualty", "description": "Surge in emergency trauma admissions" },
    { "id": "cooling_failure", "name": "Cooling Failure", "description": "Refrigeration breakdown at Central Blood Bank 1" }
  ]
}
```

---

### Endpoint 10: Single Scenario Comparison
* **Route**: `GET /api/scenarios/{scenario_id}`
* **Simple Explanation**: Compares network metrics before and after optimization for a specific simulated disaster.
* **Path Parameters**:
  - `scenario_id` (string, e.g., `"mass_casualty"`): Target scenario ID.

---

### Endpoint 11: Empirical Analytics & Model Validation
* **Route**: `GET /api/analytics`
* **Simple Explanation**: Returns scientific benchmark metrics (MAE, RMSE, ROC-AUC, Brier score, and solve times) for technical evaluators.
* **Query Parameters**: None
* **Sample Response**:
```json
{
  "model_1_demand": { "mae_24h": 1.209, "rmse_24h": 2.417, "r2_24h": 0.459 },
  "model_2_shortage": { "roc_auc_24h": 0.849, "pr_auc_24h": 0.192, "brier_24h": 0.0356 },
  "engine_4_optimization": { "avg_solve_time_sec": 2.18, "compliance_pct": 100.0 }
}
```

---

### Endpoint 12: Dynamic On-Demand Optimization
* **Route**: `POST /api/optimize`
* **Simple Explanation**: Allows the dashboard to request a fresh, dynamic optimization run with custom parameters (e.g., closing specific roads or adding unexpected emergency demand).
* **Request Body (JSON)**:
```json
{
  "scenario": "mass_casualty",
  "horizon": 72,
  "date": "2025-12-01",
  "disrupted_routes": ["RT-014", "RT-022"]
}
```
* **Sample Response**: Full optimization solution dictionary containing newly routed transfer orders and donor schedules.
