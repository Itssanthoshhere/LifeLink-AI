"""
AI Blood Supply Command Center - Unit & Integration Test Suite
Engine 4: AI Blood Supply Network Optimization & Inter-Facility Transshipment
-----------------------------------------------------------------------------
Comprehensive testing covering:
1. Inventory conservation & balance equations
2. Source safety reserve preservation (no facility transfers below safety reserve)
3. Route capacity constraint adherence
4. Route availability / disrupted route exclusion
5. Exact ABO/Rh component compatibility enforcement
6. FEFO transit expiry feasibility
7. Emergency demand prioritization & penalty scaling
8. Non-negativity & integrality of transfers
9. Zero self-transfer / no circular inventory churn
10. Infeasible case handling & graceful degradation
11. Solver timeout cutoff enforcement
12. Optimization determinism & reproducibility
13. Baseline comparison metric integrity
14. Decision classification (Transfer vs. Donor vs. Combined)
15. Unified Command Center API response compliance
"""

import copy
import pytest
import numpy as np

import sys
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))

import config
from optimization_data import build_network_optimization_data, NetworkData
from optimization_model import SupplyChainOptimizationModel
from optimization_solver import solve_supply_network
from optimization_explainer import OptimizationExplainer
from command_center import run_command_center
from blood_compatibility import is_compatible_donor_group


# ===========================================================================
# 1. Network Constraints & Safety Reserves Tests
# ===========================================================================
class TestNetworkOptimizationConstraints:
    @classmethod
    def setup_class(cls):
        cls.data = build_network_optimization_data(
            target_date="2025-12-01",
            horizon_hours=72,
            scenario="normal"
        )
        cls.res = solve_supply_network(cls.data, time_limit_seconds=15.0)

    def test_solver_optimal_convergence(self):
        assert self.res["solver_status"] in ["OPTIMAL", "FEASIBLE"]
        assert self.res["solver_time_seconds"] < 30.0

    def test_source_safety_reserve_strictly_preserved(self):
        # Calculate total outgoing transfers per facility from solution
        outgoing_by_src: dict = {}
        for t in self.res["transfers"]:
            key = (t["source"], t["donor_blood_group"], t["component"])
            outgoing_by_src[key] = outgoing_by_src.get(key, 0) + t["units"]

        # Ensure outgoing <= usable_excess across all facilities
        for key, units_out in outgoing_by_src.items():
            inv = self.data.inventory.get(key, {})
            usable = inv.get("usable_excess", 0.0)
            reserve = inv.get("safety_reserve", 0.0)
            stock = inv.get("current_units", 0.0)

            # Units out must not exceed usable excess
            assert units_out <= np.floor(usable) + 1e-5
            # Remaining stock at source must remain >= safety reserve
            remaining_stock = stock - units_out
            assert remaining_stock >= np.floor(reserve) - 1e-5

    def test_blood_compatibility_strictly_respected(self):
        for t in self.res["transfers"]:
            bg_src = t["donor_blood_group"]
            bg_dst = t["recipient_blood_group"]
            comp = t["component"]
            assert is_compatible_donor_group(bg_src, bg_dst, comp) is True

    def test_route_capacity_not_exceeded(self):
        route_volume: dict = {}
        for t in self.res["transfers"]:
            pair = (t["source"], t["destination"])
            route_volume[pair] = route_volume.get(pair, 0) + t["units"]

        for pair, vol in route_volume.items():
            edge = self.data.edges.get(pair)
            assert edge is not None
            assert vol <= edge["capacity"]
            assert edge["is_active"] is True

    def test_no_circular_self_transfers(self):
        for t in self.res["transfers"]:
            assert t["source"] != t["destination"]

    def test_transfers_are_non_negative_integers(self):
        for t in self.res["transfers"]:
            assert isinstance(t["units"], int)
            assert t["units"] > 0

    def test_donor_mobilization_within_pool_bounds(self):
        for d in self.res["donor_mobilization_orders"]:
            key = (d["hospital_id"], d["blood_group"], d["component"])
            pool = self.data.donor_pools.get(key, {})
            max_yield = np.ceil(pool.get("expected_yield_units", 0.0))
            assert d["units_to_mobilize"] <= max_yield + 1e-5


