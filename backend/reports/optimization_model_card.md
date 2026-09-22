# Model Card: Engine 4 — AI Blood Supply Network Optimization & Inter-Facility Transshipment Engine
**AI Blood Supply Command Center**
*Model ID: BCC-ENG4-SUPPLY-OPT-V4.0 | Formulation: Google OR-Tools MILP | Date: 2026-09-21*

---

## 1. System Overview

| Specification | Details |
| :--- | :--- |
| **System Name** | Supply Chain Network Optimization & Inter-Facility Transshipment Engine (Engine 4) |
| **Technology** | Mathematical Optimization: Mixed-Integer Linear Programming (MILP) via Google OR-Tools |
| **Primary Formulation** | Multi-commodity network flow with FEFO expiry economic incentives and donor mobilization |
| **Scope & Granularity** | 30 hospitals, 10 blood banks, 646 transport arcs, 8 blood groups, 4 components (960 demands) |
| **Planning Horizons** | 24 hours, 48 hours, 72 hours (default: 72 hours) |
| **Downstream Consumers**| AI Blood Supply Command Center Operations Dashboard, Automated Dispatch Services |

---

## 2. Mandatory Clinical & Operational Safety Disclaimers

> [!CAUTION]
> ### MEDICAL AND OPERATIONAL SAFETY NOTICE
> 1. **Synthetic Simulation Environment**: All facilities, donor profiles, patient requests, inventory batches, and geographic coordinates are **100% synthetic**. No real patient data, clinical records, or donor Personally Identifiable Information (PII) were utilized or generated.
> 2. **Mathematical Optimization, Not Machine Learning**: This system uses deterministic mathematical programming. It does not predict medical outcomes, diagnose patients, or prescribe blood therapy.
> 3. **No Clinical Transfusion Authorization**: Output recommendations represent logistical inventory movements. All transfusion compatibility must be confirmed by qualified immunohematology laboratory staff via serological or electronic cross-matching prior to blood issue.
> 4. **Mandatory Human Oversight**: No automated dispatch, vehicle courier departure, or donor outreach campaign may occur without explicit review and approval by authorized blood bank and hospital logistics coordinators.
> 5. **Prototype Engineering Assumptions**: Safety reserve levels (1.0 day), travel limits (65 km), vehicle capacities, and penalty weights are simulation engineering parameters requiring local regulatory calibration (e.g. AABB, FDA, WHO, NBTC guidelines) prior to physical deployment.

---

## 3. Mathematical Formulation Summary

### Decision Variables:
- $x_{i, j, b_s, b_d, c} \in \mathbb{Z}_{\ge 0}$: Units of component $c$ with donor group $b_s$ transferred from facility $i$ to fulfill recipient group $b_d$ at hospital $j$.
- $d_{j, b, c} \in \mathbb{Z}_{\ge 0}$: Units mobilized from local voluntary donor candidates at hospital $j$.
- $s_{j, b, c} \ge 0$: Unmet clinical deficit units.

### Objective Function:
$$\min \sum \text{Shortage Penalty} \cdot s + \sum \text{Transport Cost} \cdot x + \sum \text{Donor Mobilization Cost} \cdot d - \sum \text{FEFO Expiry Credit} \cdot x$$

### Hard Operational Invariants Enforced:
1. **Safety Reserve Guarantee**: Source facilities never transfer inventory below their configured safety reserves.
2. **Compatibility Enforcement**: Zero cross-group incompatibilities permitted across all components.
3. **Route Capacity**: Cumulative transshipment volume across each arc respects transit limits.
4. **FEFO Transit Feasibility**: Batches expiring within 24 hours cannot be dispatched across long routes (> 90 mins).
5. **No Circular Churn**: Self-transfers ($x_{i, i, \cdot}$) are strictly barred.

---

## 4. Benchmark Performance & Stress Testing

Evaluated across the 9 simulation scenarios against two industry-standard heuristic baselines:

| System / Metric | Shortage Count | Shortage Units | Emergency Protection | Runtime |
| :--- | :---: | :---: | :---: | :---: |
| **Engine 4 MILP (Google OR-Tools)** | **0** | **0.0 units** | **100.0%** | **2.2s** |
| **Baseline A (Nearest Blood Bank Only)** | 675 | 1,554.1 units | 12.4% | 0.003s |
| **Baseline B (Greedy Priority Allocation)** | 667 | 643.9 units | 58.2% | 0.024s |

---

## 5. Ethical, Legal, and Social Implications

- **Algorithmic Equity**: The model penalizes shortages equally across all patient populations, prioritizing purely by clinical urgency (Model 2 risk tier and emergency surge flags) rather than facility prestige or geography.
- **Donor Protection**: Donor mobilization costs prevent the optimization engine from over-contacting voluntary donors when transferable inventory already exists in regional blood banks.
- **Wastage Reduction**: First-Expired First-Out economic credits actively mitigate cold-chain wastage, honoring voluntary donor contributions.

---

## 6. Verification Sign-Off & System State

- **Model 1 (Demand Forecasting)**: Complete, validated, integrated.
- **Model 2 (Shortage Early Warning)**: Complete, audited, integrated.
- **Model 3 (Intelligent Donor Dispatch)**: Complete, tested, integrated.
- **Engine 4 (Supply Chain Optimization)**: Complete, tested (62/62 tests passing), validated across 9 scenarios.
- **Unified Command Center API**: Programmatically operational in `src/command_center.py`.
- **Readiness for Dashboard UI**: **APPROVED TO PROCEED TO DASHBOARD INTEGRATION.**
