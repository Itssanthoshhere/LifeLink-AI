"""
AI Blood Supply Command Center - Simulation & Dataset Configuration
-------------------------------------------------------------------
Central configuration module for synthetic dataset generation.
Contains all configurable hyperparameters, clinical rules, spatial anchors,
and component shelf-life rules.
"""

from pathlib import Path
from typing import Dict, List, Any

# ---------------------------------------------------------------------------
# Core Simulation Hyperparameters
# ---------------------------------------------------------------------------
NUM_HOSPITALS: int = 30
NUM_BLOOD_BANKS: int = 10
NUM_DONORS: int = 5000
YEARS: int = 2
SIMULATION_DAYS: int = YEARS * 365  # 730 days
START_DATE: str = "2024-01-01"
RANDOM_SEED: int = 42

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_RAW_DIR = DATA_DIR / "raw"
DATA_PROCESSED_DIR = DATA_DIR / "processed"
SUMMARY_PATH = DATA_DIR / "dataset_summary.json"

# Ensure directories exist
DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Geographic Region Configuration (Simulated Metropolitan Region)
# Region: "Metro Health Metropolis"
# Clustered around center coordinates with realistic urban dispersion
# ---------------------------------------------------------------------------
CITY_NAME: str = "Metro Metropolis"
CENTER_LAT: float = 12.9716
CENTER_LON: float = 77.5946
LAT_SPREAD_KM: float = 25.0  # approximate spread in km
LON_SPREAD_KM: float = 25.0
KM_PER_DEG_LAT: float = 111.0
KM_PER_DEG_LON: float = 108.0  # at ~13 deg latitude

# ---------------------------------------------------------------------------
# Blood Group Definitions & Population Distributions
# Standard realistic population prevalence (approximate global/regional mix)
# ---------------------------------------------------------------------------
BLOOD_GROUPS: List[str] = [
    "A_POS",
    "A_NEG",
    "B_POS",
    "B_NEG",
    "AB_POS",
    "AB_NEG",
    "O_POS",
    "O_NEG",
]

BLOOD_GROUP_DISTRIBUTION: Dict[str, float] = {
    "O_POS": 0.37,
    "A_POS": 0.28,
    "B_POS": 0.22,
    "AB_POS": 0.05,
    "O_NEG": 0.04,
    "A_NEG": 0.02,
    "B_NEG": 0.015,
    "AB_NEG": 0.005,
}

# ---------------------------------------------------------------------------
# Component Storage Rules & Shelf Life (CPDA-1 / FDA / AABB standard)
# Flagged: Medical shelf-life rules are standard international blood banking guidelines.
# ---------------------------------------------------------------------------
BLOOD_COMPONENTS: List[str] = ["RBC", "Platelets", "Plasma", "Whole_Blood"]

COMPONENT_RULES: Dict[str, Dict[str, Any]] = {
    "RBC": {
        "shelf_life_days": 42,
        "storage_temp_c": "1 to 6 C",
        "demand_share": 0.55,  # 55% of all component demand
        "description": "Packed Red Blood Cells (CPDA-1 additive solution)",
    },
    "Platelets": {
        "shelf_life_days": 5,
        "storage_temp_c": "20 to 24 C (Continuous Agitation)",
        "demand_share": 0.15,  # 15% of demand, short shelf life
        "description": "Random donor or apheresis platelets",
    },
    "Plasma": {
        "shelf_life_days": 365,
        "storage_temp_c": "<= -18 C (Frozen)",
        "demand_share": 0.20,  # 20% of demand, long shelf life
        "description": "Fresh Frozen Plasma (FFP)",
    },
    "Whole_Blood": {
        "shelf_life_days": 35,
        "storage_temp_c": "1 to 6 C",
        "demand_share": 0.10,  # 10% used in primary trauma/field resuscitation
        "description": "Unseparated whole blood in CPDA-1 anticoagulant",
    },
}

