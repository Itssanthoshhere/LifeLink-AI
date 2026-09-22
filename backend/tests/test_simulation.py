"""
AI Blood Supply Command Center - Unit & Integration Test Suite
---------------------------------------------------------------
Tests compatibility logic, transport network constraints, donor eligibility intervals,
component shelf-life rules, and dataset validation.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
import pytest
import pandas as pd

# Add src to path
SRC_DIR = Path(__file__).resolve().parent.parent / "src"
sys.path.insert(0, str(SRC_DIR))

import config
from blood_compatibility import (
    is_compatible,
    get_compatible_donors,
    get_compatible_recipients,
    RBC_COMPATIBILITY,
    PLASMA_COMPATIBILITY,
)
from generate_transport import haversine_distance_km
from generate_hospitals import generate_hospitals
from generate_blood_banks import generate_blood_banks
from generate_donors import generate_donors


class TestBloodCompatibility:
    """Validate clinical transfusion compatibility rules."""

    def test_universal_rbc_donor(self):
        """O_NEG must be able to donate RBCs to all 8 blood groups."""
        for recipient in config.BLOOD_GROUPS:
            assert is_compatible("O_NEG", recipient, component="RBC"), (
                f"O_NEG should be compatible with {recipient} for RBC"
            )

    def test_universal_rbc_recipient(self):
        """AB_POS must be able to safely receive RBCs from all 8 blood groups."""
        for donor in config.BLOOD_GROUPS:
            assert is_compatible(donor, "AB_POS", component="RBC"), (
                f"AB_POS should be able to receive RBC from {donor}"
            )

    def test_rh_negative_cannot_receive_rh_positive(self):
        """Rh- recipients must NEVER receive Rh+ RBCs to prevent alloimmunization."""
        rh_negatives = ["O_NEG", "A_NEG", "B_NEG", "AB_NEG"]
        rh_positives = ["O_POS", "A_POS", "B_POS", "AB_POS"]
        for recipient in rh_negatives:
            for donor in rh_positives:
                assert not is_compatible(donor, recipient, component="RBC"), (
                    f"Forbidden: Rh+ {donor} cannot donate RBC to Rh- {recipient}"
                )

    def test_universal_plasma_donor(self):
        """Inverted ABO for plasma: AB is the universal plasma donor."""
        for recipient in config.BLOOD_GROUPS:
            assert is_compatible("AB_POS", recipient, component="Plasma") or is_compatible("AB_NEG", recipient, component="Plasma"), (
                f"AB plasma should be universally accepted by {recipient}"
            )

    def test_self_compatibility(self):
        """Any blood group must be 100% compatible with itself across all components."""
        for bg in config.BLOOD_GROUPS:
            for comp in config.BLOOD_COMPONENTS:
                assert is_compatible(bg, bg, component=comp), (
                    f"{bg} must be self-compatible for {comp}"
                )


class TestSpatialAndTransport:
    """Validate distance metrics and spatial clustering."""

    def test_haversine_known_distance(self):
        """Known approximate distance check: identical points = 0 km."""
        dist = haversine_distance_km(12.9716, 77.5946, 12.9716, 77.5946)
        assert dist == 0.0

    def test_haversine_realistic_spread(self):
        """Points 0.1 degree apart latitude (~11.1 km)."""
        dist = haversine_distance_km(12.0, 77.0, 12.1, 77.0)
        assert 10.0 <= dist <= 12.0


class TestClinicalRulesAndShelfLife:
    """Verify component shelf lives against clinical standards."""

    def test_component_shelf_life_rules(self):
        assert config.COMPONENT_RULES["RBC"]["shelf_life_days"] == 42
        assert config.COMPONENT_RULES["Platelets"]["shelf_life_days"] == 5
        assert config.COMPONENT_RULES["Plasma"]["shelf_life_days"] == 365
        assert config.COMPONENT_RULES["Whole_Blood"]["shelf_life_days"] == 35

    def test_donor_eligibility_interval(self):
        """Donors who donated < 90 days ago must not be marked eligible."""
        df = generate_donors(num_donors=200, seed=123, reference_date_str="2025-12-31")
        ref_dt = datetime.strptime("2025-12-31", "%Y-%m-%d")

        for _, row in df.iterrows():
            last_dt = datetime.strptime(row["last_donation_date"], "%Y-%m-%d")
            days_since = (ref_dt - last_dt).days
            if days_since < config.DONOR_MIN_INTERVAL_DAYS:
                assert not row["eligible"], (
                    f"Donor {row['donor_id']} was marked eligible with only {days_since} days since last donation (< 90d)"
                )


class TestEntityGeneration:
    """Check entity row counts and mandatory column existence."""

    def test_hospitals_generation(self):
        df = generate_hospitals(num_hospitals=30, seed=42)
        assert len(df) == 30
        assert "hospital_id" in df.columns
        assert "bed_capacity" in df.columns
        assert (df["bed_capacity"] > 0).all()

    def test_blood_banks_generation(self):
        df = generate_blood_banks(num_blood_banks=10, seed=42)
        assert len(df) == 10
        assert "blood_bank_id" in df.columns
        assert (df["storage_capacity"] > 0).all()
