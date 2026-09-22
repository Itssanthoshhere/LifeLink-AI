"""
AI Blood Supply Command Center - Blood Inventory Engine
--------------------------------------------------------
High-performance cold-chain blood inventory engine (inventory_batches.csv).
Enforces:
- Exact clinical component shelf-life rules (CPDA-1 RBC: 42d, Platelets: 5d, FFP: 365d, Whole Blood: 35d)
- Sub-millisecond FEFO (First-Expired, First-Out) consumption using indexed batch pools
- Strict clinical blood group compatibility during consumption & inter-facility transfers
- Complete batch tracking: available, reserved, expired, transferred
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, DefaultDict, Set
from collections import defaultdict
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config
from blood_compatibility import is_compatible, get_compatible_donors


class InventoryBatch:
    """Represents a discrete blood inventory batch."""
    __slots__ = (
        "batch_id", "location_id", "location_type", "blood_group",
        "component", "initial_units", "units", "collection_date",
        "expiry_date", "shelf_life_days", "status"
    )

    def __init__(
        self,
        batch_id: str,
        location_id: str,
        location_type: str,
        blood_group: str,
        component: str,
        units: int,
        collection_date: datetime,
        shelf_life_days: int,
        status: str = "available",
    ):
        self.batch_id = batch_id
        self.location_id = location_id
        self.location_type = location_type
        self.blood_group = blood_group
        self.component = component
        self.initial_units = units
        self.units = units
        self.collection_date = collection_date
        self.expiry_date = collection_date + timedelta(days=shelf_life_days)
        self.shelf_life_days = shelf_life_days
        self.status = status

    def to_dict(self, snapshot_date: datetime) -> Dict[str, Any]:
        days_left = (self.expiry_date - snapshot_date).days
        status = self.status
        if self.units > 0 and self.expiry_date > snapshot_date and status not in ["transferred", "expired"]:
            status = "available"
        elif self.units == 0 and status not in ["transferred", "expired"]:
            status = "reserved"
        elif self.expiry_date <= snapshot_date and status != "transferred":
            status = "expired"

        return {
            "batch_id": self.batch_id,
            "location_id": self.location_id,
            "location_type": self.location_type,
            "blood_group": self.blood_group,
            "component": self.component,
            "units": self.units,
            "collection_date": self.collection_date.strftime("%Y-%m-%d"),
            "expiry_date": self.expiry_date.strftime("%Y-%m-%d"),
            "days_to_expiry": max(0, days_left) if status == "available" else days_left,
            "status": status,
        }


class InventoryManager:
    """
    Manages regional cold-chain inventory lifecycle with O(1) indexed batch retrieval.
    """
    def __init__(self, seed: int = config.RANDOM_SEED):
        self.seed = seed
        self.rng = np.random.RandomState(seed + 808)
        self.batch_counter = 1
        self.batches: List[InventoryBatch] = []
        # Index: (location_id, component, blood_group) -> list of active InventoryBatch sorted by expiry_date
        self.active_stock: Dict[Tuple[str, str, str], List[InventoryBatch]] = defaultdict(list)

    def _next_batch_id(self) -> str:
        bid = f"BAT_{self.batch_counter:07d}"
        self.batch_counter += 1
        return bid

    def _add_batch(self, batch: InventoryBatch):
        self.batches.append(batch)
        if batch.status == "available" and batch.units > 0:
            key = (batch.location_id, batch.component, batch.blood_group)
            self.active_stock[key].append(batch)
            # Maintain FEFO sort order (earliest expiry first)
            self.active_stock[key].sort(key=lambda b: b.expiry_date)

    def initialize_stock(
        self,
        hospitals_df: pd.DataFrame,
        blood_banks_df: pd.DataFrame,
        start_date_str: str = config.START_DATE,
    ):
        """Populate initial staggered inventory before Day 1."""
        start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
        blood_groups = config.BLOOD_GROUPS
        bg_probs = config.BLOOD_GROUP_DISTRIBUTION

        # 1. Hospital initial buffer
        for h in hospitals_df.itertuples(index=False):
            hid = h.hospital_id
            capacity = h.blood_storage_capacity
            initial_units = int(capacity * self.rng.uniform(0.35, 0.60))

            for comp, comp_rule in config.COMPONENT_RULES.items():
                comp_units = int(initial_units * comp_rule["demand_share"])
                shelf_life = comp_rule["shelf_life_days"]

                for bg in blood_groups:
                    units_for_bg = max(1, int(round(comp_units * bg_probs[bg])))
                    max_past = max(1, min(shelf_life - 2, 25))
                    coll_dt = start_dt - timedelta(days=int(self.rng.randint(1, max_past + 1)))

                    batch = InventoryBatch(
                        batch_id=self._next_batch_id(),
                        location_id=hid,
                        location_type="Hospital",
                        blood_group=bg,
                        component=comp,
                        units=units_for_bg,
                        collection_date=coll_dt,
                        shelf_life_days=shelf_life,
                        status="available",
                    )
                    self._add_batch(batch)

        # 2. Blood Bank reserves
        for bb in blood_banks_df.itertuples(index=False):
            bid = bb.blood_bank_id
            capacity = bb.storage_capacity
            initial_units = int(capacity * self.rng.uniform(0.45, 0.70))

            for comp, comp_rule in config.COMPONENT_RULES.items():
                comp_units = int(initial_units * comp_rule["demand_share"])
                shelf_life = comp_rule["shelf_life_days"]

                for bg in blood_groups:
                    units_for_bg = max(3, int(round(comp_units * bg_probs[bg])))
                    max_past = max(1, min(shelf_life - 2, 30))
                    coll_dt = start_dt - timedelta(days=int(self.rng.randint(1, max_past + 1)))

                    batch = InventoryBatch(
                        batch_id=self._next_batch_id(),
                        location_id=bid,
                        location_type="Blood_Bank",
                        blood_group=bg,
                        component=comp,
                        units=units_for_bg,
                        collection_date=coll_dt,
                        shelf_life_days=shelf_life,
                        status="available",
                    )
                    self._add_batch(batch)

    def add_daily_collections(
        self,
        blood_banks_df: pd.DataFrame,
        current_date: datetime,
        blood_drive_flag: int,
        festival_flag: int,
        turnout_multiplier: float = 1.0,
        offline_facilities: Optional[Set[str]] = None,
    ):
        """Record daily voluntary donor collections at operational blood banks."""
        offline_set = offline_facilities or set()
        blood_groups = config.BLOOD_GROUPS
        bg_probs = [config.BLOOD_GROUP_DISTRIBUTION[bg] for bg in blood_groups]
        bg_probs = np.array(bg_probs) / sum(bg_probs)

        multiplier = 1.0 * turnout_multiplier
        if blood_drive_flag == 1:
            multiplier *= 1.45
        if festival_flag == 1:
            multiplier *= 0.65

        for bb in blood_banks_df.itertuples(index=False):
            if bb.operational_status != "Operational" or bb.blood_bank_id in offline_set:
                continue

            base_coll = bb.daily_collection_capacity
            daily_units = int(self.rng.poisson(max(5, base_coll * multiplier)))

            for comp, comp_rule in config.COMPONENT_RULES.items():
                comp_units = int(round(daily_units * comp_rule["demand_share"]))
                if comp_units <= 0:
                    continue

                shelf_life = comp_rule["shelf_life_days"]
                bgs = self.rng.choice(blood_groups, size=comp_units, p=bg_probs)
                unique_bgs, counts = np.unique(bgs, return_counts=True)

                for bg, count in zip(unique_bgs, counts):
                    batch = InventoryBatch(
                        batch_id=self._next_batch_id(),
                        location_id=bb.blood_bank_id,
                        location_type="Blood_Bank",
                        blood_group=bg,
                        component=comp,
                        units=int(count),
                        collection_date=current_date,
                        shelf_life_days=shelf_life,
                        status="available",
                    )
                    self._add_batch(batch)

    def replenish_hospitals(
        self,
        hospitals_df: pd.DataFrame,
        blood_banks_df: pd.DataFrame,
        bb_to_hosp_routes: Dict[str, List[Dict[str, Any]]],
        current_date: datetime,
        offline_facilities: Optional[Set[str]] = None,
    ) -> int:
        """
        Morning routine hospital replenishment cycle.
        Maintains hospitals' working buffer targets (HOSPITAL_PAR_LEVEL_DAYS).
        Returns total number of consolidated replenishment shipments made.
        """
        offline_set = offline_facilities or set()
        replenishment_shipments = 0
        bg_probs = config.BLOOD_GROUP_DISTRIBUTION

        for h in hospitals_df.itertuples(index=False):
            hid = h.hospital_id
            avg_demand = h.avg_daily_demand
            candidate_routes = bb_to_hosp_routes.get(hid, [])
            hospital_received_shipment = False

            for comp, comp_rule in config.COMPONENT_RULES.items():
                c_share = comp_rule["demand_share"]

                for bg in config.BLOOD_GROUPS:
                    bg_share = bg_probs[bg]
                    target_units = max(1, int(round(avg_demand * config.HOSPITAL_PAR_LEVEL_DAYS * c_share * bg_share)))

                    # Current active stock
                    cur_batches = self.active_stock.get((hid, comp, bg), [])
                    current_units = sum(b.units for b in cur_batches if b.expiry_date > current_date)

                    if current_units < target_units:
                        needed = target_units - current_units

                        for route in candidate_routes:
                            if route["route_status"] == "Disrupted":
                                continue
                            bb_id = route["source_id"]
                            if bb_id in offline_set:
                                continue

                            t_cap = int(route["transport_capacity"])
                            transferred, _ = self.process_transfer(
                                source_id=bb_id,
                                source_type="Blood_Bank",
                                destination_id=hid,
                                recipient_bg=bg,
                                component=comp,
                                units_needed=needed,
                                max_transport_capacity=t_cap,
                                current_date=current_date,
                            )
                            if transferred > 0:
                                hospital_received_shipment = True
                                break

            if hospital_received_shipment:
                replenishment_shipments += 1

        return replenishment_shipments

    def consume_fefo(
        self,
        location_id: str,
        recipient_bg: str,
        component: str,
        required_units: int,
        current_date: datetime,
        urgency: str = "routine",
    ) -> Tuple[int, List[str]]:
        """
        Fast FEFO consumption across exact match then compatible groups.
        Enforces O-Negative clinical stewardship: routine orders cannot drain O- stock.
        """
        if required_units <= 0:
            return 0, []

        compatible_groups = get_compatible_donors(recipient_bg, component)
        # O- Stewardship: Protect universal O- from routine elective depletion
        if urgency in ["routine", "urgent"] and recipient_bg not in ["O_NEG", "O_POS"]:
            compatible_groups = [bg for bg in compatible_groups if bg != "O_NEG"]

        search_order = [recipient_bg] + [bg for bg in compatible_groups if bg != recipient_bg]

        fulfilled = 0
        used_batches = []

        for bg in search_order:
            key = (location_id, component, bg)
            batch_list = self.active_stock.get(key, [])
            if not batch_list:
                continue

            i = 0
            while i < len(batch_list) and fulfilled < required_units:
                batch = batch_list[i]
                if batch.expiry_date <= current_date:
                    batch.status = "expired"
                    batch_list.pop(i)
                    continue

                needed = required_units - fulfilled
                take = min(batch.units, needed)
                batch.units -= take
                fulfilled += take
                used_batches.append(batch.batch_id)

                if batch.units == 0:
                    batch.status = "reserved"
                    batch_list.pop(i)
                else:
                    i += 1

            if fulfilled >= required_units:
                break

        return fulfilled, used_batches

    def process_transfer(
        self,
        source_id: str,
        source_type: str,
        destination_id: str,
        recipient_bg: str,
        component: str,
        units_needed: int,
        max_transport_capacity: int,
        current_date: datetime,
    ) -> Tuple[int, Optional[str]]:
        """Transfer stock from source blood bank/hospital to destination hospital."""
        limit = min(units_needed, max_transport_capacity)
        if limit <= 0:
            return 0, None

        compatible_groups = get_compatible_donors(recipient_bg, component)
        search_order = [recipient_bg] + [bg for bg in compatible_groups if bg != recipient_bg]

        transferred_units = 0

        for bg in search_order:
            key = (source_id, component, bg)
            batch_list = self.active_stock.get(key, [])
            if not batch_list:
                continue

            i = 0
            while i < len(batch_list) and transferred_units < limit:
                batch = batch_list[i]
                if batch.expiry_date <= current_date:
                    batch.status = "expired"
                    batch_list.pop(i)
                    continue

                remaining = limit - transferred_units
                take = min(batch.units, remaining)
                batch.units -= take
                transferred_units += take

                if batch.units == 0:
                    batch.status = "transferred"
                    batch_list.pop(i)
                else:
                    i += 1

                dest_batch = InventoryBatch(
                    batch_id=self._next_batch_id(),
                    location_id=destination_id,
                    location_type="Hospital",
                    blood_group=batch.blood_group,
                    component=batch.component,
                    units=take,
                    collection_date=batch.collection_date,
                    shelf_life_days=batch.shelf_life_days,
                    status="available",
                )
                self._add_batch(dest_batch)

            if transferred_units >= limit:
                break

        return transferred_units, source_id if transferred_units > 0 else None

    def process_expirations(self, current_date: datetime) -> int:
        """Sweep expired active batches across indexed pools."""
        expired_count = 0
        for key, batch_list in self.active_stock.items():
            i = 0
            while i < len(batch_list):
                b = batch_list[i]
                if b.expiry_date <= current_date:
                    if b.units > 0:
                        expired_count += b.units
                        b.status = "expired"
                    else:
                        b.status = "reserved"
                    batch_list.pop(i)
                else:
                    i += 1
        return expired_count

    def to_dataframe(self, snapshot_date: datetime) -> pd.DataFrame:
        """Export all recorded batches to DataFrame."""
        rows = [b.to_dict(snapshot_date) for b in self.batches]
        return pd.DataFrame(rows)