# ---------------------------------------------------------------------------
# Hospital Profiles & Demand Configurations
# ---------------------------------------------------------------------------
HOSPITAL_TYPES: List[str] = [
    "Trauma",
    "Teaching",
    "General",
    "Government",
    "Private",
    "Specialty",
]

HOSPITAL_TYPE_PROFILES: Dict[str, Dict[str, Any]] = {
    "Trauma": {
        "weight": 0.15,
        "bed_capacity": (400, 900),
        "icu_ratio": (0.18, 0.28),
        "blood_storage_ratio": (0.25, 0.35),  # storage per bed
        "avg_daily_demand_range": (35, 75),   # units/day
        "emergency_capacity": (30, 80),
    },
    "Teaching": {
        "weight": 0.20,
        "bed_capacity": (500, 1200),
        "icu_ratio": (0.15, 0.22),
        "blood_storage_ratio": (0.20, 0.30),
        "avg_daily_demand_range": (30, 60),
        "emergency_capacity": (25, 50),
    },
    "General": {
        "weight": 0.30,
        "bed_capacity": (200, 500),
        "icu_ratio": (0.10, 0.15),
        "blood_storage_ratio": (0.15, 0.25),
        "avg_daily_demand_range": (15, 35),
        "emergency_capacity": (15, 30),
    },
    "Government": {
        "weight": 0.15,
        "bed_capacity": (350, 800),
        "icu_ratio": (0.08, 0.14),
        "blood_storage_ratio": (0.12, 0.22),
        "avg_daily_demand_range": (20, 45),
        "emergency_capacity": (20, 40),
    },
    "Private": {
        "weight": 0.12,
        "bed_capacity": (150, 400),
        "icu_ratio": (0.14, 0.20),
        "blood_storage_ratio": (0.18, 0.25),
        "avg_daily_demand_range": (12, 30),
        "emergency_capacity": (10, 25),
    },
    "Specialty": {
        "weight": 0.08,
        "bed_capacity": (100, 300),
        "icu_ratio": (0.12, 0.18),
        "blood_storage_ratio": (0.15, 0.25),
        "avg_daily_demand_range": (8, 22),
        "emergency_capacity": (5, 15),
    },
}

# ---------------------------------------------------------------------------
# Blood Bank Profiles
# ---------------------------------------------------------------------------
BLOOD_BANK_PROFILES = {
    "Regional_Hub": {
        "count": 3,
        "storage_capacity_range": (3500, 6000),
        "daily_collection_range": (180, 290),
        "emergency_support": True,
    },
    "District_Center": {
        "count": 7,
        "storage_capacity_range": (1200, 2500),
        "daily_collection_range": (85, 140),
        "emergency_support": True,
    },
}

# ---------------------------------------------------------------------------
# Donor Configuration
# ---------------------------------------------------------------------------
DONOR_MIN_INTERVAL_DAYS: int = 90  # 90 days inter-donation interval for whole blood
DONOR_AGE_RANGE = (18, 65)
DONOR_RESPONSE_PROB_RANGE = (0.35, 0.92)
DONOR_AVG_RESPONSE_TIME_MIN = (20, 120)

# ---------------------------------------------------------------------------
# Transport Configuration
# ---------------------------------------------------------------------------
AVG_TRANSPORT_SPEED_KMH: float = 38.0  # Urban transit average speed
ROAD_TORTUOSITY_FACTOR: float = 1.28   # Actual road driving distance vs Euclidean Haversine
MIN_TRANSFER_CAPACITY: int = 20
MAX_TRANSFER_CAPACITY: int = 150
ROUTE_DISRUPTION_PROBABILITY: float = 0.04  # 4% chance a route has minor disruption on any given check

# ---------------------------------------------------------------------------
# Emergency Events Configuration
# Target: 200 - 500 events over 2 years (approx. 0.35 to 0.65 events/day)
# ---------------------------------------------------------------------------
TARGET_EMERGENCY_EVENTS_MIN: int = 250
TARGET_EMERGENCY_EVENTS_MAX: int = 400

