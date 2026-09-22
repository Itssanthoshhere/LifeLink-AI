# End-to-End Walkthrough: A Single Emergency Case Study
## Following a Real Slice: Hospital HOSP_007 + O-Negative RBC + Mass Casualty

> **"To see how all four models, the database, the API, and the dashboard work together in practice, let us follow a single emergency from start to finish."**

---

## The Case Profile
* **Target Hospital**: `HOSP_007` — **Valley Trauma Center** (Metro Metropolis)
* **Target Blood Product**: **O-Negative ($O^-$) Red Blood Cells (RBC)**
* **Operational Scenario**: `mass_casualty` (Simulated multi-vehicle highway pileup)
* **Planning Horizon**: **72 Hours** (Multi-day emergency management)

---

## Step 1: The Situation (Raw Data Layer)

A major multi-vehicle accident occurs on the metropolitan ring road. Ambulances begin rushing severely injured patients to **Valley Trauma Center (`HOSP_007`)**.

The coordinator opens the system and checks the hospital's local baseline:
* **Current Shelf Inventory**: Valley Trauma Center has exactly **17 units** of O-negative red blood cells in its refrigerated blood bank.
* **Normal Daily Usage**: Under quiet, routine conditions, the trauma center uses approximately **0.86 to 1.1 units** of $O^-$ RBC per day.
* **The Emerging Crisis**: With multiple trauma patients arriving simultaneously in hemorrhagic shock, the hospital's demand is about to multiply drastically.

```
[ Hospital: HOSP_007 (Valley Trauma Center) ]
Current Stock: 17 units O- RBC
Emergency: Multi-vehicle highway collision reported in sector
```

---

## Step 2: Forecasting Future Consumption (Model 1 Layer)

The system runs **Model 1 (Demand Forecasting)**:
* Model 1 ingests the calendar day, the recent 7-day consumption lags, and the emergency trauma flag.
* It evaluates the direct multi-horizon XGBoost regression models:
  - **Next 24 Hours**: Predicted demand = **0.86 units** (routine base) + emergency trauma surge.
  - **Next 48 Hours**: Predicted demand = **0.95 units** base + surgical ICU recovery.
  - **Next 72 Hours**: Predicted demand = **0.84 units** base + stabilization.
* Over the full 72-hour window, the model estimates a cumulative requirement exceeding the hospital's routine replenishment buffer.

---

## Step 3: Assessing the Shortage Danger (Model 2 Layer)

The system passes Model 1's forecasted demand into **Model 2 (Shortage Early Warning)**:
* Model 2 compares the **17 units on hand** against incoming demand, expiring units, and trauma emergency indicators.
* It evaluates the calibrated XGBoost classification model:
  - **Under Normal Conditions**: The 24-hour stockout probability is calculated at **0.001** (Risk Tier: **LOW**).
  - **Under the Mass Casualty Scenario**: The combination of sudden emergency admissions and depleted regional reserves causes the risk tier to jump to **CRITICAL** (Probability $> 75\%$).
* **System Action**: An automated **CRITICAL SHORTAGE ALERT** is generated for `HOSP_007 | O_NEG | RBC` and displayed prominently at the top of the command center feed.

---

## Step 4: Identifying Volunteer Donors (Model 3 Layer)

Because a Critical shortage alert has been triggered, the system automatically queries **Model 3 (Donor Ranking & Dispatch)**:
1. **Database Search**: Model 3 scans the regional registry of 5,000 synthetic volunteer donors.
2. **Filtering Stage**:
   - Disqualifies donors who donated within the last 90 days.
   - Disqualifies donors lacking medical clearance.
   - Disqualifies incompatible blood groups (for O-negative recipients, **only O-negative donors are biologically compatible**).
   - Expands the geographic search radius to the emergency limit (**35 to 50 km**).
3. **Surviving Candidate Pool**: **92 eligible O-negative donors** are identified in the metropolitan region.
4. **MCDA Ranking**: Model 3 scores all 92 candidates based on distance, historical response speed, and availability:
   - **Rank #1**: `DONOR_01421` — Distance: **3.99 km** | Estimated Travel Time: **11.4 min** | Priority Score: **69.5** (Tier: **CRITICAL**)
   - **Rank #2**: `DONOR_03902` — Distance: **9.24 km** | Estimated Travel Time: **26.4 min** | Priority Score: **61.7** (Tier: **HIGH**)
   - **Rank #3**: `DONOR_01239` — Distance: **11.15 km** | Priority Score: **60.6** (Tier: **HIGH**)
   - **Rank #4**: `DONOR_03483` — Distance: **9.21 km** | Priority Score: **59.4** (Tier: **HIGH**)
   - **Rank #5**: `DONOR_00285` — Distance: **11.48 km** | Priority Score: **57.7** (Tier: **HIGH**)

