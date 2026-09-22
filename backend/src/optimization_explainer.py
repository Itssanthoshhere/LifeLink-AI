"""
AI Blood Supply Command Center - Optimization Explainability Engine
--------------------------------------------------------------------
Generates human-auditable, constraint-grounded rationales for every recommended
transfer, donor mobilization order, and unmet clinical deficit.

DISCLAIMER:
These rationales represent mathematical constraint states, capacity boundaries, and
cost-minimization trade-offs. They do NOT represent causal clinical statements.
"""

from typing import Dict, List, Any, Optional
from optimization_data import NetworkData


class OptimizationExplainer:
    """
    Generates transparent, constraint-grounded explanations for Engine 4 supply decisions.
    """

    def __init__(self, data: NetworkData, solution_results: Dict[str, Any]):
        self.data = data
        self.results = solution_results

    def explain_transfer(self, transfer_order: Dict[str, Any]) -> Dict[str, Any]:
        """
        Explain why a specific facility was selected to supply blood to a destination hospital.
        """
        src = transfer_order["source"]
        dst = transfer_order["destination"]
        bg_src = transfer_order["donor_blood_group"]
        bg_dst = transfer_order["recipient_blood_group"]
        comp = transfer_order["component"]
        units = transfer_order["units"]

        dst_key = (dst, bg_dst, comp)
        src_key = (src, bg_src, comp)

        d_target = self.data.demand.get(dst_key, 0.0)
        curr_stock_dst = self.data.inventory.get(dst_key, {}).get("current_units", 0.0)
        risk_dst = self.data.shortage_risks.get(dst_key, {})
        p_shortage = risk_dst.get("evaluated_prob", 0.0)
        r_level = risk_dst.get("risk_level", "LOW")

        inv_src = self.data.inventory.get(src_key, {})
        usable_src = inv_src.get("usable_excess", 0.0)
        reserve_src = inv_src.get("safety_reserve", 0.0)
        exp_1d = inv_src.get("units_expiring_1d", 0.0)
        exp_3d = inv_src.get("units_expiring_3d", 0.0)

        edge_info = self.data.edges.get((src, dst), {})
        dist = edge_info.get("distance_km", 0.0)
        tt = edge_info.get("travel_time_min", 0.0)

        # Build bulleted explanations
        destination_context = [
            f"Forecasted demand: {d_target:.1f} units over planning horizon",
            f"Standing physical inventory: {curr_stock_dst:.0f} units",
            f"Model 2 shortage early warning: {r_level} risk (P={p_shortage:.2f})"
        ]

        source_selection_reasons = [
            f"Facility has {usable_src:.0f} transferable units above its mandatory safety reserve of {reserve_src:.1f} units",
            f"Direct transport arc ({edge_info.get('route_id', 'Active')}) is operational with {dist:.1f} km distance and ~{tt:.0f} min transit ETA"
        ]

        if bg_src != bg_dst:
            source_selection_reasons.append(
                f"Universal compatibility match: {bg_src} safely transfusable to {bg_dst} for {comp}"
            )

        if exp_1d > 0 or exp_3d > 0:
            source_selection_reasons.append(
                f"FEFO priority: Source holds near-expiry stock ({exp_1d + exp_3d:.0f} units expiring in <= 3 days) prioritized to prevent wastage"
            )

        summary_text = (
            f"{dst} ({self.data.nodes[dst]['name']}) required {d_target:.1f} units of {bg_dst} {comp} with {r_level} shortage risk. "
            f"{src} ({self.data.nodes[src]['name']}) was selected because it maintained {usable_src:.0f} excess units above its safety reserve, "
            f"a viable {dist:.1f} km operational route ({tt:.0f} min ETA), and optimal compatibility."
        )

        dst_name = self.data.nodes.get(dst, {}).get("name", dst)
        src_name = self.data.nodes.get(src, {}).get("name", src)

        return {
            "transfer_id": edge_info.get("route_id", f"{src}_{dst}_{bg_dst}_{comp}"),
            "transfer_summary": f"{src} -> {dst} ({units} units {bg_src}->{bg_dst} {comp})",
            "explanation": {
                "hospital_condition": {
                    "hospital_id": dst,
                    "hospital_name": dst_name,
                    "shortage_probability": float(p_shortage),
                    "forecast_demand": round(float(d_target), 1),
                    "current_inventory": round(float(curr_stock_dst), 1),
                    "is_emergency": bool(risk_dst.get("is_emergency", False))
                },
                "source_condition": {
                    "source_id": src,
                    "source_name": src_name,
                    "current_inventory": round(float(inv_src.get("current_units", 0.0)), 1),
                    "safety_reserve": round(float(reserve_src), 1),
                    "transferable_inventory": round(float(usable_src), 1)
                },
                "logistics_feasibility": {
                    "distance_km": round(float(dist), 1),
                    "eta_minutes": round(float(tt), 0),
                    "route_status": edge_info.get("route_status", "Active"),
                    "product_match": f"{bg_src}->{bg_dst} {comp}" if bg_src != bg_dst else f"Exact match ({bg_dst} {comp})",
                    "fefo_priority": bool(transfer_order.get("is_fefo_priority", False))
                },
                "summary_rationale": summary_text
            },
            "transfer": f"{src} -> {dst} ({units} units {bg_src}->{bg_dst} {comp})",
            "destination_condition": destination_context,
            "source_selection_reasons": source_selection_reasons,
            "summary": summary_text
        }

    def explain_donor_mobilization(self, donor_order: Dict[str, Any]) -> Dict[str, Any]:
        """
        Explain why local donor mobilization was recommended instead of, or in addition to, transfers.
        """
        hid = donor_order["hospital_id"]
        bg = donor_order["blood_group"]
        comp = donor_order["component"]
        units = donor_order["units_to_mobilize"]

        key = (hid, bg, comp)
        d_target = self.data.demand.get(key, 0.0)
        curr_stock = self.data.inventory.get(key, {}).get("current_units", 0.0)
        risk = self.data.shortage_risks.get(key, {})
        pool = self.data.donor_pools.get(key, {})

        reasons = []
        if risk.get("is_emergency"):
            reasons.append("Acute clinical emergency demand surge requires multi-channel supply redundancy")
        if risk.get("risk_level") in ["HIGH", "CRITICAL"]:
            reasons.append(f"Elevated Model 2 shortage probability ({risk.get('evaluated_prob', 0.0):.2f}) justifies pre-emptive donor contact")

        reasons.append(
            f"Model 3 identified {pool.get('eligible_candidate_count', 0)} eligible voluntary donor candidates in immediate hospital vicinity"
        )
        reasons.append(
            f"Local mobilization conserves regional blood bank reserves for facilities with longer transit distances"
        )

        summary = (
            f"Recommended mobilizing {units} donor units at {hid} ({self.data.nodes[hid]['name']}) for {bg} {comp}. "
            f"Justified by {risk.get('risk_level', 'MEDIUM')} shortage risk and {pool.get('eligible_candidate_count', 0)} available local donors."
        )

        return {
            "hospital_id": hid,
            "blood_product": f"{bg} {comp}",
            "units_to_mobilize": units,
            "reasons": reasons,
            "summary": summary
        }

    def explain_unmet_shortage(self, shortage_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Explain why a clinical deficit could not be satisfied (infeasibility diagnosis).
        """
        hid = shortage_item["hospital_id"]
        bg = shortage_item["blood_group"]
        comp = shortage_item["component"]
        unmet = shortage_item["unmet_units"]

        key = (hid, bg, comp)
        reasons = []

        # Check total excess available in network
        total_compatible_excess = 0.0
        for src in self.data.facilities:
            for bg_s in self.data.blood_groups:
                if (src, hid) in self.data.edges and self.data.edges[(src, hid)]["is_active"]:
                    inv = self.data.inventory.get((src, bg_s, comp), {})
                    total_compatible_excess += inv.get("usable_excess", 0.0)

        if total_compatible_excess < unmet:
            reasons.append("Network-wide inventory exhaustion: Available transferable stock across all reachable facilities is fully committed")

        pool = self.data.donor_pools.get(key, {})
        if pool.get("expected_yield_units", 0) <= 0:
            reasons.append("Zero eligible local voluntary donor candidates identified within geographic travel radius")

        # Route check
        active_routes_to_hid = [
            src for (src, dst), e in self.data.edges.items() if dst == hid and e["is_active"]
        ]
        if not active_routes_to_hid:
            reasons.append("Complete logistical isolation: All inbound transport corridors to this facility are disrupted or blocked")

        summary = (
            f"Unmet shortage of {unmet:.1f} units of {bg} {comp} at {hid}. "
            f"Root cause: Network capacity ceiling reached under current hard safety reserves and route constraints."
        )

        return {
            "hospital_id": hid,
            "unmet_units": unmet,
            "root_causes": reasons,
            "summary": summary
        }

    def generate_all_explanations(self, max_transfers_to_explain: int = 15) -> Dict[str, Any]:
        """Generate structured explanations for top transfers, donor orders, and deficits."""
        top_transfers = self.results.get("transfers", [])[:max_transfers_to_explain]
        donor_orders = self.results.get("donor_mobilization_orders", [])[:10]
        unmet_shortages = self.results.get("unmet_shortages", [])

        return {
            "transfers_explained": [self.explain_transfer(t) for t in top_transfers],
            "donor_mobilizations_explained": [self.explain_donor_mobilization(d) for d in donor_orders],
            "unmet_shortages_explained": [self.explain_unmet_shortage(s) for s in unmet_shortages]
        }
