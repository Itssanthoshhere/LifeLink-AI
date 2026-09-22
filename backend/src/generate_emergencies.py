"""
AI Blood Supply Command Center - Emergency Events Generator
-----------------------------------------------------------
Generates 200–500 realistic emergency events over the 2-year simulation period.
Events dynamically link to affected hospitals, blood banks, and transit routes,
altering demand multipliers and inventory availability.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config


def generate_emergency_events(
    hospitals_df: Optional[pd.DataFrame] = None,
    blood_banks_df: Optional[pd.DataFrame] = None,
    context_df: Optional[pd.DataFrame] = None,
    seed: int = config.RANDOM_SEED,
) -> pd.DataFrame:
    """
    Generate chronological emergency incidents over the simulation period.

    Returns:
        pd.DataFrame matching emergency_events.csv specification.
    """
    np.random.seed(seed + 505)

    if hospitals_df is None:
        from generate_hospitals import generate_hospitals
        hospitals_df = generate_hospitals(seed=seed)

    if blood_banks_df is None:
        from generate_blood_banks import generate_blood_banks
        blood_banks_df = generate_blood_banks(seed=seed)

    if context_df is None:
        from generate_context import generate_context
        context_df = generate_context(seed=seed)

    hospital_ids = hospitals_df["hospital_id"].tolist()
    blood_bank_ids = blood_banks_df["blood_bank_id"].tolist()
    trauma_hospitals = hospitals_df[hospitals_df["hospital_type"] == "Trauma"]["hospital_id"].tolist()
    if not trauma_hospitals:
        trauma_hospitals = hospital_ids[:3]

    num_days = len(context_df)
    events = []
    event_counter = 1

    # Frequency target: ~300-350 events over 730 days (~0.45 events/day)
    for d_idx, row in context_df.iterrows():
        date_str = row["date"]
        base_dt = datetime.strptime(date_str, "%Y-%m-%d")

        # Probability of an event occurring today
        # Higher if disease spike, heavy rain, or high accident count
        event_prob = 0.35
        if row["disease_spike_flag"] == 1:
            event_prob += 0.25
        if row["weather"] in ["Heavy Rain", "Rainy"]:
            event_prob += 0.15
        if row["festival"] != "None":
            event_prob += 0.20

        # Number of events on this day (0, 1, or occasionally 2)
        roll = np.random.random()
        if roll < event_prob:
            daily_events = 1
            if roll < 0.10:  # Rare double event
                daily_events = 2
        else:
            daily_events = 0

        for _ in range(daily_events):
            # Select event type
            if row["disease_spike_flag"] == 1 and np.random.random() < 0.40:
                event_type = "disease_spike"
            elif row["transport_disruption_flag"] == 1 and np.random.random() < 0.30:
                event_type = "transport_disruption"
            else:
                type_weights = [0.30, 0.12, 0.14, 0.05, 0.15, 0.10, 0.06, 0.08]
                event_type = np.random.choice(config.EMERGENCY_EVENT_TYPES, p=type_weights)

            # Severity distribution
            sev_weights = [0.45, 0.33, 0.16, 0.06]
            severity = np.random.choice(["Minor", "Moderate", "Severe", "Critical"], p=sev_weights)
            sev_prof = config.EMERGENCY_SEVERITY_PROFILES[severity]

            # Timestamp within the day
            hour = int(np.random.randint(0, 24))
            minute = int(np.random.choice([0, 15, 30, 45]))
            event_dt = base_dt + timedelta(hours=hour, minutes=minute)
            timestamp_str = event_dt.strftime("%Y-%m-%d %H:%M:%S")

            # Duration and demand multiplier
            duration_hours = int(np.random.randint(sev_prof["duration_hours"][0], sev_prof["duration_hours"][1] + 1))
            mult_min, mult_max = sev_prof["multiplier_range"]
            blood_demand_multiplier = round(float(np.random.uniform(mult_min, mult_max)), 2)

            # Estimated casualties / patients
            p_min, p_max = sev_prof["patients"]
            estimated_patients = int(np.random.randint(p_min, p_max + 1))

            # Location and affected facilities
            if event_type == "blood_bank_failure":
                # Occurs directly at a blood bank
                target_bb = np.random.choice(blood_bank_ids)
                location_id = target_bb
                # Nearby hospitals affected by this blood bank's outage
                affected_hosps = np.random.choice(hospital_ids, size=int(np.random.randint(2, 5)), replace=False).tolist()
                # Blood bank failure doesn't increase patient demand directly, but creates supply constraint
                blood_demand_multiplier = 1.0
            elif event_type == "transport_disruption":
                location_id = f"CORRIDOR_{np.random.choice(['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'])}"
                affected_hosps = np.random.choice(hospital_ids, size=int(np.random.randint(2, 4)), replace=False).tolist()
                blood_demand_multiplier = 1.0
            elif event_type in ["road_accident", "mass_casualty", "industrial_accident"]:
                location_id = f"SECTOR_{np.random.randint(1, 15):02d}"
                # Primary trauma center receives major brunt, plus 1-2 nearby general/teaching hospitals
                primary_trauma = np.random.choice(trauma_hospitals)
                other_hosps = [h for h in hospital_ids if h != primary_trauma]
                additional = np.random.choice(other_hosps, size=int(np.random.randint(1, 3)), replace=False).tolist()
                affected_hosps = [primary_trauma] + additional
            else:  # disease_spike, surgery_surge, natural_disaster
                location_id = f"METRO_DISTRICT_{np.random.choice(['A', 'B', 'C', 'D'])}"
                num_affected = int(np.random.randint(3, 7))
                affected_hosps = np.random.choice(hospital_ids, size=num_affected, replace=False).tolist()

            events.append({
                "event_id": f"EVT_{event_counter:04d}",
                "timestamp": timestamp_str,
                "location_id": location_id,
                "event_type": event_type,
                "severity": severity,
                "affected_hospitals": ",".join(affected_hosps),
                "estimated_patients": estimated_patients,
                "blood_demand_multiplier": blood_demand_multiplier,
                "duration_hours": duration_hours,
            })
            event_counter += 1

    df = pd.DataFrame(events)
    return df


if __name__ == "__main__":
    df = generate_emergency_events()
    out_path = config.DATA_RAW_DIR / "emergency_events.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} emergency events -> {out_path}")
