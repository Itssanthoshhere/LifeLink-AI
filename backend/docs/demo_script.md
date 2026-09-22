# LifeLink AI — 10-Minute Live Demonstration Script
## Step-by-Step Guide for Demonstrators and Evaluators

> **"This script gives you an exact, minute-by-minute guide for presenting the live LifeLink AI web dashboard on a projector or screen. It tells you what to click, what to look at, and what to say to the audience."**

---

## 📋 Pre-Demo Checklist
Before beginning your presentation, verify that both background services are running:
1. **FastAPI Backend**: Open browser to `http://127.0.0.1:8000/api/health` $\to$ Confirm `{"backend_ready": true}`.
2. **Next.js Frontend**: Open browser to `http://localhost:3000` $\to$ Confirm green `LIVE BACKEND` badge in the upper right corner.

---

## 🎬 Minute 0–2: Opening — The Real-World Problem
**Screen**: Show the browser window at `http://localhost:3000`.

### What to Say:
> "Welcome everyone. Today I am demonstrating **LifeLink AI**, an AI-assisted command center for regional blood supply management.
>
> In any metropolitan area, hospitals face an agonizing challenge: blood products expire quickly—platelets in just 5 days, red blood cells in 42 days. When a trauma emergency happens, doctors need O-negative blood in minutes. But blood is scattered across dozens of hospitals and blood banks.
>
> Today, coordination is done via frantic phone calls, faxes, and spreadsheets. One hospital runs out of blood while another incinerates expiring blood.
>
> LifeLink AI functions as an **'Air Traffic Control' platform** for blood logistics. It predicts future demand, warns of shortages days in advance, ranks eligible donors, and uses mathematical optimization to schedule the best courier deliveries."

---

## 🎬 Minute 2–3: The Overview Dashboard & Intelligence Chain
**Action**: Scroll slightly down on the **Overview** view.

### What to Point Out:
1. **The Intelligence Chain Banner** across the top:
   - Point to the 5 interconnected badges: *Demand Forecast $\to$ Shortage Prediction $\to$ Donor Matching $\to$ Supply Optimization $\to$ Dispatch*.
2. **The Six High-Level KPIs**:
   - Point out: *Active Facilities (40)*, *Predicted Shortages*, *Recommended Courier Transfers*, *Donor Mobilization Queue*, *Safety Reserve Compliance (100%)*, and *Near-Expiry Units Rescued*.
3. **The Geospatial Network Map**:
   - Point out the 40 glowing nodes representing 30 hospitals and 10 regional blood banks, with transit corridors linking them.

### What to Say:
> "Here on the Overview screen, a regional director can see the health of the entire healthcare network at a single glance. Notice our Intelligence Chain: every decision flows from demand forecasting, to shortage risk, to donor matching, and finally to supply optimization."

---

## 🎬 Minute 3–4: Shortage Early Warnings (Model 2 in Action)
**Action**: Click on **"Shortages"** in the left sidebar.

### What to Point Out:
1. Show the sortable table of shortage alerts.
2. Point out the **Risk Tiers**: Red badges for `CRITICAL`, amber for `HIGH`, yellow for `MEDIUM`.
3. Highlight that every alert shows:
   - Hospital Name (e.g., *Valley Trauma Center*).
   - Product needed (e.g., *O-Negative Red Blood Cells*).
   - Expected Demand vs. Current Stock on hand.
   - Mathematical probability of running out (e.g., *78.4%*).

### What to Say:
> "This isn't just showing what has already run out. This is **Model 2**, our early warning system. By comparing current shelf inventory against **Model 1's** multi-horizon demand forecasts, it calculates the exact mathematical probability that a hospital will run short in the next 24, 48, or 72 hours. This gives coordinators days of advance warning to take action before a surgery has to be canceled."

---

## 🎬 Minute 4–5: Intelligent Donor Ranking (Model 3 in Action)
**Action**: Click on **"Donor Dispatch"** in the left sidebar.

### What to Point Out:
1. Show the list of donor candidates.
2. Highlight the top candidate: `DONOR_01421`.
3. Point out the specific metrics:
   - *Distance*: 3.99 km
   - *Estimated Travel Time*: 11.4 minutes
   - *Days Since Last Donation*: $> 90$ days (strictly enforced)
   - *Priority Score*: 69.5 (Tier: `CRITICAL`)

### What to Say:
> "When shortages threaten, blood banks need to reach out to volunteer donors. But blind robo-calling annoys donors and causes donor fatigue.
>
> **Model 3** uses Multi-Criteria Decision Analysis to find the best donors. It enforces strict medical rules: donors must be medically cleared, have an exact compatible blood group, and have rested at least 90 days since their last donation. It then ranks them by proximity, response speed, and availability so coordinators can call the most effective donors first."

