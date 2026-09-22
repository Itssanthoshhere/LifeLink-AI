"""
AI Blood Supply Command Center - Network Optimization Mathematical Model
-------------------------------------------------------------------------
Formulates the multi-commodity, multi-facility transshipment problem as a Mixed-Integer
Linear Program (MILP) using Google OR-Tools.

Decision Variables:
- x[src, dst, bg_src, bg_dst, comp]: Units transferred from facility src to hospital dst
- donor_units[dst, bg, comp]: Units mobilized from local voluntary donor candidates
- shortage[dst, bg, comp]: Unmet clinical deficit (penalized heavily)

Hard Constraints Enforced:
1. Source facility usable excess limit (Safety reserves strictly preserved)
2. Destination demand satisfaction balance
3. Route capacity and operational availability
4. Exact ABO/Rh component compatibility
5. Donor candidate mobilization capacity
6. FEFO transit expiry feasibility
7. Zero circular transfers & non-negativity

LOGISTICS PROTOTYPE NOTICE:
This module performs supply-chain logistics optimization. It does NOT authorize medical
procedures or replace clinical blood screening.
"""

from typing import Dict, List, Tuple, Any, Optional
import numpy as np
from ortools.linear_solver import pywraplp

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config
from optimization_data import NetworkData
from blood_compatibility import is_compatible_donor_group


