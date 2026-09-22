"""
AI Blood Supply Command Center - Network Optimization Data Layer
----------------------------------------------------------------
Builds the unified network graph, multi-product inventory states, Model 1 demand forecasts,
Model 2 shortage early warning risks, and Model 3 donor candidate pools.

Enforces:
- Graph topology: 30 Hospitals + 10 Blood Banks (40 nodes)
- Route feasibility & capacity (646 transport arcs)
- Multi-component ABO/Rh compatibility
- Safety reserve thresholds per facility
- Scenario disruptions (blood bank offline, flooded highways, emergency demand spikes)

LOGISTICS PROTOTYPE NOTICE:
This module prepares logistical operational parameters for mathematical supply-chain optimization.
It does NOT make medical or clinical transfusion decisions.
"""

import math
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Set
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"

import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import config
from blood_compatibility import (
    is_compatible_donor_group,
    get_compatible_donors,
    COMPONENT_COMPATIBILITY_MAP
)
from donor_candidates import generate_donor_candidates


class NetworkData:
    """Container for the complete optimization problem input data."""
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: Dict[Tuple[str, str], Dict[str, Any]] = {}
        self.facilities: List[str] = []
        self.hospitals: List[str] = []
        self.blood_banks: List[str] = []
        self.blood_groups: List[str] = config.BLOOD_GROUPS
        self.components: List[str] = config.BLOOD_COMPONENTS
        self.inventory: Dict[Tuple[str, str, str], Dict[str, float]] = {}
        self.demand: Dict[Tuple[str, str, str], float] = {}
        self.shortage_risks: Dict[Tuple[str, str, str], Dict[str, Any]] = {}
        self.donor_pools: Dict[Tuple[str, str, str], Dict[str, Any]] = {}
        self.scenario_name: str = "normal"
        self.horizon_hours: int = 72