The system queues `DONOR_01421` and the top candidates into the donor outreach dispatch queue.

---

## Step 5: Global Supply Network Optimization (Engine 4 Layer)

Now the core question arises: *"Should we rely purely on volunteer donors, or can we immediately move existing blood bags from nearby facilities?"*

The system executes **Engine 4 (Supply Network Optimization)**:
* Engine 4 builds the full mixed-integer linear programming model across all 40 facilities.
* It checks all neighboring facilities within courier range:
  - `HOSP_005` (**Northside Teaching Hospital**) currently holds a surplus of O-negative red blood cells above its mandatory local safety reserve floor.
* In **2.22 seconds**, the Google OR-Tools CBC solver converges on the globally optimal transshipment plan:
  - **Action 1 (Inter-Facility Transfer)**: Dispatch a courier to transfer **2 units of O-negative RBC** from `HOSP_005` (Northside Teaching Hospital) to `HOSP_007` (Valley Trauma Center).
    - Transit Route: Corridor `RT-082` (Highway Connector)
    - Transit Distance: **2.4 km**
    - Estimated Courier ETA: **4.1 minutes**
  - **Action 2 (Donor Mobilization Queue)**: Mobilize volunteer donors starting with `DONOR_01421` to replenish regional buffer stocks.
  - **Constraint Rationale Generated**:  
    *“Transfer recommended: Source facility HOSP_005 maintains 14 units above safety reserve floor. Route travel time is 4.1 minutes, satisfying emergency response window.”*

---

## Step 6: Command Center Orchestration (`command_center.py`)

The master orchestrator assembles the pieces into a single, unified mission-control data packet:
* Combines the **Shortage Alert** from Model 2.
* Attaches the **Donor Candidate Queue** from Model 3.
* Attaches the **Transfer Recommendation** from Engine 4.
* Saves the payload in the fast in-memory execution cache.

---

## Step 7: FastAPI Delivery (`/api/hospital/HOSP_007`)

The Next.js web application requests data from the backend microservice:
```http
GET /api/hospital/HOSP_007 HTTP/1.1
Host: 127.0.0.1:8000
```
FastAPI responds in **2.6 milliseconds** (cached) with the complete hospital intelligence JSON payload:
* Facility name: `Valley Trauma Center`
* Facility type: `Tier-1 Trauma Center`
* Inventory list: 32 product categories
* Incoming transfer: 2 units O_NEG RBC from HOSP_005 via Route RT-082

---

## Step 8: What the Human Coordinator Sees and Does

On the Next.js Operations Dashboard:
1. The **Overview Screen** flashes a red warning badge next to Valley Trauma Center on the SVG geospatial map.
2. An animated amber transit line connects `HOSP_005` to `HOSP_007`, showing the 4.1-minute courier route.
3. The coordinator clicks on the node, sliding open the **Hospital Intelligence Drawer**.
4. The drawer displays:
   - Current on-shelf stock: 17 units.
   - Incoming delivery: 2 units from Northside Teaching Hospital (ETA: 4.1 min).
   - Top 5 volunteer donors queued for SMS dispatch.
5. The human logistics officer reads the automated rationale, confirms the courier vehicle is available, and clicks **"Authorize Transfer"**.

```
[ RAW DATA ] ──▶ [ MODEL 1 ] ──▶ [ MODEL 2 ] ──▶ [ MODEL 3 ] ──▶ [ ENGINE 4 ] ──▶ [ FASTAPI ] ──▶ [ DASHBOARD ]
17 units on      Forecasts       Flags CRITICAL   Ranks DONOR_     Schedules 2      Serves JSON    Drawer shows
shelf at         future          shortage risk    01421 #1         units from       payload        live orders
HOSP_007         demand          at HOSP_007      (3.99 km away)   HOSP_005 (4 min) to frontend    to human officer
```

**Result**: A potential catastrophe is averted cleanly, safely, and in under five minutes of total elapsed operational time.