EMERGENCY_EVENT_TYPES: List[str] = [
    "road_accident",
    "mass_casualty",
    "industrial_accident",
    "natural_disaster",
    "surgery_surge",
    "disease_spike",
    "blood_bank_failure",
    "transport_disruption",
]

EMERGENCY_SEVERITY_PROFILES: Dict[str, Dict[str, Any]] = {
    "Minor": {"multiplier_range": (1.15, 1.35), "duration_hours": (2, 6), "patients": (3, 12)},
    "Moderate": {"multiplier_range": (1.35, 1.70), "duration_hours": (6, 18), "patients": (12, 35)},
    "Severe": {"multiplier_range": (1.70, 2.30), "duration_hours": (12, 36), "patients": (35, 80)},
    "Critical": {"multiplier_range": (2.30, 3.50), "duration_hours": (24, 72), "patients": (80, 200)},
}

# ---------------------------------------------------------------------------
# Seasonal & Calendar Multipliers
# ---------------------------------------------------------------------------
DAY_OF_WEEK_SURGERY_MULTIPLIERS = {
    0: 1.25,  # Monday - peak elective surgeries
    1: 1.20,  # Tuesday
    2: 1.15,  # Wednesday
    3: 1.10,  # Thursday
    4: 1.05,  # Friday
    5: 0.65,  # Saturday - minimal elective surgery, mainly trauma/emergency
    6: 0.50,  # Sunday - minimal elective surgery
}

DAY_OF_WEEK_TRAUMA_MULTIPLIERS = {
    0: 0.90,
    1: 0.90,
    2: 0.95,
    3: 1.00,
    4: 1.20,  # Friday night
    5: 1.35,  # Saturday weekend accidents
    6: 1.30,  # Sunday weekend accidents
}

# Seasonal illness waves (e.g. dengue / malaria / viral outbreaks in rainy/monsoon season)
SEASONAL_MONTH_FACTORS = {
    1: 0.95,  # Jan
    2: 0.92,  # Feb
    3: 0.98,  # Mar
    4: 1.02,  # Apr
    5: 1.05,  # May - summer trauma
    6: 1.12,  # Jun - monsoon onset
    7: 1.25,  # Jul - peak monsoon / dengue
    8: 1.30,  # Aug - peak monsoon / dengue
    9: 1.22,  # Sep - receding monsoon
    10: 1.10, # Oct - festival season
    11: 1.05, # Nov - festival season
    12: 1.00, # Dec - holiday season
}

# Major festivals impacting donor turnout (dips) and trauma/accidents (surges)
FESTIVALS = [
    {"name": "New Year", "month": 1, "day": 1, "trauma_surge": 1.45, "donor_dip": 0.60},
    {"name": "Spring Harvest Festival", "month": 1, "day": 15, "trauma_surge": 1.15, "donor_dip": 0.70},
    {"name": "Color Festival", "month": 3, "day": 25, "trauma_surge": 1.30, "donor_dip": 0.65},
    {"name": "Mid-Year Festival", "month": 6, "day": 17, "trauma_surge": 1.10, "donor_dip": 0.75},
    {"name": "Independence Holiday", "month": 8, "day": 15, "trauma_surge": 1.20, "donor_dip": 0.70},
    {"name": "Autumn Festival", "month": 10, "day": 12, "trauma_surge": 1.25, "donor_dip": 0.65},
    {"name": "Festival of Lights", "month": 11, "day": 1, "trauma_surge": 1.50, "donor_dip": 0.55},
    {"name": "Winter Solstice / Year End", "month": 12, "day": 25, "trauma_surge": 1.35, "donor_dip": 0.60},
]

# ---------------------------------------------------------------------------
# Calibration & Operational Inventory Targets (Simulation Engineering Targets)
# ---------------------------------------------------------------------------
HOSPITAL_PAR_LEVEL_DAYS: float = 3.0       # Target days of demand held locally at hospital
HOSPITAL_SAFETY_BUFFER_DAYS: float = 1.0   # Emergency transfer trigger threshold
O_NEG_RESERVATION_RATIO: float = 0.50      # Fraction of O- reserved strictly for emergency/Rh-
MIN_BATCH_TRANSFER_UNITS: int = 6          # Minimum units per consolidated transfer shipment

