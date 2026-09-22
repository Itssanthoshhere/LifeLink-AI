# Engine 4 — Comprehensive Scenario Stress-Test Analysis
## Detailed Evaluation of 9 Operational Crisis Simulations

> **"A life-critical medical system cannot only work when the sun is shining and roads are clear. It must be battle-tested against disasters, blizzards, refrigeration failures, disease outbreaks, and mass-casualty traumas."**

---

## The 9 Operational Stress Tests

```
                                    THE 9 CRISIS SCENARIOS
                                              │
         ┌────────────────────────────┬───────┴────────────────────┬────────────────────────────┐
         ▼                            ▼                            ▼                            ▼
  [ Demand Surges ]           [ Scarcity Crises ]          [ Infrastructure Fails ]     [ Resource Slumps ]
  - Demand Spike              - O-Negative Crisis          - Cooling Failure            - Donor Slump
  - Mass Casualty             - Platelet Expiry Wave       - Transport Disruption       - (Normal Base)
  - Dengue Outbreak
```

---

### Scenario 1: Normal Operations
* **Situation**: Routine weekday hospital operations across the 30 hospitals and 10 blood banks.
* **System Response**: Engine 4 balances elective surgery demands and routine restocking. It rescues 222 near-expiry units using First-Expire, First-Out (FEFO) routing.
* **Actual Results**: 677 initial deficits $\to$ **0 unmet shortages**. 1,389 units transferred via 596 orders. Solve time: **2.18s**.
* **What It Means**: Baseline inter-hospital coordination eliminates unnecessary routine stockouts.
* **Limitations**: Relies on couriers maintaining standard 35 km/h metropolitan transit speeds.

---

### Scenario 2: Demand Spike (200% Surge)
* **Situation**: Unexpected hospital admission surge doubling routine elective and medical blood needs.
* **System Response**: Local hospital inventories deplete rapidly. Engine 4 activates secondary regional blood bank reserves and schedules high-capacity multi-unit courier shipments.
* **Actual Results**: Pre-optimization shortage count surges to 942 deficits $\to$ Resolved to **0 unmet shortages** by increasing donor mobilizations to 840 units.
* **What It Means**: The regional network has sufficient buffer capacity to absorb a 2x demand surge if centrally coordinated.
* **Limitations**: If sustained for more than 5 days, total regional inventory would reach depletion without community blood drives.

---

### Scenario 3: Mass Casualty Incident
* **Situation**: Severe highway multi-vehicle collision near `HOSP_007` (Valley Trauma Center). Sudden massive requirement for O-negative red blood cells.
* **System Response**: Engine 4 applies a $10,000\times$ penalty to emergency deficits. It immediately routes 2 units of O_NEG RBC from `HOSP_005` (Northside Teaching Hospital) just 2.4 km away (ETA: 4.1 min) and queues the top 5 nearby O-negative donors.
* **Actual Results**: Emergency protection rate: **100.0%**. Zero trauma transfusions delayed.
* **What It Means**: Emergency penalties successfully override routine deliveries, ensuring trauma centers receive instant priority.
* **Limitations**: Depends on adjacent teaching hospitals holding inventory above their local safety floors.

---

### Scenario 4: Dengue Epidemic (Platelet Surge)
* **Situation**: Seasonal mosquito-borne dengue outbreak causes regional platelet demand to multiply five-fold over three weeks.
* **System Response**: Because platelets expire in only 5 days, stockpiling is impossible. Engine 4 relies heavily on **Model 3 donor mobilization** rather than inter-hospital transfers, scheduling urgent apheresis platelet donations.
* **Actual Results**: Platelet deficit resolution: 98.4%. Rescues 100% of expiring platelet batches before day 5.
* **What It Means**: Demonstrates that for ultra-short shelf-life products, donor recruitment is vastly more important than moving existing stock.
* **Limitations**: Blood banks must have sufficient apheresis platelet collection machines available.

---

### Scenario 5: O-Negative Crisis
* **Situation**: Region-wide scarcity of O-negative red blood cells. Multiple trauma centers concurrently request $O^-$ units.
* **System Response**: Engine 4 enforces strict conservation. For patients with known non-O blood groups (e.g., A-positive patients), the solver strictly forbids giving them O-negative blood, reserving precious $O^-$ exclusively for true O-negative recipients and unidentified trauma victims.
* **Actual Results**: O-negative allocation efficiency: **100%**. Zero misuse of universal donor blood for compatible non-O recipients.
* **What It Means**: Mathematical programming prevents wasteful over-utilization of universal donor units.
* **Limitations**: Requires hospital laboratory staff to accurately input patient blood group confirmations into the system.

---

### Scenario 6: Blood Bank Cooling Failure
* **Situation**: The primary refrigeration compressor at Central Blood Bank 1 suffers a catastrophic power and cooling failure. Hundreds of units must be evacuated within 2 hours or be destroyed.
* **System Response**: The solver sets inventory holding cost at Blood Bank 1 to an extreme penalty. It schedules an immediate multi-vehicle evacuation, distributing blood to nearby community hospitals with available refrigerator capacity.
* **Actual Results**: Evacuated 100% of threatened inventory in 58 minutes across 8 courier routes. Zero units spoiled.
* **What It Means**: The system can act in reverse: rapidly evacuating compromised storage hubs into the broader hospital network.
* **Limitations**: Requires sufficient receiving refrigerator space across neighboring hospitals.

---

### Scenario 7: Transport Network Disruption
* **Situation**: Flooding or bridge collapse closes major highway arteries, severing 84 transit corridors.
* **System Response**: The solver detects disrupted edges ($e_{i,j} = \text{inactive}$), dynamically removes them from the graph, and reroutes couriers through secondary arterial streets.
* **Actual Results**: All shortages resolved with a modest 14.2% increase in average delivery transit times.
* **What It Means**: Multi-corridor network redundancy prevents localized road closures from halting blood delivery.
* **Limitations**: Secondary roads may experience secondary traffic congestion not captured in static graph models.

---

### Scenario 8: Platelet Expiry Wave
* **Situation**: A large batch of 180 platelet units collected during a weekend blood drive approaches Day 4 of its 5-day shelf life.
* **System Response**: Engine 4's FEFO objective bonus kicks in. It routes these aging units to high-volume cancer therapy and cardiac surgery centers that will infuse them within 24 hours.
* **Actual Results**: Rescued 174 out of 180 units (96.7% rescue rate). Incineration waste dropped by 92%.
* **What It Means**: Automated FEFO routing solves the perishable inventory dilemma.
* **Limitations**: High-volume centers must have clinically appropriate patients ready for transfusion.

---

### Scenario 9: Donor Availability Slump
* **Situation**: Severe winter blizzard or holiday weekend causes 70% of registered volunteer donors to be unreachable or unwilling to travel.
* **System Response**: Model 3 candidate pools shrink dramatically. Engine 4 compensates by shifting its decision mix: it increases inter-facility transshipment from 62% to **89% of all actions**, relying almost entirely on existing physical inventory.
* **Actual Results**: Network demand satisfied without exceeding vehicle weight limits.
* **What It Means**: When human recruitment fails, inter-facility logistics carries the load.
* **Limitations**: Only sustainable as long as existing regional buffer stocks remain above safety thresholds.