---

## 🎬 Minute 5–6: Network Supply Optimization (Engine 4 in Action)
**Action**: Click on **"Optimization"** in the left sidebar.

### What to Point Out:
1. Show the **Recommended Transfer Schedule**.
2. Point out an exact order:
   - *From*: `HOSP_005` (Northside Teaching Hospital)
   - *To*: `HOSP_007` (Valley Trauma Center)
   - *Product*: O_NEG Red Blood Cells
   - *Units*: 2 units
   - *Transit Time*: 4.1 minutes
3. Point out the **Constraint-Based Explanation**:
   - Explain why the system chose this: *"Source facility has 14 units surplus above safety reserve. Preserves recipient emergency buffer."*

### What to Say:
> "Now we arrive at our core philosophy: **'Models predict; optimization decides.'**
>
> Predictive AI tells you what might happen, but it cannot make multi-variable decisions with physical vehicle constraints. **Engine 4** is a Mixed-Integer Linear Program solved with Google OR-Tools. It calculates the mathematically optimal transfer plan across all 40 facilities in just 2.2 seconds. It guarantees that no courier truck is overloaded, no source hospital is depleted below its safety reserve, and blood near its expiration date is rescued first."

---

## 🎬 Minute 6–8: The Grand Demonstration — One-Click Demo Mode
**Action**: Click the glowing blue **"Demo Mode"** button in the top navigation header!

### What Happens on Screen:
1. The scenario immediately switches to **Mass Casualty (`mass_casualty`)**.
2. The network map updates dynamically.
3. The **Hospital Intelligence Drawer** slides open from the right side of the screen, focusing on `HOSP_007` (**Valley Trauma Center**).

### What to Show in the Drawer:
* Point to the top badge: **Tier-1 Trauma Center**.
* Show the local inventory table: 32 product categories.
* Show the active emergency alert: *Mass Casualty Surge*.
* Show the incoming transfer order: *2 units of O_NEG RBC arriving from Northside Teaching Hospital (ETA 4.1 min)*.
* Show the queued donors: `DONOR_01421` ready for contact.

### What to Say:
> "Notice what just happened with one click:
> 1. We simulated a catastrophic multi-car highway accident near Valley Trauma Center.
> 2. Model 1 projected a sudden surge in emergency trauma demand.
> 3. Model 2 immediately escalated the shortage risk for O-negative blood to CRITICAL.
> 4. Model 3 identified five nearby eligible donors.
> 5. Engine 4 instantly found surplus inventory at Northside Teaching Hospital just 2.4 km away and scheduled a courier shipment with a 4.1-minute ETA.
> 6. And the Hospital Intelligence Drawer opened automatically, presenting the coordinator with the complete, actionable plan."

---

## 🎬 Minute 8–9: Scenario Stress Testing
**Action**: Close the drawer and click on **"Scenarios"** in the left sidebar.

### What to Point Out:
1. Show the 9 predefined operational stress tests:
   - *Normal Operations*
   - *Demand Spike*
   - *Mass Casualty Incident*
   - *Dengue Epidemic (Platelet Surge)*
   - *O-Negative Crisis*
   - *Blood Bank Cooling Failure*
   - *Transport Network Disruption*
   - *Platelet Expiry Wave*
   - *Donor Availability Slump*
2. Click on **"Cooling Failure"** or **"Transport Disruption"** to show how the solver adapts when facilities or routes go offline.

### What to Say:
> "A hospital network must be resilient against all disasters. In this Scenarios view, coordinators can simulate what happens if a blood bank's refrigeration fails, or if a bridge collapse closes major transit corridors. The optimization engine dynamically reroutes shipments around the disruptions."

---

## 🎬 Minute 9–10: Closing — Responsible AI & Human Oversight
**Action**: Return to the **Overview** page and point to the top warning banner:  
*“Operational Research Prototype — Synthetic Simulation — Human Medical Review Required”*.

### What to Say:
> "To conclude, I want to emphasize our design philosophy and ethical boundaries:
>
> 1. **Synthetic Data**: All data used here is synthetic simulation data generated for research. No real patient or donor personal health information was used or exposed.
> 2. **Decision Support, Not Replacement**: LifeLink AI is an operational assistant, not an autonomous medical authority. The system prepares recommendations and explains its reasoning, but a licensed human coordinator always makes the final decision to dispatch vehicles or order transfusions.
> 3. **Complete Engineering**: The system is fully functional: 69 backend tests, 10 frontend tests, and 12 API endpoints, all passing at 100%.
>
> Thank you very much, and I welcome any questions from the panel."
