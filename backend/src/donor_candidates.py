"""
AI Blood Supply Command Center - Donor Candidate Generation
------------------------------------------------------------
Implements strict, multi-stage donor eligibility filtering and spatial candidate
retrieval prior to candidate ranking.

Applies:
1. Blood group compatibility filtering (ABO/Rh rules per component)
2. Inter-donation interval restriction (>= 90 days) & synthetic medical eligibility
3. Availability status filtering (excluding inactive donors)
4. Geographic proximity constraints (Haversine distance & travel time)

LOGISTICS PROTOTYPE NOTICE:
This module filters synthetic donor candidates for operational outreach prioritization.
It does NOT make medical suitability decisions or replace clinical donor screening.
"""

from datetime import datetime
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"

import sys
sys.path.insert(0, str(PROJECT_ROOT / "src"))
import config
from blood_compatibility import is_compatible_donor_group, get_compatible_donors


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute great-circle distance between two GPS points using the Haversine formula.
    """
    R = 6371.0  # Earth's radius in kilometers
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def get_hospital_coordinates(hospital_id: str, hospitals_csv: Path = DATA_RAW / "hospitals.csv") -> Tuple[float, float, str]:
    """
    Retrieve latitude, longitude, and hospital name for a given hospital_id.
    """
    hosps = pd.read_csv(hospitals_csv)
    match = hosps[hosps["hospital_id"] == hospital_id]
    if match.empty:
        raise ValueError(f"Unknown hospital_id: {hospital_id}")
    row = match.iloc[0]
    return float(row["latitude"]), float(row["longitude"]), str(row["hospital_name"])


def generate_donor_candidates(
    hospital_id: str,
    blood_group: str,
    component: str = "RBC",
    urgency: str = "routine",
    required_units: int = 1,
    prediction_horizon: str = "24h",
    reference_date_str: str = "2025-12-31",
    max_distance_km: Optional[float] = None,
    donors_csv: Path = DATA_RAW / "donors.csv",
    hospitals_csv: Path = DATA_RAW / "hospitals.csv",
) -> pd.DataFrame:
    """
    Produce the eligible, unranked donor candidate pool for a target hospital need.

    Parameters:
        hospital_id: Destination hospital requiring blood (e.g. 'HOSP_007')
        blood_group: Required recipient blood group (e.g. 'O_NEG')
        component: Blood component requested ('RBC', 'Platelets', 'Plasma', 'Whole_Blood')
        urgency: Outreach urgency tier ('routine', 'urgent', 'emergency')
        required_units: Target units sought
        prediction_horizon: Shortage horizon ('24h', '48h', '72h')
        reference_date_str: Snapshot date to evaluate donation interval
        max_distance_km: Optional explicit distance ceiling in kilometers
        donors_csv: Path to donors dataset
        hospitals_csv: Path to hospitals dataset

    Returns:
        pd.DataFrame containing all eligible candidates with spatial and history attributes.
        Returns empty DataFrame with matching schema if no candidates qualify.
    """
    urgency = urgency.lower()
    if urgency not in config.DONOR_URGENCY_LEVELS:
        raise ValueError(f"Invalid urgency: '{urgency}'. Must be one of {config.DONOR_URGENCY_LEVELS}")

    # 1. Resolve Hospital Coordinates
    h_lat, h_lon, h_name = get_hospital_coordinates(hospital_id, hospitals_csv)

    # 2. Determine Distance Limit
    if max_distance_km is not None:
        effective_max_km = max_distance_km
    elif urgency == "emergency":
        effective_max_km = config.DONOR_MAX_TRAVEL_DISTANCE_EMERGENCY_KM
    else:
        effective_max_km = config.DONOR_MAX_TRAVEL_DISTANCE_KM

    # 3. Load Donors
    donors_df = pd.read_csv(donors_csv)
    ref_date = datetime.strptime(reference_date_str, "%Y-%m-%d")

    # 4. Filter 1: Medical / Synthetic Eligibility Flag
    # In the dataset, eligible == True indicates clinical clearance (no deferrals)
    candidates = donors_df[donors_df["eligible"] == True].copy()  # noqa: E712

    # 5. Filter 2: Inter-donation Interval Restriction
    candidates["last_donation_dt"] = pd.to_datetime(candidates["last_donation_date"])
    candidates["days_since_last_donation"] = (ref_date - candidates["last_donation_dt"]).dt.days
    candidates = candidates[candidates["days_since_last_donation"] >= config.DONOR_MIN_DAYS_BETWEEN_DONATIONS].copy()

    # 6. Filter 3: Availability Status
    # In emergencies, both 'Available' and 'Busy' donors can be considered (Busy with rank penalty).
    # In routine/urgent, only 'Available' donors are eligible. 'Inactive' is always excluded.
    if urgency == "emergency":
        candidates = candidates[candidates["availability"].isin(["Available", "Busy"])].copy()
    else:
        candidates = candidates[candidates["availability"] == "Available"].copy()

    if candidates.empty:
        return _empty_candidates_dataframe()

    # 7. Filter 4: Blood Compatibility
    compatible_groups = get_compatible_donors(blood_group, component)
    candidates = candidates[candidates["blood_group"].isin(compatible_groups)].copy()

    if candidates.empty:
        return _empty_candidates_dataframe()

    # 8. Filter 5: Spatial Proximity & Travel Time
    # Calculate direct Haversine distance
    lats = candidates["latitude"].values
    lons = candidates["longitude"].values

    dists = np.array([
        haversine_distance_km(d_lat, d_lon, h_lat, h_lon)
        for d_lat, d_lon in zip(lats, lons)
    ])
    candidates["distance_km"] = np.round(dists, 2)

    # Filter within geographic radius
    candidates = candidates[candidates["distance_km"] <= effective_max_km].copy()

    if candidates.empty:
        return _empty_candidates_dataframe()

    # Driving distance (road tortuosity) and estimated travel time in minutes
    candidates["estimated_driving_km"] = np.round(candidates["distance_km"] * config.ROAD_TORTUOSITY_FACTOR, 2)
    candidates["estimated_travel_time_min"] = np.round(
        (candidates["estimated_driving_km"] / config.AVG_TRANSPORT_SPEED_KMH) * 60.0, 1
    )

    # 9. Attach Metadata & Compatibility Detail
    candidates["hospital_id"] = hospital_id
    candidates["hospital_name"] = h_name
    candidates["requested_blood_group"] = blood_group
    candidates["requested_component"] = component
    candidates["urgency"] = urgency
    candidates["required_units"] = required_units
    candidates["prediction_horizon"] = prediction_horizon
    candidates["exact_match"] = (candidates["blood_group"] == blood_group).astype(int)
    candidates["compatibility_type"] = np.where(
        candidates["exact_match"] == 1, "EXACT_MATCH", "COMPATIBLE_ALTERNATIVE"
    )
    candidates["eligibility_status"] = "ELIGIBLE"

    candidates.reset_index(drop=True, inplace=True)
    return candidates


def _empty_candidates_dataframe() -> pd.DataFrame:
    """Return an empty DataFrame with the full expected schema."""
    cols = [
        "donor_id", "blood_group", "latitude", "longitude", "last_donation_date",
        "eligible", "availability", "donation_count", "response_probability",
        "average_response_time_minutes", "days_since_last_donation",
        "distance_km", "estimated_driving_km", "estimated_travel_time_min",
        "hospital_id", "hospital_name", "requested_blood_group",
        "requested_component", "urgency", "required_units", "prediction_horizon",
        "exact_match", "compatibility_type", "eligibility_status"
    ]
    return pd.DataFrame(columns=cols)
