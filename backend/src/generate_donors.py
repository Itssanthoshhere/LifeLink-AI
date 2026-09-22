"""
AI Blood Supply Command Center - Donor Generator
-------------------------------------------------
Generates 5,000 synthetic blood donors.
Strictly non-PII (no names, phones, emails, or personal identifiers).
Uses realistic population blood group distributions, spatial coordinates,
donation histories, and clinical eligibility based on inter-donation intervals.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config


def generate_donors(
    num_donors: int = config.NUM_DONORS,
    seed: int = config.RANDOM_SEED,
    reference_date_str: str = "2025-12-31",
) -> pd.DataFrame:
    """
    Generate synthetic donor entities.

    Parameters:
        num_donors: number of donor profiles to generate (default 5000)
        seed: random seed for reproducibility
        reference_date_str: reference simulation snapshot date for calculating eligibility

    Returns:
        pd.DataFrame matching donors.csv specification.
    """
    np.random.seed(seed + 303)
    ref_date = datetime.strptime(reference_date_str, "%Y-%m-%d")

    blood_groups = list(config.BLOOD_GROUP_DISTRIBUTION.keys())
    bg_probs = [config.BLOOD_GROUP_DISTRIBUTION[bg] for bg in blood_groups]
    bg_probs = np.array(bg_probs) / sum(bg_probs)

    assigned_blood_groups = np.random.choice(blood_groups, size=num_donors, p=bg_probs)

    records = []
    for i in range(num_donors):
        did = f"DONOR_{i + 1:05d}"
        bg = assigned_blood_groups[i]

        # Donor residence location spread across metropolitan residential & commercial areas
        d_lat = np.random.normal(0, (config.LAT_SPREAD_KM * 0.9) / config.KM_PER_DEG_LAT)
        d_lon = np.random.normal(0, (config.LON_SPREAD_KM * 0.9) / config.KM_PER_DEG_LON)
        lat = round(config.CENTER_LAT + d_lat, 6)
        lon = round(config.CENTER_LON + d_lon, 6)

        # Lifetime donation count
        # 25% first-time / non-donated yet, 50% regular (1-6 times), 25% frequent (7-20 times)
        roll = np.random.random()
        if roll < 0.25:
            donation_count = 0
            # Never donated or last donated very long ago (300 to 700 days ago)
            days_ago = int(np.random.randint(300, 700))
        elif roll < 0.75:
            donation_count = int(np.random.randint(1, 7))
            days_ago = int(np.random.randint(20, 365))
        else:
            donation_count = int(np.random.randint(7, 22))
            days_ago = int(np.random.randint(15, 200))

        last_donation_dt = ref_date - timedelta(days=days_ago)
        last_donation_str = last_donation_dt.strftime("%Y-%m-%d")

        # Clinical eligibility: Must be at least DONOR_MIN_INTERVAL_DAYS (90 days) since last donation
        # Additionally, small percentage might be temporarily medically deferred
        days_since_last = (ref_date - last_donation_dt).days
        is_interval_ok = (days_since_last >= config.DONOR_MIN_INTERVAL_DAYS)

        # 92% of those meeting interval criteria are clinically eligible (8% temporary deferrals: travel, low hemoglobin, etc.)
        temp_deferral = (np.random.random() < 0.08)
        eligible = bool(is_interval_ok and not temp_deferral)

        # Availability status
        avail_roll = np.random.random()
        if not eligible:
            availability = "Inactive"
        elif avail_roll < 0.70:
            availability = "Available"
        elif avail_roll < 0.92:
            availability = "Busy"
        else:
            availability = "Inactive"

        # Response probability & average response time
        response_prob = round(
            float(np.clip(np.random.beta(5, 2), 0.25, 0.98)), 3
        )
        avg_resp_time = int(
            np.clip(np.random.normal(55, 25), 15, 180)
        )

        records.append({
            "donor_id": did,
            "blood_group": bg,
            "latitude": lat,
            "longitude": lon,
            "last_donation_date": last_donation_str,
            "eligible": eligible,
            "availability": availability,
            "donation_count": donation_count,
            "response_probability": response_prob,
            "average_response_time_minutes": avg_resp_time,
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    df = generate_donors()
    out_path = config.DATA_RAW_DIR / "donors.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} donors -> {out_path}")
