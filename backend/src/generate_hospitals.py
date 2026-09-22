"""
AI Blood Supply Command Center - Hospital Generator
---------------------------------------------------
Generates synthetic hospitals with realistic bed capacities, ICU sizing,
blood storage capacities, baseline demand profiles, and geographical clustering.
No real clinical PII used.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd

# Add parent directory to path to allow direct execution
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config


def generate_hospitals(
    num_hospitals: int = config.NUM_HOSPITALS,
    seed: int = config.RANDOM_SEED,
) -> pd.DataFrame:
    """
    Generate synthetic hospital entities with realistic attributes.

    Returns:
        pd.DataFrame with columns matching specification.
    """
    np.random.seed(seed)

    # Base prefixes and suffixes for realistic synthetic facility naming
    name_prefixes = [
        "Metro", "Apex", "City", "Central", "Northside", "Southside",
        "Valley", "Highland", "Mercy", "Riverside", "St. Jude", "Trinity",
        "Pinnacle", "Crestview", "Summit", "Beacon", "Hope", "Good Samaritan",
        "University", "Memorial", "Oakridge", "Grandview", "Lakeside",
        "Civic", "Heritage", "Presbyterian", "Children & Women", "Sunrise",
        "Parkway", "Metropolitan"
    ]
    name_suffixes = [
        "Medical Center", "General Hospital", "Health Institute",
        "Trauma Center", "Memorial Hospital", "Super Specialty Hospital",
        "Teaching Hospital", "Care Center", "Infirmary", "Hospital & Clinics"
    ]

    hospital_types = list(config.HOSPITAL_TYPE_PROFILES.keys())
    type_weights = [config.HOSPITAL_TYPE_PROFILES[t]["weight"] for t in hospital_types]
    type_weights = np.array(type_weights) / sum(type_weights)

    assigned_types = np.random.choice(
        hospital_types, size=num_hospitals, p=type_weights
    )

    # Ensure at least 3 Trauma and 3 Teaching hospitals for realistic emergency handling
    trauma_count = sum(t == "Trauma" for t in assigned_types)
    teaching_count = sum(t == "Teaching" for t in assigned_types)
    idx = 0
    while trauma_count < 3 and idx < num_hospitals:
        if assigned_types[idx] not in ["Trauma", "Teaching"]:
            assigned_types[idx] = "Trauma"
            trauma_count += 1
        idx += 1
    idx = 0
    while teaching_count < 3 and idx < num_hospitals:
        if assigned_types[idx] not in ["Trauma", "Teaching"]:
            assigned_types[idx] = "Teaching"
            teaching_count += 1
        idx += 1

    records = []
    used_names = set()

    # Spatial clusters: Central Urban Core (60%), Suburban Ring (40%)
    for i in range(num_hospitals):
        hid = f"HOSP_{i + 1:03d}"
        htype = assigned_types[i]
        profile = config.HOSPITAL_TYPE_PROFILES[htype]

        # Name synthesis
        prefix = name_prefixes[i % len(name_prefixes)]
        suffix = profile_suffix = "Trauma Center" if htype == "Trauma" else (
            "Teaching Hospital" if htype == "Teaching" else np.random.choice(name_suffixes)
        )
        hname = f"{prefix} {suffix}"
        count = 2
        while hname in used_names:
            hname = f"{prefix} {suffix} {count}"
            count += 1
        used_names.add(hname)

        # Geolocation: Gaussian cluster around metropolitan center
        is_core = np.random.random() < 0.65
        spread_km = (config.LAT_SPREAD_KM * 0.4) if is_core else config.LAT_SPREAD_KM
        d_lat = np.random.normal(0, spread_km / config.KM_PER_DEG_LAT)
        d_lon = np.random.normal(0, spread_km / config.KM_PER_DEG_LON)
        lat = round(config.CENTER_LAT + d_lat, 6)
        lon = round(config.CENTER_LON + d_lon, 6)

        # Capacities
        beds = int(np.random.randint(profile["bed_capacity"][0], profile["bed_capacity"][1] + 1))
        icu_ratio = np.random.uniform(profile["icu_ratio"][0], profile["icu_ratio"][1])
        icu_capacity = int(round(beds * icu_ratio))

        storage_ratio = np.random.uniform(profile["blood_storage_ratio"][0], profile["blood_storage_ratio"][1])
        blood_storage_capacity = int(round(beds * storage_ratio))

        # Avg daily demand in units
        demand_min, demand_max = profile["avg_daily_demand_range"]
        # Scale demand slightly with bed capacity
        bed_factor = beds / ((profile["bed_capacity"][0] + profile["bed_capacity"][1]) / 2.0)
        avg_daily_demand = round(np.random.uniform(demand_min, demand_max) * bed_factor, 1)

        # Emergency capacity
        em_min, em_max = profile["emergency_capacity"]
        emergency_capacity = int(np.random.randint(em_min, em_max + 1))

        # Operational status: mostly operational
        status_roll = np.random.random()
        operational_status = "Operational" if status_roll > 0.05 else "Reduced Capacity"

        records.append({
            "hospital_id": hid,
            "hospital_name": hname,
            "city": config.CITY_NAME,
            "latitude": lat,
            "longitude": lon,
            "hospital_type": htype,
            "bed_capacity": beds,
            "icu_capacity": icu_capacity,
            "blood_storage_capacity": blood_storage_capacity,
            "avg_daily_demand": avg_daily_demand,
            "emergency_capacity": emergency_capacity,
            "operational_status": operational_status,
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    df = generate_hospitals()
    out_path = config.DATA_RAW_DIR / "hospitals.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} hospitals -> {out_path}")
