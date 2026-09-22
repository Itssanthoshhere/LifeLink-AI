"""
AI Blood Supply Command Center - Daily Blood Demand Generator
--------------------------------------------------------------
Generates 2 years of daily historical blood demand per hospital per blood group.
Incorporates baseline hospital size, clinical blood group distribution,
surgery schedules, weekend trauma patterns, seasonality, festivals,
and linked emergency event multipliers.
"""

import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config


def get_season(month: int) -> str:
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Summer"
    elif month in [6, 7, 8, 9]:
        return "Monsoon"
    else:
        return "Autumn"


def generate_daily_demand(
    hospitals_df: Optional[pd.DataFrame] = None,
    context_df: Optional[pd.DataFrame] = None,
    emergency_events_df: Optional[pd.DataFrame] = None,
    seed: int = config.RANDOM_SEED,
) -> pd.DataFrame:
    """
    Generate daily demand data across all hospitals and blood groups for 2 years.

    Returns:
        pd.DataFrame matching daily_demand.csv specification.
    """
    np.random.seed(seed + 606)

    if hospitals_df is None:
        from generate_hospitals import generate_hospitals
        hospitals_df = generate_hospitals(seed=seed)

    if context_df is None:
        from generate_context import generate_context
        context_df = generate_context(seed=seed)

    if emergency_events_df is None:
        from generate_emergencies import generate_emergency_events
        emergency_events_df = generate_emergency_events(hospitals_df=hospitals_df, context_df=context_df, seed=seed)

    # Pre-index emergency events by (date, hospital_id) -> multiplier
    emergency_map: Dict[str, Dict[str, float]] = {}
    for _, evt in emergency_events_df.iterrows():
        evt_date = evt["timestamp"][:10]
        mult = float(evt["blood_demand_multiplier"])
        affected = [h.strip() for h in str(evt["affected_hospitals"]).split(",") if h.strip()]
        if evt_date not in emergency_map:
            emergency_map[evt_date] = {}
        for hid in affected:
            current_max = emergency_map[evt_date].get(hid, 1.0)
            emergency_map[evt_date][hid] = max(current_max, mult)

    hosp_records = hospitals_df.set_index("hospital_id").to_dict("index")
    blood_groups = config.BLOOD_GROUPS
    bg_probs = config.BLOOD_GROUP_DISTRIBUTION

    demand_records = []

    for _, c_row in context_df.iterrows():
        cur_date_str = c_row["date"]
        dt = datetime.strptime(cur_date_str, "%Y-%m-%d")
        month = dt.month
        dow = dt.weekday()
        season = get_season(month)
        fest_flag = int(c_row["holiday_flag"]) if c_row["festival"] != "None" else 0
        disease_spike = int(c_row["disease_spike_flag"])

        # Context factors
        surg_dow_factor = config.DAY_OF_WEEK_SURGERY_MULTIPLIERS.get(dow, 1.0)
        trauma_dow_factor = config.DAY_OF_WEEK_TRAUMA_MULTIPLIERS.get(dow, 1.0)
        season_factor = config.SEASONAL_MONTH_FACTORS.get(month, 1.0)

        daily_emergency_for_date = emergency_map.get(cur_date_str, {})

        for hid, h_info in hosp_records.items():
            avg_daily_units = h_info["avg_daily_demand"]
            htype = h_info["hospital_type"]

            # Emergency event multiplier for this specific hospital on this date
            emergency_mult = daily_emergency_for_date.get(hid, 1.0)

            # Baseline breakdown:
            # - Scheduled surgeries: ~50% in General/Teaching, 25% in Trauma
            # - Trauma: ~50% in Trauma, 25% in General, 15% in Specialty
            # - Routine / Acute Emergency: remainder
            if htype == "Trauma":
                base_surg_share = 0.25
                base_trauma_share = 0.55
                base_emerg_share = 0.20
            elif htype == "Teaching":
                base_surg_share = 0.50
                base_trauma_share = 0.30
                base_emerg_share = 0.20
            elif htype == "Specialty":
                base_surg_share = 0.65
                base_trauma_share = 0.15
                base_emerg_share = 0.20
            else:  # General, Government, Private
                base_surg_share = 0.45
                base_trauma_share = 0.35
                base_emerg_share = 0.20

            # Disease spike adds to emergency medical transfusions (e.g. platelets/RBC for severe dengue/anemia)
            disease_add_factor = 1.25 if disease_spike == 1 else 1.0

            for bg in blood_groups:
                bg_share = bg_probs[bg]

                # Hospital demand for this blood group
                bg_daily_units = avg_daily_units * bg_share * season_factor

                # 1. Scheduled surgery units (dipping on weekends)
                surg_lambda = bg_daily_units * base_surg_share * surg_dow_factor
                surg_units = int(np.random.poisson(max(0.05, surg_lambda)))

                # 2. Trauma units (surging on weekends and festivals)
                fest_trauma_mult = 1.30 if fest_flag == 1 else 1.0
                trauma_lambda = bg_daily_units * base_trauma_share * trauma_dow_factor * fest_trauma_mult
                trauma_units = int(np.random.poisson(max(0.05, trauma_lambda)))

                # 3. Emergency units (affected by emergency events and disease spikes)
                emerg_lambda = (
                    bg_daily_units * base_emerg_share * disease_add_factor * emergency_mult
                )
                if emergency_mult > 1.0:
                    # Amplified variance during true emergencies
                    emerg_units = int(np.random.poisson(emerg_lambda + (emergency_mult - 1.0) * 3.5 * bg_share))
                else:
                    emerg_units = int(np.random.poisson(max(0.05, emerg_lambda)))

                total_units = surg_units + trauma_units + emerg_units

                demand_records.append({
                    "date": cur_date_str,
                    "hospital_id": hid,
                    "blood_group": bg,
                    "units_used": total_units,
                    "emergency_units_used": emerg_units,
                    "scheduled_surgery_units": surg_units,
                    "trauma_units": trauma_units,
                    "day_of_week": dt.strftime("%A"),
                    "month": month,
                    "season": season,
                    "festival_flag": fest_flag,
                    "disease_spike_flag": disease_spike,
                })

    df = pd.DataFrame(demand_records)
    return df


if __name__ == "__main__":
    df = generate_daily_demand()
    out_path = config.DATA_RAW_DIR / "daily_demand.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} daily demand records -> {out_path}")