# Engineering Calibration Performance Targets for Simulation
CALIBRATION_TARGETS = {
    "request_fulfillment_rate_range": (0.88, 0.94),
    "shortage_rate_range": (0.05, 0.09),
    "expired_unit_rate_range": (0.03, 0.07),
    "transfer_count_range": (15000, 35000),
    "avg_inventory_days_range": (3.0, 5.5),
}

# ---------------------------------------------------------------------------
# 9 Explicit Operational Scenarios (Reproducible Stress Tests)
# ---------------------------------------------------------------------------
EXPLICIT_SCENARIOS = {
    "normal_operations": {
        "name": "Normal Operating Baseline",
        "date_range": ("2024-02-12", "2024-02-18"),
        "description": "Standard predictable clinical volume, >96% local fulfillment, 0 shortages.",
        "type": "baseline",
    },
    "moderate_demand_spike": {
        "name": "Holiday Festival Demand Spike",
        "date_range": ("2024-03-24", "2024-03-26"),
        "description": "Festival celebration creates +30% trauma demand and elective surgery surge.",
        "type": "demand_spike",
    },
    "major_mass_casualty": {
        "name": "Industrial Chemical Explosion Catastrophe",
        "date_range": ("2024-05-18", "2024-05-19"),
        "description": "120 casualties in Sector 4 flooding trauma centers; blood demand multiplier 2.8x.",
        "type": "emergency_event",
    },
    "multiple_hospital_shortages": {
        "name": "Peak Monsoon Dengue Outbreak Wave",
        "date_range": ("2024-07-20", "2024-07-28"),
        "description": "Epidemic fever surge simultaneously depletes platelet and RBC stocks across 30 facilities.",
        "type": "epidemic_surge",
    },
    "o_negative_crisis": {
        "name": "Severe O-Negative Emergency Deficit",
        "date_range": ("2024-08-12", "2024-08-15"),
        "description": "Cluster of major trauma cases exhausts universal O- reserves, triggering urgent donor dispatch.",
        "type": "rare_group_crunch",
    },
    "blood_bank_failure": {
        "name": "Regional Hub Cooling System Failure",
        "date_range": ("2024-09-05", "2024-09-08"),
        "description": "BB_001 cooling failure shuts down facility; district centers surge supply to cover deficit.",
        "type": "facility_outage",
        "target_facility": "BB_001",
    },
    "transport_disruption": {
        "name": "Monsoon Arterial Highway Inundation",
        "date_range": ("2024-10-10", "2024-10-12"),
        "description": "Northern corridor flooded; route disruptions cause delayed delivery and localized shortages.",
        "type": "logistics_disruption",
        "affected_corridor": "NORTH",
    },
    "platelet_expiry_wave": {
        "name": "Post-Drive Platelet Surplus & Expiry Wave",
        "date_range": ("2025-01-02", "2025-01-07"),
        "description": "New Year donation drive surplus meets post-holiday surgery lull, elevating 5-day platelet expiry.",
        "type": "expiry_surge",
    },
    "donor_availability_slump": {
        "name": "Severe Summer Heatwave Donor Slump",
        "date_range": ("2025-05-01", "2025-05-10"),
        "description": "High temperatures reduce voluntary donor turnout by 45%, drawing down blood bank reserves.",
        "type": "donor_slump",
    },
}

# ---------------------------------------------------------------------------
# ML Model 2 — Shortage Early Warning Prototype Engineering Thresholds
# Note: These are engineering simulation parameters for Command Center decision
# support and are NOT clinical or medical standards.
# ---------------------------------------------------------------------------
SHORTAGE_SAFETY_RESERVE_DAYS: float = 1.0  # Buffer days of demand below which shortage risk escalates
SHORTAGE_RISK_THRESHOLDS: Dict[str, float] = {
    "LOW": 0.20,       # Probability < 0.20 -> LOW risk
    "MEDIUM": 0.50,    # 0.20 <= Probability < 0.50 -> MEDIUM risk
    "HIGH": 0.75,      # 0.50 <= Probability < 0.75 -> HIGH risk
    "CRITICAL": 0.90   # Probability >= 0.75 -> CRITICAL risk
}

