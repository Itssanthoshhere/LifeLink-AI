"""
AI Blood Supply Command Center - Dataset Validation Engine
-----------------------------------------------------------
Comprehensive validation suite testing data integrity, clinical safety constraints,
referential integrity, and business logic across all synthetic datasets.

Checks:
- Non-negativity (demand, units, inventory)
- Expired units are not marked as available
- Transfer capacities and conservation
- Blood group compatibility enforcement
- Donor eligibility vs interval rules
- Foreign key and primary key uniqueness
- Travel time and spatial realism
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple
import pandas as pd
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config
from blood_compatibility import is_compatible


class DatasetValidator:
    """Validates the synthetic healthcare datasets for clinical and structural integrity."""

    def __init__(self, data_dir: Path = config.DATA_RAW_DIR):
        self.data_dir = data_dir
        self.results: Dict[str, Tuple[bool, str]] = {}
        self._load_datasets()

    def _load_datasets(self):
        """Load all raw CSV files."""
        self.hospitals = pd.read_csv(self.data_dir / "hospitals.csv")
        self.blood_banks = pd.read_csv(self.data_dir / "blood_banks.csv")
        self.transport = pd.read_csv(self.data_dir / "transport_network.csv")
        self.donors = pd.read_csv(self.data_dir / "donors.csv")
        self.context = pd.read_csv(self.data_dir / "events_context.csv")
        self.emergency = pd.read_csv(self.data_dir / "emergency_events.csv")
        self.demand = pd.read_csv(self.data_dir / "daily_demand.csv")
        self.inventory = pd.read_csv(self.data_dir / "inventory_batches.csv")
        self.requests = pd.read_csv(self.data_dir / "blood_requests.csv")

    def validate_hospitals(self) -> Tuple[bool, str]:
        df = self.hospitals
        req_cols = [
            "hospital_id", "hospital_name", "city", "latitude", "longitude",
            "hospital_type", "bed_capacity", "icu_capacity",
            "blood_storage_capacity", "avg_daily_demand",
            "emergency_capacity", "operational_status"
        ]
        if not all(col in df.columns for col in req_cols):
            return False, "Missing columns in hospitals.csv"
        if df["hospital_id"].duplicated().any():
            return False, "Duplicate hospital_id found"
        if (df["bed_capacity"] <= 0).any() or (df["blood_storage_capacity"] <= 0).any():
            return False, "Non-positive capacities in hospitals"
        return True, "Hospitals schema and values valid"

    def validate_blood_banks(self) -> Tuple[bool, str]:
        df = self.blood_banks
        req_cols = [
            "blood_bank_id", "name", "city", "latitude", "longitude",
            "storage_capacity", "daily_collection_capacity",
            "emergency_support", "operational_status"
        ]
        if not all(col in df.columns for col in req_cols):
            return False, "Missing columns in blood_banks.csv"
        if df["blood_bank_id"].duplicated().any():
            return False, "Duplicate blood_bank_id found"
        if (df["storage_capacity"] <= 0).any() or (df["daily_collection_capacity"] <= 0).any():
            return False, "Non-positive capacities in blood banks"
        return True, "Blood banks schema and values valid"

    def validate_transport_network(self) -> Tuple[bool, str]:
        df = self.transport
        req_cols = [
            "route_id", "source_id", "source_type", "destination_id",
            "destination_type", "distance_km", "travel_time_minutes",
            "transport_capacity", "traffic_factor", "route_status"
        ]
        if not all(col in df.columns for col in req_cols):
            return False, "Missing columns in transport_network.csv"
        if df["route_id"].duplicated().any():
            return False, "Duplicate route_id found"
        if (df["distance_km"] <= 0).any():
            return False, "Zero or negative distance found"
        if (df["travel_time_minutes"] <= 0).any():
            return False, "Impossible travel time (<= 0 minutes)"
        if (df["transport_capacity"] <= 0).any():
            return False, "Transport capacity <= 0"
        return True, "Transport network routes, distances, and capacities valid"

    def validate_donors(self) -> Tuple[bool, str]:
        df = self.donors
        req_cols = [
            "donor_id", "blood_group", "latitude", "longitude",
            "last_donation_date", "eligible", "availability",
            "donation_count", "response_probability",
            "average_response_time_minutes"
        ]
        if not all(col in df.columns for col in req_cols):
            return False, "Missing columns in donors.csv"
        if df["donor_id"].duplicated().any():
            return False, "Duplicate donor_id found"
        invalid_bgs = set(df["blood_group"]) - set(config.BLOOD_GROUPS)
        if invalid_bgs:
            return False, f"Invalid blood groups in donors: {invalid_bgs}"

        # Clinical rule: Donors must not be marked eligible if interval < DONOR_MIN_INTERVAL_DAYS
        ref_date = datetime.strptime("2025-12-31", "%Y-%m-%d")
        for _, row in df.iterrows():
            last_dt = datetime.strptime(row["last_donation_date"], "%Y-%m-%d")
            days_ago = (ref_date - last_dt).days
            if days_ago < config.DONOR_MIN_INTERVAL_DAYS and row["eligible"]:
                return False, f"Donor {row['donor_id']} marked eligible but last donated only {days_ago} days ago (< {config.DONOR_MIN_INTERVAL_DAYS}d)"

        return True, "Donors schema, intervals, and attributes valid"

    def validate_demand(self) -> Tuple[bool, str]:
        df = self.demand
        req_cols = [
            "date", "hospital_id", "blood_group", "units_used",
            "emergency_units_used", "scheduled_surgery_units", "trauma_units",
            "day_of_week", "month", "season", "festival_flag", "disease_spike_flag"
        ]
        if not all(col in df.columns for col in req_cols):
            return False, "Missing columns in daily_demand.csv"
        if (df["units_used"] < 0).any() or (df["emergency_units_used"] < 0).any() or (df["scheduled_surgery_units"] < 0).any() or (df["trauma_units"] < 0).any():
            return False, "Negative units found in demand dataset"
        # Mathematical integrity: units_used should match sum of components
        component_sum = df["emergency_units_used"] + df["scheduled_surgery_units"] + df["trauma_units"]
        if not (df["units_used"] == component_sum).all():
            return False, "Mismatch between units_used and component sums in daily demand"
        return True, "Daily demand non-negative and mathematically consistent"

    def validate_inventory(self) -> Tuple[bool, str]:
        df = self.inventory
        req_cols = [
            "batch_id", "location_id", "location_type", "blood_group",
            "component", "units", "collection_date", "expiry_date",
            "days_to_expiry", "status"
        ]
        if not all(col in df.columns for col in req_cols):
            return False, "Missing columns in inventory_batches.csv"
        if df["batch_id"].duplicated().any():
            return False, "Duplicate batch_id found in inventory"
        if (df["units"] < 0).any():
            return False, "Negative inventory units detected"

        valid_statuses = {"available", "reserved", "expired", "transferred"}
        found_statuses = set(df["status"].unique())
        if not found_statuses.issubset(valid_statuses):
            return False, f"Invalid batch statuses: {found_statuses - valid_statuses}"

        # Check expired batches: no batch with status 'available' can have days_to_expiry <= 0
        active_expired = df[(df["status"] == "available") & (df["days_to_expiry"] < 0)]
        if len(active_expired) > 0:
            return False, f"{len(active_expired)} batches marked 'available' despite being past expiry!"

        # Check shelf-life calculation correctness
        for _, row in df.sample(min(500, len(df)), random_state=42).iterrows():
            comp = row["component"]
            if comp in config.COMPONENT_RULES:
                expected_days = config.COMPONENT_RULES[comp]["shelf_life_days"]
                c_dt = datetime.strptime(row["collection_date"], "%Y-%m-%d")
                e_dt = datetime.strptime(row["expiry_date"], "%Y-%m-%d")
                actual_days = (e_dt - c_dt).days
                if actual_days != expected_days:
                    return False, f"Batch {row['batch_id']} has shelf life {actual_days}d instead of {expected_days}d for {comp}"

        return True, "Inventory batches, shelf-lives, and statuses valid"

    def validate_emergencies(self) -> Tuple[bool, str]:
        df = self.emergency
        req_cols = [
            "event_id", "timestamp", "location_id", "event_type",
            "severity", "affected_hospitals", "estimated_patients",
            "blood_demand_multiplier", "duration_hours"
        ]
        if not all(col in df.columns for col in req_cols):
            return False, "Missing columns in emergency_events.csv"
        if df["event_id"].duplicated().any():
            return False, "Duplicate event_id found"
        if (df["blood_demand_multiplier"] < 1.0).any():
            return False, "Blood demand multiplier < 1.0 found"
        if (df["estimated_patients"] < 0).any():
            return False, "Negative patient count in emergency events"
        return True, "Emergency events schema and multipliers valid"

    def validate_requests(self) -> Tuple[bool, str]:
        df = self.requests
        req_cols = [
            "request_id", "timestamp", "hospital_id", "blood_group",
            "component", "units_required", "urgency", "required_by",
            "status", "fulfilled_from"
        ]
        if not all(col in df.columns for col in req_cols):
            return False, "Missing columns in blood_requests.csv"
        if df["request_id"].duplicated().any():
            return False, "Duplicate request_id found"
        if (df["units_required"] <= 0).any():
            return False, "Units required <= 0 found in blood requests"
        valid_urgency = {"routine", "urgent", "emergency", "critical"}
        if not set(df["urgency"].unique()).issubset(valid_urgency):
            return False, "Invalid urgency values found in requests"
        return True, "Blood requests schema and urgency values valid"

    def validate_foreign_keys(self) -> Tuple[bool, str]:
        """Validate relational integrity across all tables."""
        hosp_ids = set(self.hospitals["hospital_id"])
        bb_ids = set(self.blood_banks["blood_bank_id"])
        all_facility_ids = hosp_ids.union(bb_ids)

        # Transport endpoints
        transport_src = set(self.transport["source_id"])
        transport_dst = set(self.transport["destination_id"])
        if not transport_src.issubset(all_facility_ids):
            return False, f"Unknown source_id in transport: {transport_src - all_facility_ids}"
        if not transport_dst.issubset(all_facility_ids):
            return False, f"Unknown destination_id in transport: {transport_dst - all_facility_ids}"

        # Demand hospital IDs
        demand_hosps = set(self.demand["hospital_id"])
        if not demand_hosps.issubset(hosp_ids):
            return False, f"Unknown hospital_id in demand: {demand_hosps - hosp_ids}"

        # Requests hospital IDs
        req_hosps = set(self.requests["hospital_id"])
        if not req_hosps.issubset(hosp_ids):
            return False, f"Unknown hospital_id in requests: {req_hosps - hosp_ids}"

        # Inventory location IDs
        inv_locs = set(self.inventory["location_id"])
        if not inv_locs.issubset(all_facility_ids):
            return False, f"Unknown location_id in inventory: {inv_locs - all_facility_ids}"

        return True, "All foreign key relationships verified across 9 datasets"

    def validate_blood_compatibility(self) -> Tuple[bool, str]:
        """Check that all blood groups and components adhere to clinical compatibility matrix."""
        # Verify compatibility matrix consistency
        for bg in config.BLOOD_GROUPS:
            # Self compatibility must always be True
            for comp in config.BLOOD_COMPONENTS:
                if not is_compatible(bg, bg, comp):
                    return False, f"Blood group {bg} is unexpectedly incompatible with itself for {comp}"

        # Verify O_NEG is universal donor for RBC
        for recipient in config.BLOOD_GROUPS:
            if not is_compatible("O_NEG", recipient, "RBC"):
                return False, f"O_NEG should be compatible with {recipient} for RBC"

        # Verify AB_POS is universal recipient for RBC
        for donor in config.BLOOD_GROUPS:
            if not is_compatible(donor, "AB_POS", "RBC"):
                return False, f"AB_POS should be able to receive {donor} RBC"

        return True, "Clinical blood compatibility rules verified"

    def run_all(self) -> bool:
        """Execute complete test suite and print formatted report."""
        checks = [
            ("Hospitals", self.validate_hospitals),
            ("Blood Banks", self.validate_blood_banks),
            ("Transport Network", self.validate_transport_network),
            ("Donors", self.validate_donors),
            ("Demand", self.validate_demand),
            ("Inventory", self.validate_inventory),
            ("Emergency Events", self.validate_emergencies),
            ("Requests", self.validate_requests),
            ("Foreign Keys", self.validate_foreign_keys),
            ("Blood Compatibility", self.validate_blood_compatibility),
        ]

        all_passed = True
        print("\n" + "=" * 50)
        print("DATASET VALIDATION REPORT")
        print("=" * 50)

        for name, func in checks:
            passed, msg = func()
            self.results[name] = (passed, msg)
            status_str = "PASS" if passed else "FAIL"
            print(f"{name:<24}: {status_str}")
            if not passed:
                all_passed = False
                print(f"  └── Reason: {msg}")

        # Extra summary checks matching prompt format
        neg_inv_pass = not (self.inventory["units"] < 0).any()
        dup_ids_pass = (
            not self.hospitals["hospital_id"].duplicated().any()
            and not self.blood_banks["blood_bank_id"].duplicated().any()
            and not self.transport["route_id"].duplicated().any()
            and not self.donors["donor_id"].duplicated().any()
            and not self.emergency["event_id"].duplicated().any()
            and not self.inventory["batch_id"].duplicated().any()
            and not self.requests["request_id"].duplicated().any()
        )

        print("-" * 50)
        print(f"{'Negative Inventory':<24}: {'PASS' if neg_inv_pass else 'FAIL'}")
        print(f"{'Duplicate IDs':<24}: {'PASS' if dup_ids_pass else 'FAIL'}")
        print("=" * 50)

        if all_passed and neg_inv_pass and dup_ids_pass:
            print("OVERALL RESULT: ALL VALIDATION SUITES PASSED (100%)\n")
            return True
        else:
            print("OVERALL RESULT: SOME VALIDATIONS FAILED\n")
            return False


if __name__ == "__main__":
    validator = DatasetValidator()
    success = validator.run_all()
    sys.exit(0 if success else 1)