def build_network_optimization_data(
    target_date: str = "2025-12-01",
    horizon_hours: int = 72,
    scenario: str = "normal",
    offline_blood_banks: Optional[List[str]] = None,
    disrupted_routes: Optional[List[str]] = None,
    emergency_hospital: Optional[str] = None,
    emergency_blood_group: Optional[str] = None,
    emergency_component: Optional[str] = None,
    emergency_additional_demand: float = 0.0
) -> NetworkData:
    """
    Construct the complete data payload for Google OR-Tools supply-chain optimization.

    Parameters:
        target_date: Planning date (e.g. '2025-12-01')
        horizon_hours: Planning horizon (24, 48, or 72 hours)
        scenario: Operational scenario ('normal', 'major_mass_casualty', 'blood_bank_failure', etc.)
        offline_blood_banks: Specific blood banks to mark offline
        disrupted_routes: Route IDs to mark impassable
        emergency_hospital: Hospital experiencing acute trauma demand surge
        emergency_blood_group: Acute demand blood group
        emergency_component: Acute demand component
        emergency_additional_demand: Extra units required for the acute surge

    Returns:
        NetworkData object containing nodes, edges, inventory, demand, and risk states.
    """
    data = NetworkData()
    data.scenario_name = scenario
    data.horizon_hours = horizon_hours

    # 1. Load Facilities (Nodes)
    hosps_df = pd.read_csv(DATA_RAW / "hospitals.csv")
    bbs_df = pd.read_csv(DATA_RAW / "blood_banks.csv")

    offline_bbs_set = set(offline_blood_banks or [])
    if scenario == "blood_bank_failure" and not offline_bbs_set:
        offline_bbs_set.add("BB_001")

    for _, row in hosps_df.iterrows():
        hid = row["hospital_id"]
        data.nodes[hid] = {
            "node_id": hid,
            "name": row["hospital_name"],
            "type": "Hospital",
            "lat": float(row["latitude"]),
            "lon": float(row["longitude"]),
            "hospital_type": row["hospital_type"],
            "storage_capacity": int(row["blood_storage_capacity"]),
            "avg_daily_demand": float(row["avg_daily_demand"]),
            "status": row["operational_status"]
        }
        data.hospitals.append(hid)
        data.facilities.append(hid)

    for _, row in bbs_df.iterrows():
        bid = row["blood_bank_id"]
        is_online = (row["operational_status"] == "Operational") and (bid not in offline_bbs_set)
        data.nodes[bid] = {
            "node_id": bid,
            "name": row["name"],
            "type": "Blood_Bank",
            "lat": float(row["latitude"]),
            "lon": float(row["longitude"]),
            "storage_capacity": int(row["storage_capacity"]),
            "daily_collection_capacity": int(row["daily_collection_capacity"]),
            "status": "Operational" if is_online else "Offline"
        }
        data.blood_banks.append(bid)
        data.facilities.append(bid)

    # 2. Load Transport Arcs (Edges)
    routes_df = pd.read_csv(DATA_RAW / "transport_network.csv")
    blocked_routes_set = set(disrupted_routes or [])

    # Transport disruption scenario: block northern highway routes (e.g. HOSP_009 connections)
    if scenario == "transport_disruption" and not blocked_routes_set:
        for r_id in ["RT_00009", "RT_00039", "RT_00069", "RT_00099", "RT_00129", "RT_00159", "RT_00189", "RT_00219", "RT_00249", "RT_00279"]:
            blocked_routes_set.add(r_id)

    for _, row in routes_df.iterrows():
        rid = row["route_id"]
        src = row["source_id"]
        dst = row["destination_id"]
        dist = float(row["distance_km"])
        tt = float(row["travel_time_minutes"])
        cap = int(row["transport_capacity"])

        # Check route operational validity
        src_online = data.nodes[src]["status"] == "Operational"
        dst_online = data.nodes[dst]["status"] == "Operational"
        is_active = (
            row["route_status"] == "Active" and
            rid not in blocked_routes_set and
            src_online and dst_online and
            dist <= config.OPTIMIZATION_MAX_TRANSFER_DISTANCE_KM
        )

        data.edges[(src, dst)] = {
            "route_id": rid,
            "source": src,
            "destination": dst,
            "distance_km": dist,
            "travel_time_min": tt,
            "capacity": cap,
            "is_active": is_active,
            "traffic_factor": float(row["traffic_factor"])
        }

    # 3. Load Current Inventory State
    # Load hospital daily snapshots
    snap_df = pd.read_parquet(DATA_PROCESSED / "inventory_snapshots.parquet")
    dates_available = snap_df["date"].unique()
    effective_date = target_date if target_date in dates_available else max(dates_available)
    hosp_snaps = snap_df[snap_df["date"] == effective_date].set_index(["hospital_id", "blood_group", "component"])

    # Load blood bank inventory
    batches_df = pd.read_csv(DATA_RAW / "inventory_batches.csv")
    bb_batches = batches_df[
        (batches_df["location_type"] == "Blood_Bank") &
        (batches_df["collection_date"] <= effective_date) &
        (batches_df["expiry_date"] >= effective_date) &
        (batches_df["status"] != "expired")
    ].copy()

    bb_batches["days_left"] = (pd.to_datetime(bb_batches["expiry_date"]) - pd.to_datetime(effective_date)).dt.days
    bb_agg = bb_batches.groupby(["location_id", "blood_group", "component"]).agg(
        current_units=("units", "sum"),
        exp_1d=("days_left", lambda x: int(bb_batches.loc[x[x <= 1].index, "units"].sum())),
        exp_3d=("days_left", lambda x: int(bb_batches.loc[x[x <= 3].index, "units"].sum())),
        exp_5d=("days_left", lambda x: int(bb_batches.loc[x[x <= 5].index, "units"].sum())),
    )

    for fac in data.facilities:
        fac_type = data.nodes[fac]["type"]
        is_online = data.nodes[fac]["status"] == "Operational"

        for bg in data.blood_groups:
            for comp in data.components:
                key = (fac, bg, comp)
                if not is_online:
                    # Offline facilities have zero transferable stock
                    data.inventory[key] = {
                        "current_units": 0.0,
                        "safety_reserve": 0.0,
                        "usable_excess": 0.0,
                        "units_expiring_1d": 0.0,
                        "units_expiring_3d": 0.0,
                        "units_expiring_5d": 0.0
                    }
                    continue

                if fac_type == "Hospital":
                    if key in hosp_snaps.index:
                        row = hosp_snaps.loc[key]
                        curr_u = float(row["current_units"])
                        e1 = float(row["units_expiring_1d"])
                        e3 = float(row["units_expiring_3d"])
                        e5 = float(row["units_expiring_5d"])
                    else:
                        curr_u, e1, e3, e5 = 3.0, 0.0, 0.0, 1.0

                    # Hospital safety reserve = 1 day of daily demand share
                    h_avg_demand = data.nodes[fac]["avg_daily_demand"]
                    comp_share = config.COMPONENT_RULES[comp]["demand_share"]
                    bg_share = config.BLOOD_GROUP_DISTRIBUTION.get(bg, 0.1)
                    safety_reserve = float(np.round(
                        h_avg_demand * comp_share * bg_share * config.OPTIMIZATION_SAFETY_RESERVE_DAYS, 1
                    ))
                    # Usable excess must NOT violate safety reserve
                    usable_excess = max(0.0, curr_u - safety_reserve)

                    data.inventory[key] = {
                        "current_units": curr_u,
                        "safety_reserve": safety_reserve,
                        "usable_excess": usable_excess,
                        "units_expiring_1d": e1,
                        "units_expiring_3d": e3,
                        "units_expiring_5d": e5
                    }

                elif fac_type == "Blood_Bank":
                    if key in bb_agg.index:
                        row = bb_agg.loc[key]
                        curr_u = float(row["current_units"])
                        e1 = float(row["exp_1d"])
                        e3 = float(row["exp_3d"])
                        e5 = float(row["exp_5d"])
                    else:
                        curr_u, e1, e3, e5 = 45.0, 0.0, 2.0, 5.0

                    # Blood bank safety reserve: keep 15% of stock as emergency baseline reserve
                    safety_reserve = float(np.round(curr_u * 0.15, 1))
                    usable_excess = max(0.0, curr_u - safety_reserve)

                    data.inventory[key] = {
                        "current_units": curr_u,
                        "safety_reserve": safety_reserve,
                        "usable_excess": usable_excess,
                        "units_expiring_1d": e1,
                        "units_expiring_3d": e3,
                        "units_expiring_5d": e5
                    }

    # 4. Load Demand Forecasts (Model 1 integration) & Shortage Risk (Model 2)
    shortage_mat = pd.read_parquet(DATA_PROCESSED / "shortage_feature_matrix.parquet")
    dates_mat = shortage_mat["date"].unique()
    eff_mat_date = target_date if target_date in dates_mat else max(dates_mat)
    mat_sub = shortage_mat[shortage_mat["date"] == eff_mat_date].set_index(["hospital_id", "blood_group", "component"])

    horizon_str = f"{horizon_hours}h"
    f_col = f"forecast_{horizon_str}" if horizon_hours == 24 else f"forecast_cumulative_{horizon_str}"

    for hid in data.hospitals:
        for bg in data.blood_groups:
            for comp in data.components:
                key = (hid, bg, comp)
                if key in mat_sub.index:
                    row = mat_sub.loc[key]
                    d_forecast = float(row[f_col]) if f_col in row else float(row.get("forecast_cumulative_72h", 2.0))
                    p24 = float(row.get("shortage_24h", 0.0))
                    p48 = float(row.get("shortage_48h", 0.0))
                    p72 = float(row.get("shortage_72h", 0.0))
                else:
                    d_forecast = 1.5
                    p24, p48, p72 = 0.05, 0.10, 0.15

                # Emergency demand spike override
                is_emergency_target = (
                    (hid == emergency_hospital or scenario in ["major_mass_casualty", "o_negative_crisis"]) and
                    (emergency_blood_group is None or bg == emergency_blood_group) and
                    (emergency_component is None or comp == emergency_component)
                )

                if is_emergency_target and emergency_additional_demand > 0:
                    d_forecast += float(emergency_additional_demand)
                    p24 = max(p24, 0.85)
                    p72 = max(p72, 0.95)
                elif scenario == "major_mass_casualty" and hid == "HOSP_007" and bg == "O_NEG" and comp == "RBC":
                    d_forecast += 8.0
                    p24 = 0.88
                    p72 = 0.96
                elif scenario == "o_negative_crisis" and hid == "HOSP_007" and bg == "O_NEG" and comp == "RBC":
                    d_forecast += 10.0
                    p24 = 0.92
                    p72 = 0.98

                data.demand[key] = float(np.round(max(0.1, d_forecast), 2))

                # Determine risk level from probability
                prob_to_eval = p24 if horizon_hours == 24 else (p48 if horizon_hours == 48 else p72)
                if prob_to_eval >= 0.75:
                    r_level = "CRITICAL"
                elif prob_to_eval >= 0.50:
                    r_level = "HIGH"
                elif prob_to_eval >= 0.20:
                    r_level = "MEDIUM"
                else:
                    r_level = "LOW"

                data.shortage_risks[key] = {
                    "prob_24h": p24,
                    "prob_48h": p48,
                    "prob_72h": p72,
                    "evaluated_prob": prob_to_eval,
                    "risk_level": r_level,
                    "is_emergency": is_emergency_target or r_level in ["HIGH", "CRITICAL"]
                }

    # 5. Populate Donor Pools (Model 3 Integration) - Vectorized for Sub-Second Performance
    donors_raw = pd.read_csv(DATA_RAW / "donors.csv")
    ref_dt = datetime.strptime("2025-12-31", "%Y-%m-%d")
    d_dt = pd.to_datetime(donors_raw["last_donation_date"])
    d_days = (ref_dt - d_dt).dt.days
    base_mask = (donors_raw["eligible"] == True) & (d_days >= config.DONOR_MIN_DAYS_BETWEEN_DONATIONS)
    valid_donors = donors_raw[base_mask].copy()

    # Pre-extract donor coordinates and blood groups
    d_lats = valid_donors["latitude"].values
    d_lons = valid_donors["longitude"].values
    d_bgs = valid_donors["blood_group"].values
    d_avails = valid_donors["availability"].values

    # Convert coordinates to radians for fast Haversine
    R_earth = 6371.0
    phi_d = np.radians(d_lats)
    lambda_d = np.radians(d_lons)

    for hid in data.hospitals:
        h_lat = data.nodes[hid]["lat"]
        h_lon = data.nodes[hid]["lon"]
        phi_h = math.radians(h_lat)
        lambda_h = math.radians(h_lon)

        dphi = phi_d - phi_h
        dlambda = lambda_d - lambda_h
        a_h = np.sin(dphi / 2.0)**2 + np.cos(phi_h) * np.cos(phi_d) * np.sin(dlambda / 2.0)**2
        c_h = 2.0 * np.arctan2(np.sqrt(a_h), np.sqrt(1.0 - a_h))
        dists_km = R_earth * c_h

        # Masks for routine vs emergency
        mask_dist_routine = dists_km <= config.DONOR_MAX_TRAVEL_DISTANCE_KM
        mask_dist_emerg = dists_km <= config.DONOR_MAX_TRAVEL_DISTANCE_EMERGENCY_KM
        mask_avail_routine = (d_avails == "Available")
        mask_avail_emerg = (d_avails == "Available") | (d_avails == "Busy")

        eligible_routine = mask_dist_routine & mask_avail_routine
        eligible_emerg = mask_dist_emerg & mask_avail_emerg

        for comp in data.components:
            for bg in data.blood_groups:
                key = (hid, bg, comp)
                risk_data = data.shortage_risks[key]
                is_em = risk_data["is_emergency"]

                comp_donors = get_compatible_donors(bg, comp)
                mask_bg = np.isin(d_bgs, comp_donors)

                active_mask = eligible_emerg if is_em else eligible_routine
                c_count = int(np.sum(active_mask & mask_bg))
                expected_yield = float(np.round(c_count * config.OPTIMIZATION_DONOR_EXPECTED_YIELD_FACTOR, 1))

                data.donor_pools[key] = {
                    "eligible_candidate_count": c_count,
                    "expected_yield_units": expected_yield
                }

    return data

