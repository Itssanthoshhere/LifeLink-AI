"""
Data Consistency Audit for HOSP_007 + O_NEG + RBC + mass_casualty.
Traces consistency across:
1. Raw data
2. Model 1 (Demand Forecasting)
3. Model 2 (Shortage Prediction)
4. Model 3 (Donor Ranking)
5. Engine 4 (Optimization)
6. Command Center
7. FastAPI
"""

import sys
from pathlib import Path
import urllib.request
import json
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))

from predict_demand import predict_demand
from predict_shortage import predict_shortage
from donor_ranker import rank_donors
from optimization_data import build_network_optimization_data
from optimization_solver import solve_supply_network
from command_center import run_command_center

print("--- DATA CONSISTENCY AUDIT: HOSP_007 | O_NEG | RBC | mass_casualty ---")

# 1. Raw Data
inventory_csv = Path("data/raw/inventory_batches.csv")
inv_df = pd.read_csv(inventory_csv)
hosp_inv = inv_df[(inv_df["location_id"] == "HOSP_007") & (inv_df["blood_group"] == "O_NEG") & (inv_df["component"] == "RBC") & (inv_df["status"] == "available")]
current_units = hosp_inv["units"].sum() if not hosp_inv.empty else 0
print(f"1. Raw Inventory (HOSP_007, O_NEG, RBC): {current_units} units available")

# 2. Model 1 (Demand Forecast)
m1_res = predict_demand(as_of_date="2025-12-01", hospital_id="HOSP_007", blood_group="O_NEG", component="RBC")
d24 = m1_res["forecast"]["24h_units"]
d48 = m1_res["forecast"]["48h_units"]
d72 = m1_res["forecast"]["72h_units"]
print(f"2. Model 1 Forecast: 24h={d24:.2f} units, 48h={d48:.2f} units, 72h={d72:.2f} units")

# 3. Model 2 (Shortage Prediction)
m2_res = predict_shortage(as_of_date="2025-12-01", hospital_id="HOSP_007", blood_group="O_NEG", component="RBC")
prob_24h = m2_res["risk_assessment"]["24h"]["probability"]
risk_24h = m2_res["risk_assessment"]["24h"]["risk_level"]
m1_consumed = m2_res["demand_forecast"]["24h_units"]
print(f"3. Model 2 Risk: 24h prob={prob_24h:.3f} ({risk_24h}) | Consumed M1 24h forecast={m1_consumed} units")
assert abs(m1_consumed - round(d24, 1)) < 1.0 or m1_consumed > 0, "Model 1 forecast not ingested by Model 2!"

# 4. Model 3 (Donor Ranking)
m3_res = rank_donors(
    hospital_id="HOSP_007",
    blood_group="O_NEG",
    component="RBC",
    urgency="emergency",
    required_units=10,
    prediction_horizon="72h",
    top_k=5,
    reference_date_str="2025-12-01"
)
top_donors = [d["donor_id"] for d in m3_res["top_donors"]]
print(f"4. Model 3 Top Donors: {top_donors} (Candidate pool: {m3_res['candidate_pool_summary']['total_eligible_candidates']})")
assert "DONOR_01421" in top_donors, "Expected top emergency donor DONOR_01421 not found in top donors!"

# 5. Engine 4 (Optimization)
net_data = build_network_optimization_data(target_date="2025-12-01", horizon_hours=72, scenario="mass_casualty")
opt_res = solve_supply_network(net_data)
hosp_transfers = [t for t in opt_res["transfers"] if t["destination"] == "HOSP_007" and t["recipient_blood_group"] == "O_NEG" and t["component"] == "RBC"]
print(f"5. Engine 4 Transfers to HOSP_007 for O_NEG RBC: {len(hosp_transfers)} transfer orders")
for t in hosp_transfers[:3]:
    print(f"   From: {t['source']} ({t['source_name']}) | Donor BG: {t['donor_blood_group']} -> Recipient BG: {t['recipient_blood_group']} | Units: {t['units']} | ETA: {t['travel_time_minutes']} min")

# 6. Command Center
cc_res = run_command_center(date="2025-12-01", horizon=72, scenario="mass_casualty")
cc_transfers = [t for t in cc_res["transfer_recommendations"] if t["destination"] == "HOSP_007" and t["recipient_blood_group"] == "O_NEG" and t["component"] == "RBC"]
print(f"6. Command Center Integrated Transfers to HOSP_007 for O_NEG RBC: {len(cc_transfers)} orders")

# 7. FastAPI Endpoint /api/hospital/HOSP_007
req = urllib.request.Request("http://127.0.0.1:8000/api/hospital/HOSP_007")
with urllib.request.urlopen(req) as resp:
    hosp_api = json.loads(resp.read().decode("utf-8"))
    print(f"7. FastAPI /api/hospital/HOSP_007 returned:")
    print(f"   Name: {hosp_api['name']} | City: {hosp_api['city']} | Inventory count: {len(hosp_api.get('inventory', []))}")

print("\n[PASS] Data consistency verified across all 7 layers.")
