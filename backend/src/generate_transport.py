"""
AI Blood Supply Command Center - Transport Network Generator
-------------------------------------------------------------
Constructs the transit network between Blood Banks and Hospitals,
and inter-hospital routes for peer transfers.
Calculates realistic road distances from spatial coordinates,
evaluates travel times factoring traffic congestion, and models route disruptions.
"""

import sys
import math
from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth in km.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def generate_transport_network(
    hospitals_df: Optional[pd.DataFrame] = None,
    blood_banks_df: Optional[pd.DataFrame] = None,
    seed: int = config.RANDOM_SEED,
) -> pd.DataFrame:
    """
    Generate transport routes connecting blood banks to hospitals and
    inter-hospital transfer links.

    Returns:
        pd.DataFrame with columns matching transport_network.csv specification.
    """
    np.random.seed(seed + 202)

    if hospitals_df is None:
        from generate_hospitals import generate_hospitals
        hospitals_df = generate_hospitals(seed=seed)

    if blood_banks_df is None:
        from generate_blood_banks import generate_blood_banks
        blood_banks_df = generate_blood_banks(seed=seed)

    routes = []
    route_counter = 1

    # 1. Routes from Blood Banks to Hospitals (Primary Supply Chain)
    for _, bb in blood_banks_df.iterrows():
        for _, hosp in hospitals_df.iterrows():
            euclidean_dist = haversine_distance_km(
                bb["latitude"], bb["longitude"], hosp["latitude"], hosp["longitude"]
            )
            # Apply road tortuosity factor to convert straight-line to road distance
            road_dist = max(1.2, round(euclidean_dist * config.ROAD_TORTUOSITY_FACTOR, 2))

            # Base traffic factor: 1.0 (normal) to 1.8 (urban bottleneck)
            traffic_factor = round(np.random.uniform(1.05, 1.45), 2)

            # Travel time in minutes
            speed_kmh = config.AVG_TRANSPORT_SPEED_KMH
            travel_time = round((road_dist / speed_kmh) * 60.0 * traffic_factor, 1)

            # Cold-chain transport capacity (cooler containers / vans)
            capacity = int(np.random.choice([30, 50, 80, 100, 120]))

            # Status: Active (94%), Congested (4%), Disrupted (2%)
            status_roll = np.random.random()
            if status_roll > 0.96:
                route_status = "Disrupted"
            elif status_roll > 0.90:
                route_status = "Congested"
            else:
                route_status = "Active"

            routes.append({
                "route_id": f"RT_{route_counter:05d}",
                "source_id": bb["blood_bank_id"],
                "source_type": "Blood_Bank",
                "destination_id": hosp["hospital_id"],
                "destination_type": "Hospital",
                "distance_km": road_dist,
                "travel_time_minutes": travel_time,
                "transport_capacity": capacity,
                "traffic_factor": traffic_factor,
                "route_status": route_status,
            })
            route_counter += 1

    # 2. Inter-Hospital Emergency Sharing Routes (between nearest hospitals, e.g., within 18 km)
    hosp_records = hospitals_df.to_dict("records")
    for i in range(len(hosp_records)):
        for j in range(len(hosp_records)):
            if i == j:
                continue
            h1 = hosp_records[i]
            h2 = hosp_records[j]
            euclidean_dist = haversine_distance_km(
                h1["latitude"], h1["longitude"], h2["latitude"], h2["longitude"]
            )
            road_dist = max(1.0, round(euclidean_dist * config.ROAD_TORTUOSITY_FACTOR, 2))

            # Only establish direct inter-hospital emergency routes for reasonable distance (< 20km)
            # or if either hospital is a Trauma/Teaching tertiary hub
            is_hub = (h1["hospital_type"] in ["Trauma", "Teaching"]) or (
                h2["hospital_type"] in ["Trauma", "Teaching"]
            )
            if road_dist <= 18.0 or (is_hub and road_dist <= 28.0):
                traffic_factor = round(np.random.uniform(1.08, 1.50), 2)
                travel_time = round((road_dist / config.AVG_TRANSPORT_SPEED_KMH) * 60.0 * traffic_factor, 1)
                capacity = int(np.random.choice([20, 30, 40, 60]))

                status_roll = np.random.random()
                if status_roll > 0.97:
                    route_status = "Disrupted"
                elif status_roll > 0.91:
                    route_status = "Congested"
                else:
                    route_status = "Active"

                routes.append({
                    "route_id": f"RT_{route_counter:05d}",
                    "source_id": h1["hospital_id"],
                    "source_type": "Hospital",
                    "destination_id": h2["hospital_id"],
                    "destination_type": "Hospital",
                    "distance_km": road_dist,
                    "travel_time_minutes": travel_time,
                    "transport_capacity": capacity,
                    "traffic_factor": traffic_factor,
                    "route_status": route_status,
                })
                route_counter += 1

    df = pd.DataFrame(routes)
    return df


if __name__ == "__main__":
    df = generate_transport_network()
    out_path = config.DATA_RAW_DIR / "transport_network.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} routes -> {out_path}")