class SupplyChainOptimizationModel:
    """
    Mixed-Integer Linear Programming model for blood supply transshipment and donor dispatch.
    """

    def __init__(self, data: NetworkData):
        self.data = data
        self.solver = pywraplp.Solver.CreateSolver("CBC")
        if not self.solver:
            self.solver = pywraplp.Solver.CreateSolver("SCIP")
        if not self.solver:
            raise RuntimeError("Could not initialize Google OR-Tools CBC or SCIP solver backend.")

        # Variables
        self.transfers: Dict[Tuple[str, str, str, str, str], Any] = {}
        self.donor_mobilizations: Dict[Tuple[str, str, str], Any] = {}
        self.shortages: Dict[Tuple[str, str, str], Any] = {}

        # Objective & Constraints
        self._build_variables()
        self._build_constraints()
        self._build_objective()

    def _build_variables(self):
        """Construct bounded integer and continuous decision variables."""
        d = self.data

        # 1. Transfer variables: x[src, dst, bg_src, bg_dst, comp]
        for (src, dst), edge_info in d.edges.items():
            if not edge_info["is_active"]:
                continue
            cap = edge_info["capacity"]

            for comp in d.components:
                # Component transit expiry check: Platelets expire rapidly (5 days total)
                # If units expire in 1d and travel time > 90 min, transfer is infeasible
                tt = edge_info["travel_time_min"]

                for bg_src in d.blood_groups:
                    inv_info = d.inventory.get((src, bg_src, comp), {})
                    usable = inv_info.get("usable_excess", 0.0)
                    if usable <= 0:
                        continue

                    # If source only has units expiring in 1d and travel time is long, skip
                    if inv_info.get("units_expiring_1d", 0.0) >= usable and tt > 90.0:
                        continue

                    for bg_dst in d.blood_groups:
                        if not is_compatible_donor_group(bg_src, bg_dst, comp):
                            continue

                        # Var name: x_src_dst_bgsrc_bgdst_comp
                        var_name = f"x_{src}_{dst}_{bg_src}_{bg_dst}_{comp}"
                        max_units = int(min(cap, usable, 200))
                        self.transfers[(src, dst, bg_src, bg_dst, comp)] = self.solver.IntVar(
                            0, max_units, var_name
                        )

        # 2. Destination variables: donor_units & shortage
        for hid in d.hospitals:
            for bg in d.blood_groups:
                for comp in d.components:
                    key = (hid, bg, comp)
                    pool_info = d.donor_pools.get(key, {})
                    max_donor_yield = int(np.ceil(pool_info.get("expected_yield_units", 0.0)))
                    max_demand = int(np.ceil(d.demand.get(key, 10.0))) + 15

                    self.donor_mobilizations[key] = self.solver.IntVar(
                        0, max_donor_yield, f"donor_{hid}_{bg}_{comp}"
                    )
                    self.shortages[key] = self.solver.NumVar(
                        0.0, max_demand, f"shortage_{hid}_{bg}_{comp}"
                    )

    def _build_constraints(self):
        """Enforce physical conservation, safety reserves, and capacity limits."""
        d = self.data

        # Constraint 1: Source Usable Excess Supply Limit (Safety Reserve Preservation)
        # Sum of outgoing transfers from facility src for (bg_src, comp) <= usable_excess
        src_groups: Dict[Tuple[str, str, str], List[Any]] = {}
        for (src, dst, bg_src, bg_dst, comp), var in self.transfers.items():
            key = (src, bg_src, comp)
            src_groups.setdefault(key, []).append(var)

        for key, var_list in src_groups.items():
            src, bg_src, comp = key
            usable = d.inventory.get(key, {}).get("usable_excess", 0.0)
            self.solver.Add(
                self.solver.Sum(var_list) <= int(np.floor(usable)),
                f"supply_limit_{src}_{bg_src}_{comp}"
            )

        # Constraint 2: Demand Balance at Destination Hospitals
        # local_inventory + incoming_transfers + donor_yield + shortage >= forecast_demand
        dst_groups: Dict[Tuple[str, str, str], List[Any]] = {}
        for (src, dst, bg_src, bg_dst, comp), var in self.transfers.items():
            key = (dst, bg_dst, comp)
            dst_groups.setdefault(key, []).append(var)

        for hid in d.hospitals:
            for bg in d.blood_groups:
                for comp in d.components:
                    key = (hid, bg, comp)
                    target_demand = d.demand.get(key, 0.0)
                    local_stock = d.inventory.get(key, {}).get("current_units", 0.0)
                    incoming_vars = dst_groups.get(key, [])
                    donor_var = self.donor_mobilizations[key]
                    shortage_var = self.shortages[key]

                    # Balance equation: local + incoming + donor + shortage >= demand
                    # Net deficit to be covered = max(0, target_demand - local_stock)
                    net_needed = max(0.0, target_demand - local_stock)
                    self.solver.Add(
                        self.solver.Sum(incoming_vars) + donor_var + shortage_var >= net_needed,
                        f"demand_balance_{hid}_{bg}_{comp}"
                    )

        # Constraint 3: Route Transport Capacity
        # Total units across arc (src, dst) <= capacity
        route_vars: Dict[Tuple[str, str], List[Any]] = {}
        for (src, dst, bg_src, bg_dst, comp), var in self.transfers.items():
            route_vars.setdefault((src, dst), []).append(var)

        for (src, dst), var_list in route_vars.items():
            cap = d.edges.get((src, dst), {}).get("capacity", 100)
            self.solver.Add(
                self.solver.Sum(var_list) <= cap,
                f"route_cap_{src}_{dst}"
            )

    def _build_objective(self):
        """Construct multi-criteria cost minimization objective."""
        d = self.data
        obj_expr = []

        # 1. Shortage Penalties (heavily penalizes unmet clinical demand, especially emergencies)
        for (hid, bg, comp), shortage_var in self.shortages.items():
            risk_info = d.shortage_risks.get((hid, bg, comp), {})
            r_level = risk_info.get("risk_level", "LOW")
            is_em = risk_info.get("is_emergency", False)

            if is_em or r_level == "CRITICAL":
                penalty = config.OPTIMIZATION_EMERGENCY_PENALTY
            elif r_level == "HIGH":
                penalty = 1500.0
            elif r_level == "MEDIUM":
                penalty = 800.0
            else:
                penalty = config.OPTIMIZATION_SHORTAGE_PENALTY

            obj_expr.append(penalty * shortage_var)

        # 2. Transfer Costs (Distance + Friction + FEFO Expiry Credit)
        for (src, dst, bg_src, bg_dst, comp), x_var in self.transfers.items():
            dist = d.edges[(src, dst)]["distance_km"]
            trans_cost = config.OPTIMIZATION_TRANSPORT_COST_WEIGHT * dist
            friction = config.OPTIMIZATION_UNNECESSARY_TRANSFER_PENALTY

            # FEFO Rebate: If source has units expiring in 1d–3d, give an economic credit
            # to prioritize draining near-expiry stock before fresh inventory
            inv = d.inventory.get((src, bg_src, comp), {})
            if inv.get("units_expiring_1d", 0.0) > 0:
                fefo_credit = -6.0
            elif inv.get("units_expiring_3d", 0.0) > 0:
                fefo_credit = -3.0
            else:
                fefo_credit = 0.0

            # Alternative blood group match slight penalty (prefer exact match when available)
            alt_match_penalty = 1.5 if bg_src != bg_dst else 0.0

            net_unit_cost = max(0.5, trans_cost + friction + fefo_credit + alt_match_penalty)
            obj_expr.append(net_unit_cost * x_var)

        # 3. Donor Mobilization Cost
        for key, donor_var in self.donor_mobilizations.items():
            obj_expr.append(config.OPTIMIZATION_DONOR_MOBILIZATION_COST * donor_var)

        # Minimize total network cost
        self.solver.Minimize(self.solver.Sum(obj_expr))

    def solve(self, time_limit_seconds: Optional[float] = None) -> int:
        """Execute solver with configured time ceiling."""
        sec = time_limit_seconds or config.OPTIMIZATION_MAX_SOLVER_SECONDS
        self.solver.SetTimeLimit(int(sec * 1000))
        return self.solver.Solve()
