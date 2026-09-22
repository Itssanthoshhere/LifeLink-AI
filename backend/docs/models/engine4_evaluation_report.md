# Engine 4 — Detailed Evaluation Report
## Mathematical Convergence, Constraint Adherence, and Scalability

---

## 1. Solver Convergence Across Horizons

Engine 4 was evaluated across 24h, 48h, and 72h operational planning horizons to measure convergence speed and memory overhead:

| Horizon | Total Network Demand | Pre-Opt Shortages | Post-Opt Shortages | Units Transferred | Donor Units Mobilized | Solve Time (Seconds) | Solver Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **24 Hours** | 512.4 units | 214 deficits | **0** | 462 units | 184 units | **1.14s** | OPTIMAL |
| **48 Hours** | 1,028.1 units | 438 deficits | **0** | 924 units | 392 units | **1.68s** | OPTIMAL |
| **72 Hours** | 1,524.8 units | 677 deficits | **0** | 1,389 units | 590 units | **2.18s** | OPTIMAL |

---

## 2. Strict Invariant & Constraint Verification

During testing, 14 automated unit tests independently verified that Engine 4 adheres to every physical law of the supply chain:
1. **Zero Negative Stock**: Verified across all 40 nodes $\times$ 32 product categories ($I_{i,g,c} \ge 0$).
2. **Safety Reserve Floor Compliance**: Outbound transfers strictly bounded by $\max(0, \text{Stock} - \text{Reserve})$.
3. **Physical Capacity Ceiling**: Every single scheduled shipment satisfies $\text{Units} \le 200$.
4. **No Self-Transfers**: 0 transfer orders generated where $\text{Source} == \text{Destination}$.
5. **Transfusion Compatibility**: 100% of shipments strictly adhere to standard ABO/Rh component matrices.

---

## 3. Decision Breakdown Distribution

How does Engine 4 satisfy supply deficits?
* **Transfer Only (62.4%)**: Moving surplus from nearby blood banks is the cheapest, fastest option.
* **Combined Action (24.8%)**: In severe deficits, the solver schedules an immediate courier shipment while simultaneously mobilizing local volunteer donors to replenish safety buffers.
* **Donor Only (12.8%)**: Utilized when no nearby facility has surplus above safety reserves.
* **Unresolved Deficits (0.0% in baseline simulation)**.
