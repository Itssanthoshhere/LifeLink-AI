"""
AI Blood Supply Command Center - Blood Bank Generator
-----------------------------------------------------
Generates synthetic blood banks (Regional Hubs and District Centers)
with varied storage capacities, daily collection capabilities,
and 24/7 emergency support capabilities.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config


def generate_blood_banks(
    num_blood_banks: int = config.NUM_BLOOD_BANKS,
    seed: int = config.RANDOM_SEED,
) -> pd.DataFrame:
    """
    Generate synthetic blood bank entities.

    Returns:
        pd.DataFrame with columns matching specification.
    """
    np.random.seed(seed + 101)

    names = [
        "Metropolitan Central Blood Transfusion Center",
        "Red Cross Apex Blood Center",
        "City Health Authority Blood Bank",
        "North District Community Blood Center",
        "South Valley Regional Blood Bank",
        "Eastside Memorial Blood Bank",
        "West End Voluntary Blood Foundation",
        "Lakeside District Blood Center",
        "University Medical Blood Services",
        "Highland Emergency Blood Reserve",
    ]

    records = []
    # 3 major regional hubs, 7 district blood centers
    num_hubs = 3
    num_district = num_blood_banks - num_hubs

    types = ["Regional_Hub"] * num_hubs + ["District_Center"] * num_district

    for i in range(num_blood_banks):
        bid = f"BB_{i + 1:03d}"
        btype = types[i]
        bname = names[i] if i < len(names) else f"Civic Blood Center {i + 1}"

        profile = config.BLOOD_BANK_PROFILES[btype]

        # Spatial distribution: Regional hubs located near central arterial transit;
        # District centers distributed across sectors
        is_hub = (btype == "Regional_Hub")
        spread_km = (config.LAT_SPREAD_KM * 0.35) if is_hub else (config.LAT_SPREAD_KM * 0.85)
        d_lat = np.random.normal(0, spread_km / config.KM_PER_DEG_LAT)
        d_lon = np.random.normal(0, spread_km / config.KM_PER_DEG_LON)
        lat = round(config.CENTER_LAT + d_lat, 6)
        lon = round(config.CENTER_LON + d_lon, 6)

        storage_min, storage_max = profile["storage_capacity_range"]
        storage_capacity = int(np.random.randint(storage_min, storage_max + 1))

        coll_min, coll_max = profile["daily_collection_range"]
        daily_collection_capacity = int(np.random.randint(coll_min, coll_max + 1))

        # 90% have emergency support, hubs always have emergency support
        emergency_support = True if is_hub else (np.random.random() < 0.85)

        operational_status = "Operational" if np.random.random() > 0.05 else "Maintenance"

        records.append({
            "blood_bank_id": bid,
            "name": bname,
            "city": config.CITY_NAME,
            "latitude": lat,
            "longitude": lon,
            "storage_capacity": storage_capacity,
            "daily_collection_capacity": daily_collection_capacity,
            "emergency_support": emergency_support,
            "operational_status": operational_status,
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    df = generate_blood_banks()
    out_path = config.DATA_RAW_DIR / "blood_banks.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} blood banks -> {out_path}")