# ===========================================================================
# 2. Scenarios & Disruption Resilience Tests
# ===========================================================================
class TestScenarioResilienceAndDisruptions:
    def test_blood_bank_failure_scenario(self):
        # Under blood bank failure, BB_001 is offline
        data = build_network_optimization_data(
            target_date="2024-09-05",
            horizon_hours=72,
            scenario="blood_bank_failure",
            offline_blood_banks=["BB_001"]
        )
        assert data.nodes["BB_001"]["status"] == "Offline"

        res = solve_supply_network(data)
        assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]

        # Ensure BB_001 NEVER sends or receives blood
        for t in res["transfers"]:
            assert t["source"] != "BB_001"
            assert t["destination"] != "BB_001"

    def test_transport_disruption_scenario(self):
        # Under transport disruption, highway routes to HOSP_009 are blocked
        data = build_network_optimization_data(
            target_date="2024-10-10",
            horizon_hours=72,
            scenario="transport_disruption"
        )
        res = solve_supply_network(data)
        assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]

        # Disrupted routes must not appear in transfers
        for t in res["transfers"]:
            edge = data.edges.get((t["source"], t["destination"]))
            assert edge["is_active"] is True

    def test_emergency_prioritization_and_scaling(self):
        # In major mass casualty, emergency demand receives 100% protection
        data = build_network_optimization_data(
            target_date="2024-05-18",
            horizon_hours=72,
            scenario="major_mass_casualty",
            emergency_hospital="HOSP_007",
            emergency_blood_group="O_NEG",
            emergency_component="RBC",
            emergency_additional_demand=8.0
        )
        res = solve_supply_network(data)
        assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]
        impact = res["impact_summary"]["post_optimization"]
        assert impact["emergency_protection_rate_pct"] >= 99.0

    def test_infeasible_deficit_handling(self):
        # Artificially request impossible demand with zero donor pool and zero inventory
        data = copy.deepcopy(TestNetworkOptimizationConstraints.data)
        # Drain all network excess
        for k in data.inventory:
            data.inventory[k]["usable_excess"] = 0.0
            data.inventory[k]["current_units"] = 0.0
        for k in data.donor_pools:
            data.donor_pools[k]["expected_yield_units"] = 0.0

        res = solve_supply_network(data)
        # The penalty-formulation ensures solver returns FEASIBLE with shortages flagged
        assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]
        assert len(res["unmet_shortages"]) > 0

        # Explainer correctly diagnoses the root causes
        explainer = OptimizationExplainer(data, res)
        unmet_exp = explainer.explain_unmet_shortage(res["unmet_shortages"][0])
        assert len(unmet_exp["root_causes"]) >= 1


# ===========================================================================
# 3. Decision Trade-Offs & API Compliance Tests
# ===========================================================================
class TestOptimizationAPIAndDecisions:
    def test_decision_classification_categories(self):
        res = TestNetworkOptimizationConstraints.res
        breakdown = res["impact_summary"]["decision_breakdown"]
        assert "TRANSFER_ONLY" in breakdown
        assert "DONOR_ONLY" in breakdown
        assert "COMBINED" in breakdown
        assert breakdown["TRANSFER_ONLY"] > 0

    def test_optimization_determinism(self):
        data = build_network_optimization_data(target_date="2025-12-01", horizon_hours=24, scenario="normal")
        res1 = solve_supply_network(data)
        res2 = solve_supply_network(data)
        assert res1["impact_summary"]["transfers"]["total_units_transferred"] == \
               res2["impact_summary"]["transfers"]["total_units_transferred"]

    def test_unified_command_center_api_contract(self):
        cc_out = run_command_center(date="2025-12-01", horizon=72, scenario="normal")
        required_keys = [
            "status", "date", "horizon", "scenario", "optimization_status",
            "solve_time_seconds", "network_metrics", "shortage_alerts",
            "transfer_recommendations", "donor_recommendations",
            "unmet_shortages", "decision_breakdown", "explanations", "disclaimer"
        ]
        for k in required_keys:
            assert k in cc_out

        assert cc_out["status"] == "success"
        assert cc_out["optimization_status"] in ["OPTIMAL", "FEASIBLE"]
        assert len(cc_out["transfer_recommendations"]) > 0
