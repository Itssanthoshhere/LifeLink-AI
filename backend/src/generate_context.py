"""
AI Blood Supply Command Center - External Context Generator
------------------------------------------------------------
Generates daily external environmental, meteorological, and calendar context
(events_context.csv) for demand forecasting and operational planning.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config


def generate_context(
    start_date: str = config.START_DATE,
    days: int = config.SIMULATION_DAYS,
    seed: int = config.RANDOM_SEED,
) -> pd.DataFrame:
    """
    Generate daily external context features.

    Returns:
        pd.DataFrame matching events_context.csv specification.
    """
    np.random.seed(seed + 404)
    base_date = datetime.strptime(start_date, "%Y-%m-%d")

    records = []

    # Map festival calendar for quick lookup
    festival_map = {}
    for fest in config.FESTIVALS:
        festival_map[(fest["month"], fest["day"])] = fest

    for d in range(days):
        cur_date = base_date + timedelta(days=d)
        date_str = cur_date.strftime("%Y-%m-%d")
        month = cur_date.month
        day = cur_date.day
        dow = cur_date.weekday()

        # 1. Temperature & Weather seasonality
        # Tropical/Subtropical metro temperature cycle
        if month in [3, 4, 5]:  # Summer
            base_temp = 32.0 + np.sin(d / 30.0) * 3.0
            rain_prob = 0.12
        elif month in [6, 7, 8, 9]:  # Monsoon
            base_temp = 26.5 + np.cos(d / 20.0) * 2.0
            rain_prob = 0.58
        elif month in [10, 11]:  # Post-monsoon / Autumn
            base_temp = 25.0
            rain_prob = 0.20
        else:  # Winter (Dec, Jan, Feb)
            base_temp = 21.0 + np.sin(d / 25.0) * 2.0
            rain_prob = 0.05

        temperature = round(float(base_temp + np.random.normal(0, 2.0)), 1)

        # Rainfall
        if np.random.random() < rain_prob:
            if month in [6, 7, 8, 9] and np.random.random() < 0.35:
                rainfall = round(float(np.random.uniform(35.0, 110.0)), 1)
                weather = "Heavy Rain" if rainfall > 65.0 else "Rainy"
            else:
                rainfall = round(float(np.random.uniform(2.0, 30.0)), 1)
                weather = "Rainy"
        else:
            rainfall = 0.0
            weather_choices = ["Sunny", "Cloudy"] if temperature > 24 else ["Cloudy", "Foggy"]
            weather = str(np.random.choice(weather_choices))

        # 2. Holiday & Festival flags
        is_weekend = dow in [5, 6]
        fest_info = festival_map.get((month, day))
        if fest_info:
            festival = fest_info["name"]
            holiday_flag = 1
        else:
            festival = "None"
            holiday_flag = 1 if is_weekend else 0

        # 3. Road Accident Count
        # Elevated during weekend nights, heavy rain, and festival days
        base_accidents = 10.0
        if is_weekend:
            base_accidents += 4.5
        if weather in ["Rainy", "Heavy Rain"]:
            base_accidents += 5.0
        if fest_info:
            base_accidents *= fest_info["trauma_surge"]
        accident_count = int(max(1, np.random.poisson(base_accidents)))

        # 4. Disease Spike Flag (e.g. seasonal vector-borne / dengue / malaria spike in July-September)
        is_monsoon_peak = (month in [7, 8, 9])
        disease_spike_flag = 1 if (is_monsoon_peak and np.random.random() < 0.65) else 0

        # 5. Blood Drive Flag (Scheduled public/corporate donation campaigns)
        # More common on weekends or specific non-holiday dates
        blood_drive_flag = 1 if (is_weekend and np.random.random() < 0.40) else (
            1 if np.random.random() < 0.12 else 0
        )

        # 6. Transport Disruption Flag (protests, waterlogging, infrastructure work)
        transport_disruption_flag = 1 if (weather == "Heavy Rain" or (np.random.random() < 0.035)) else 0

        records.append({
            "date": date_str,
            "city": config.CITY_NAME,
            "temperature": temperature,
            "rainfall": rainfall,
            "weather": weather,
            "holiday_flag": holiday_flag,
            "festival": festival,
            "accident_count": accident_count,
            "disease_spike_flag": disease_spike_flag,
            "blood_drive_flag": blood_drive_flag,
            "transport_disruption_flag": transport_disruption_flag,
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    df = generate_context()
    out_path = config.DATA_RAW_DIR / "events_context.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} context days -> {out_path}")
