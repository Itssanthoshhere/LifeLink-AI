# LifeLink AI — Operations Dashboard User Guide
## A Complete Non-Technical Guide to Navigating the Command Center

> **"This guide walks you through every screen, card, button, and chart on the LifeLink AI dashboard as if you were sitting down at the console for your very first day as a regional logistics officer."**

---

## 🖥️ Top Navigation & Master Controls (Header)

Across the very top of every screen sits the **Mission Control Header**:

```
+-------------------------------------------------------------------------------------------------------+
| [LifeLink AI Logo] | [Date: 2025-12-01] | [Horizon: 24h|48h|72h] | [Scenario: Normal] | [Demo Mode] |
+-------------------------------------------------------------------------------------------------------+
```

1. **System Health Badge (`LIVE BACKEND` vs `DEMO DATA`)**:
   - **Green `LIVE BACKEND`**: Indicates the dashboard is communicating with the live Python FastAPI service on port 8000. All numbers are being calculated in real time.
   - **Amber `DEMO DATA`**: Indicates the backend server is offline. The dashboard automatically switches to verified offline fallback snapshots so you can still explore the interface.
2. **Snapshot Date Selector**: Sets the operational date (default: `2025-12-01`).
3. **Planning Horizon Toggle (`24h` / `48h` / `72h`)**:
   - Switches the intelligence timeframe. Selecting `24h` shows immediate critical crises; selecting `72h` looks ahead three full days to plan weekend operations.
4. **Scenario Dropdown**: Allows instant switching between 9 stress-test scenarios (e.g., *Mass Casualty*, *Dengue Platelet Surge*, *Cooling Failure*).
5. **One-Click Demo Mode Button**: Automatically triggers a simulated highway mass-casualty emergency, focuses on Valley Trauma Center, and opens the Hospital Intelligence Drawer.

---

## 1. Overview Page — "What Is Happening Right Now?"

**Purpose**: The central mission-control landing view summarizing regional health at a single glance.

### What You See on Screen:
1. **The Intelligence Chain Banner**:
   - A visual banner showing the five stages: *Demand Forecasting $\to$ Shortage Risk $\to$ Donor Matching $\to$ Supply Optimization $\to$ Dispatch*.
2. **Six High-Level KPI Metric Cards**:
   - **Active Network Facilities**: Total operational nodes (30 Hospitals + 10 Blood Banks = 40 facilities).
   - **Predicted Shortages**: Total product lines predicted to drop into critical deficit within the selected horizon.
   - **Recommended Transfers**: Number of courier shipments calculated by the optimization engine.
   - **Donor Mobilization Queue**: Number of volunteer donor candidates selected for outreach.
   - **Safety Reserve Compliance**: Percentage of facilities maintaining their mandatory emergency safety reserve floor (Target: 100%).
   - **Near-Expiry Units Rescued**: Units nearing their shelf-life limit scheduled for immediate First-Expire, First-Out (FEFO) transfer to high-volume trauma centers.
3. **Geospatial Network Map**:
   - An interactive map showing all 40 facilities. Red glowing rings indicate facilities with active shortage warnings; pulsing blue routes indicate active courier deliveries.
4. **Active Shortage Feed & Optimization Summary**:
   - Real-time side cards showing urgent stockout alerts and recommended courier transshipments.

---

## 2. Shortage Alerts Page — "Which Hospitals May Have Problems Soon?"

**Purpose**: A dedicated early warning matrix that flags impending blood deficits before they happen.

### Key Features:
* **Risk Tier Badges**:
  - `CRITICAL` (Red): Probability $\ge 75\%$ or active emergency. Immediate action required.
  - `HIGH` (Orange): Probability $50\% \text{ to } 74\%$. Courier transfer or donor outreach needed within 24 hours.
  - `MEDIUM` (Yellow): Probability $20\% \text{ to } 49\%$. Moderate risk; monitor stock levels.
  - `LOW` (Green): Probability $< 20\%$. Normal operations; sufficient local stock.
* **Filter Controls**: Filter the alerts by Risk Tier (`All`, `Critical Only`, `High Only`), Blood Group, or Facility Name.
* **Detailed Columns**: Shows Hospital Name, Blood Product, Current Shelf Stock, Forecasted Consumption, and Calculated Shortage Probability.
* **Click to Inspect**: Clicking any row immediately opens the **Hospital Intelligence Drawer** for that specific facility.

---

## 3. Inventory Audit Page — "Where Is Blood Available?"

**Purpose**: A comprehensive audit of all blood products currently stored across the entire metropolitan region.

### Key Features:
* **Multi-Echelon Stock Breakdown**: Shows total units stored at Central Regional Blood Banks versus Community Hospitals.
* **Blood Group Distribution Chart**: Horizontal bar charts showing inventory levels for all 8 blood types ($A^+$, $A^-$, $B^+$, $B^-$, $AB^+$, $AB^-$, $O^+$, $O^-$).
* **Component Distribution Chart**: Visualizes the balance between Red Blood Cells, Platelets, Plasma, and Whole Blood.
* **Expiry Tracking Gauge**: Flags units expiring within 24 hours, 48 hours, and 72 hours, highlighting which bags need immediate FEFO rescue.

---

## 4. Network Page — "How Are Facilities Connected?"

**Purpose**: Visualizes the physical logistics network, transit corridors, and road conditions.

