"""
AI Blood Supply Command Center - Blood Requests Generator
----------------------------------------------------------
Generates granular clinical blood requests (blood_requests.csv)
triggered by daily hospital demand, emergency surges, and mass casualty events.
Models hospital transfusion requisition orders with high performance.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config


def decompose_demand_to_requests(
    demand_df: pd.DataFrame,
    emergency_events_df: pd.DataFrame,
    seed: int = config.RANDOM_SEED,
) -> pd.DataFrame:
    """
    Decompose daily demand into realistic clinical blood bank requisition orders.

    Urgency distribution:
    - scheduled surgery -> 'routine' (required within 12-24 hrs)
    - trauma units -> 'urgent' or 'emergency' (required within 1-3 hrs)
    - emergency units -> 'emergency' or 'critical' (required within 30 min - 1 hr)

    Returns:
        pd.DataFrame matching blood_requests.csv format.
    """
    rng = np.random.RandomState(seed + 707)

    # Pre-index emergencies by date -> set of affected hospital IDs
    affected_by_date: Dict[str, Set[str]] = {}
    for evt in emergency_events_df.itertuples(index=False):
        dt_str = str(evt.timestamp)[:10]
        if dt_str not in affected_by_date:
            affected_by_date[dt_str] = set()
        hosps = [h.strip() for h in str(evt.affected_hospitals).split(",") if h.strip()]
        affected_by_date[dt_str].update(hosps)

    # Pre-build timestamps lookup
    start_dt = datetime.strptime(config.START_DATE, "%Y-%m-%d")
    date_dt_map = {
        (start_dt + timedelta(days=i)).strftime("%Y-%m-%d"): (start_dt + timedelta(days=i))
        for i in range(config.SIMULATION_DAYS + 10)
    }

    requests = []
    req_counter = 1

    component_names = ["RBC", "Platelets", "Plasma", "Whole_Blood"]
    surg_weights = [0.55, 0.15, 0.20, 0.10]
    trauma_weights = [0.55, 0.10, 0.15, 0.20]
    emerg_weights = [0.60, 0.15, 0.15, 0.10]

    active_demand = demand_df[demand_df["units_used"] > 0]

    for row in active_demand.itertuples(index=False):
        date_str = row.date
        hosp_id = row.hospital_id
        bg = row.blood_group
        dt = date_dt_map[date_str]

        surg = int(row.scheduled_surgery_units)
        trauma = int(row.trauma_units)
        emerg = int(row.emergency_units_used)

        is_affected = hosp_id in affected_by_date.get(date_str, set())

        # 1. Surgery requisition order
        if surg > 0:
            comp = rng.choice(component_names, p=surg_weights)
            hour = int(rng.randint(6, 16))
            minute = int(rng.choice([0, 15, 30, 45]))
            req_by_dt = dt + timedelta(hours=hour + int(rng.randint(12, 24)), minutes=minute)

            requests.append({
                "request_id": f"REQ_{req_counter:06d}",
                "timestamp": f"{date_str} {hour:02d}:{minute:02d}:00",
                "date": date_str,
                "hospital_id": hosp_id,
                "blood_group": bg,
                "component": comp,
                "units_required": surg,
                "urgency": "routine",
                "required_by": req_by_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "status": "pending",
                "fulfilled_from": "unassigned",
            })
            req_counter += 1

        # 2. Trauma requisition order
        if trauma > 0:
            comp = rng.choice(component_names, p=trauma_weights)
            hour = int(rng.randint(0, 24))
            minute = int(rng.choice([0, 15, 30, 45]))
            urgency = "emergency" if rng.random() < 0.35 else "urgent"
            lead_hrs = 1 if urgency == "emergency" else 3
            req_by_dt = dt + timedelta(hours=hour + lead_hrs, minutes=minute)

            requests.append({
                "request_id": f"REQ_{req_counter:06d}",
                "timestamp": f"{date_str} {hour:02d}:{minute:02d}:00",
                "date": date_str,
                "hospital_id": hosp_id,
                "blood_group": bg,
                "component": comp,
                "units_required": trauma,
                "urgency": urgency,
                "required_by": req_by_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "status": "pending",
                "fulfilled_from": "unassigned",
            })
            req_counter += 1

        # 3. Emergency requisition order
        if emerg > 0:
            comp = rng.choice(component_names, p=emerg_weights)
            hour = int(rng.randint(0, 24))
            minute = int(rng.choice([5, 20, 35, 50]))
            urgency = "critical" if (is_affected or rng.random() < 0.40) else "emergency"
            lead_mins = 30 if urgency == "critical" else 60
            req_by_dt = dt + timedelta(hours=hour, minutes=minute + lead_mins)

            requests.append({
                "request_id": f"REQ_{req_counter:06d}",
                "timestamp": f"{date_str} {hour:02d}:{minute:02d}:00",
                "date": date_str,
                "hospital_id": hosp_id,
                "blood_group": bg,
                "component": comp,
                "units_required": emerg,
                "urgency": urgency,
                "required_by": req_by_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "status": "pending",
                "fulfilled_from": "unassigned",
            })
            req_counter += 1

    df = pd.DataFrame(requests)
    return df