# ---------------------------------------------------------------------------
# ML Model 3 — Intelligent Donor Ranking & Dispatch Prototype Configuration
# Note: These are logistical engineering prototype parameters for Command Center
# decision support and are NOT medical, clinical, or transfusion screening standards.
# ---------------------------------------------------------------------------
DONOR_MAX_TRAVEL_DISTANCE_KM: float = 35.0          # Max acceptable travel distance under routine outreach
DONOR_MAX_TRAVEL_DISTANCE_EMERGENCY_KM: float = 50.0  # Extended radius under acute emergency crises
DONOR_MIN_DAYS_BETWEEN_DONATIONS: int = 90          # Required inter-donation interval (days)
DONOR_RESPONSE_WINDOW_HOURS: Dict[str, float] = {
    "emergency": 2.0,
    "urgent": 6.0,
    "routine": 24.0,
}
DONOR_DEFAULT_TOP_K: int = 20
DONOR_URGENCY_LEVELS: List[str] = ["routine", "urgent", "emergency"]

# Ranking weight defaults (Multi-Criteria Decision Analysis - MCDA)
DONOR_RANKING_WEIGHTS: Dict[str, Dict[str, float]] = {
    "routine": {
        "proximity": 0.25,
        "responsiveness": 0.30,
        "reliability": 0.20,
        "exact_match": 0.15,
        "availability": 0.10,
    },
    "urgent": {
        "proximity": 0.35,
        "responsiveness": 0.30,
        "reliability": 0.15,
        "exact_match": 0.10,
        "availability": 0.10,
    },
    "emergency": {
        "proximity": 0.45,
        "responsiveness": 0.35,
        "reliability": 0.10,
        "exact_match": 0.05,
        "availability": 0.05,
    },
}

# ---------------------------------------------------------------------------
# Engine 4 — AI Blood Supply Network Optimization & Inter-Facility Transshipment
# Prototype Engineering Parameters
# Note: These are mathematical optimization simulation parameters for Command Center
# decision support and are NOT clinical or transfusion standards.
# ---------------------------------------------------------------------------
OPTIMIZATION_SAFETY_RESERVE_DAYS: float = 1.0           # Minimum operational runway days required at source facilities
OPTIMIZATION_MAX_TRANSFER_DISTANCE_KM: float = 65.0     # Maximum viable transfer route distance
OPTIMIZATION_MAX_SOLVER_SECONDS: float = 30.0           # Solver time limit in seconds
OPTIMIZATION_SHORTAGE_PENALTY: float = 500.0            # Penalty weight per unit of routine unmet clinical demand
OPTIMIZATION_EMERGENCY_PENALTY: float = 2500.0          # Penalty weight per unit of emergency/critical unmet demand
OPTIMIZATION_EXPIRY_WEIGHT: float = 8.0                 # Cost weight per unit of expiring stock left idle
OPTIMIZATION_TRANSPORT_COST_WEIGHT: float = 0.35        # Cost weight per km per unit transferred
OPTIMIZATION_UNNECESSARY_TRANSFER_PENALTY: float = 2.0  # Friction cost preventing needless churn
OPTIMIZATION_DONOR_MOBILIZATION_COST: float = 30.0      # Administrative and logistical cost per mobilized donor
OPTIMIZATION_DONOR_EXPECTED_YIELD_FACTOR: float = 0.75  # Expected realized blood units per contacted donor candidate
OPTIMIZATION_DEFAULT_HORIZON_HOURS: int = 72            # Default planning horizon (72h)
OPTIMIZATION_MIN_SHELF_LIFE_REMAINING_HOURS: float = 6.0 # Minimum shelf life required above route transit ETA