### Key Features:
* **40-Node Directory**: Complete list of all 30 hospitals and 10 regional blood banks with coordinates, bed capacities, and facility classifications (Tier-1 Trauma Center, General Hospital, Clinic).
* **646 Transit Corridors**: Complete database of delivery routes with Haversine distances, road tortuosity multipliers, and estimated travel times at 35 km/h metropolitan courier speeds.
* **Route Disruption Indicator**: Shows if any transit corridors are closed due to simulated weather storms, flooding, or traffic blockages.

---

## 5. Donor Dispatch Page — "Which Donors Are Candidates?"

**Purpose**: Displays the prioritized queue of volunteer blood donors generated by Model 3.

### Key Features:
* **Donor Candidate Cards**: Displays the donor's synthetic ID (e.g., `DONOR_01421`), blood group, distance from the requesting hospital (in km), and estimated travel time.
* **Eligibility Badges**: Confirms clinical clearance (`Medical Clearance: Yes`) and inter-donation rest period (`Days Since Last Donation: 110 days` $\ge 90$).
* **Priority Score & Tier**: Displays the Multi-Criteria Decision Analysis (MCDA) score ($0 \text{ to } 100$) and priority classification (`CRITICAL`, `HIGH`, `MEDIUM`).
* **Expected Response Yield**: Estimates the probability that the donor will answer the call and agree to donate based on historical reliability.

---

## 6. Optimization Page — "What Supply Actions Are Recommended?"

**Purpose**: Shows the concrete transshipment schedule computed by Engine 4 (Google OR-Tools MILP).

### Key Features:
* **Transfer Orders Table**:
  - **Source Facility**: Where the blood will be picked up.
  - **Destination Facility**: Where the blood is needed.
  - **Blood Product & Units**: Exact integer quantity and blood type (e.g., *2 units of O_NEG RBC*).
  - **Route & Courier ETA**: Transit route corridor and estimated arrival time in minutes.
  - **FEFO Priority Tag**: Highlights whether this transfer rescues blood nearing its expiration date.
* **Constraint-Based Rationale**: Clear explanations generated by the solver explaining *why* this transfer was chosen over alternatives (e.g., *"Source maintains 14 units surplus above safety reserve floor. Preserves recipient emergency buffer."*).
* **Decision Mix Summary**: Charts showing the balance between *Transfer Only*, *Donor Mobilization Only*, and *Combined Actions*.

---

## 7. Scenarios Page — "What Happens If Something Goes Wrong?"

**Purpose**: A disaster simulation lab allowing coordinators to stress-test regional resilience.

### Available Stress Tests:
1. **Normal Operations**: Standard baseline weekday operations.
2. **Demand Spike**: Unexpected 200% surge in routine hospital demand.
3. **Mass Casualty Incident**: Multi-vehicle highway collision near Valley Trauma Center.
4. **Dengue Epidemic**: Regional platelet consumption multiplies five-fold over three weeks.
5. **O-Negative Crisis**: Region-wide scarcity of universal red blood cells.
6. **Blood Bank Cooling Failure**: Central Blood Bank 1 suffers refrigeration failure; all inventory must be evacuated immediately.
7. **Transport Disruption**: Bridge closure severs major transit corridors.
8. **Platelet Expiry Wave**: A large batch of platelets reaches its 5-day shelf life.
9. **Donor Availability Slump**: Severe weather causes 70% of volunteer donors to be unreachable.

---

## 8. Analytics Page — "How Well Did the Models Perform?"

**Purpose**: The empirical evaluation center displaying scientific benchmarks for Models 1–4.

### Key Metrics Displayed:
* **Model 1 (Demand Forecasting)**: Out-of-sample Mean Absolute Error (MAE: 1.209), Root Mean Squared Error (RMSE: 2.417), and Safe MAPE (65.6%).
* **Model 2 (Shortage Prediction)**: Receiver Operating Characteristic Area Under Curve (ROC-AUC: 0.849 to 0.862), Precision-Recall AUC (PR-AUC: 0.192 to 0.374), and Brier Calibration Score ($< 0.075$).
* **Engine 4 (Optimization)**: Average solve time (**2.18 seconds**), integer constraint compliance (100%), and safety reserve compliance (100%).

---

## 9. Hospital Intelligence Drawer — "Deep Dive into One Facility"

**Purpose**: A slide-over modal that appears whenever you click a hospital name or map node.

```
+─────────────────────────────────────────────────────────────+
| HOSPITAL INTELLIGENCE: VALLEY TRAUMA CENTER (HOSP_007)     [X]
| Facility Type: Tier-1 Trauma Center | City: Metro Metropolis|
+─────────────────────────────────────────────────────────────+
| CURRENT ON-SHELF INVENTORY (32 Product Lines)               |
| - O_NEG RBC: 17 units [Safety Reserve: 8 units]             |
| - A_POS RBC: 24 units [Safety Reserve: 10 units]            |
| ...                                                         |
+─────────────────────────────────────────────────────────────+
| ACTIVE EMERGENCY STATUS: Mass Casualty Surge                |
| Shortage Risk: CRITICAL (Probability: 78.4%)                |
+─────────────────────────────────────────────────────────────+
| RECOMMENDED INCOMING SHIPMENTS                              |
| - From Northside Teaching Hospital: 2 units O_NEG RBC       |
|   Route RT-082 | ETA: 4.1 min | FEFO Priority               |
+─────────────────────────────────────────────────────────────+
| TOP MATCHED VOLUNTEER DONORS                                |
| 1. DONOR_01421 | 3.99 km away | Priority Score: 69.5        |
| 2. DONOR_03902 | 9.24 km away | Priority Score: 61.7        |
+─────────────────────────────────────────────────────────────+
```

This drawer gives the coordinator all the information needed to make a life-saving decision in thirty seconds.
