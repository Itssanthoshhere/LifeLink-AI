import {
  CommandCenterPayload,
  NetworkPayload,
  InventoryPayload,
  HospitalIntelligence,
  ScenarioMeta,
  ScenarioComparison
} from "../types/commandCenter";

export const SCENARIO_CATALOG: ScenarioMeta[] = [
  { id: "normal", name: "Normal Operations", description: "Standard seasonal demand with nominal inventory reserves." },
  { id: "demand_spike", name: "Demand Spike", description: "1.3x baseline demand surge across all emergency & trauma centers." },
  { id: "mass_casualty", name: "Mass Casualty (Demo)", description: "Acute highway trauma incident causing 45 units O-neg RBC surge at HOSP_007." },
  { id: "dengue_outbreak", name: "Dengue Outbreak", description: "Citywide viral fever wave causing +120% severe platelet consumption." },
  { id: "o_negative_crisis", name: "O- Crisis", description: "Severe depletion of universal donor O-neg reserves across regional hubs." },
  { id: "cooling_failure", name: "Cooling Failure (BB_001)", description: "Metropolitan Central Blood Bank storage malfunction offline." },
  { id: "transport_cut", name: "Transport Cut", description: "Monsoon flooding blocking arterial express routes RT_00001, 2, 3." },
  { id: "platelet_expiry_wave", name: "Platelet Expiry Wave", description: "Short shelf-life cluster requiring aggressive FEFO transshipment." },
  { id: "donor_slump", name: "Donor Slump", description: "Low weekend outreach response requiring inter-facility transfer prioritization." },
];

export const MOCK_COMMAND_CENTER: CommandCenterPayload = {
  status: "success",
  date: "2025-12-01",
  horizon: 72,
  scenario: "normal",
  optimization_status: "OPTIMAL",
  solve_time_seconds: 2.35,
  network_metrics: {
    total_shortages_before: 677,
    critical_shortages_before: 63,
    total_shortage_units_before: 1596.1,
    emergency_unmet_units_before: 79.7,
    total_shortages_after: 0,
    total_shortage_units_after: 0.0,
    emergency_unmet_units_after: 0.0,
    emergency_protection_rate_pct: 100.0,
    total_units_transferred: 1389,
    total_donor_units_mobilized: 590,
    fefo_expiring_units_rescued: 222,
    total_transport_distance_km: 21582.8,
    average_transfer_distance_km: 36.2,
    average_eta_minutes: 58.4,
    decision_breakdown: {
      transfer_only: 489,
      donor_only: 120,
      combined: 68,
      no_action_needed: 283,
      total_demands_evaluated: 960
    }
  },
  shortage_alerts: [
    {
      hospital_id: "HOSP_007",
      hospital_name: "Valley Trauma Center",
      blood_group: "O_NEG",
      component: "RBC",
      forecast_demand_units: 14.8,
      current_stock_units: 3.0,
      shortage_probability: 0.962,
      risk_level: "CRITICAL",
      is_emergency: true
    },
    {
      hospital_id: "HOSP_003",
      hospital_name: "City Trauma Center",
      blood_group: "B_POS",
      component: "Platelets",
      forecast_demand_units: 11.2,
      current_stock_units: 2.0,
      shortage_probability: 0.891,
      risk_level: "CRITICAL",
      is_emergency: true
    },
    {
      hospital_id: "HOSP_006",
      hospital_name: "Southside Teaching Hospital",
      blood_group: "O_POS",
      component: "RBC",
      forecast_demand_units: 22.4,
      current_stock_units: 7.0,
      shortage_probability: 0.845,
      risk_level: "HIGH",
      is_emergency: false
    },
    {
      hospital_id: "HOSP_014",
      hospital_name: "St. Jude Memorial Hospital",
      blood_group: "A_NEG",
      component: "Plasma",
      forecast_demand_units: 6.5,
      current_stock_units: 1.0,
      shortage_probability: 0.812,
      risk_level: "HIGH",
      is_emergency: false
    },
    {
      hospital_id: "HOSP_021",
      hospital_name: "Riverside Surgical Center",
      blood_group: "AB_NEG",
      component: "Platelets",
      forecast_demand_units: 4.8,
      current_stock_units: 0.0,
      shortage_probability: 0.789,
      risk_level: "HIGH",
      is_emergency: false
    },
    {
      hospital_id: "HOSP_005",
      hospital_name: "Northside Teaching Hospital",
      blood_group: "O_NEG",
      component: "Whole_Blood",
      forecast_demand_units: 8.1,
      current_stock_units: 2.0,
      shortage_probability: 0.774,
      risk_level: "HIGH",
      is_emergency: false
    }
  ],
  transfer_recommendations: [
    {
      source: "BB_003",
      source_name: "City Health Authority Blood Bank",
      destination: "HOSP_007",
      destination_name: "Valley Trauma Center",
      donor_blood_group: "O_NEG",
      recipient_blood_group: "O_NEG",
      component: "RBC",
      is_exact_match: true,
      units: 12,
      distance_km: 18.4,
      travel_time_minutes: 32.5,
      route_id: "RT_00067",
      is_fefo_priority: true
    },
    {
      source: "BB_001",
      source_name: "Metropolitan Central Blood Transfusion Center",
      destination: "HOSP_003",
      destination_name: "City Trauma Center",
      donor_blood_group: "B_POS",
      recipient_blood_group: "B_POS",
      component: "Platelets",
      is_exact_match: true,
      units: 9,
      distance_km: 22.2,
      travel_time_minutes: 39.9,
      route_id: "RT_00003",
      is_fefo_priority: true
    },
    {
      source: "BB_004",
      source_name: "North District Community Blood Center",
      destination: "HOSP_006",
      destination_name: "Southside Teaching Hospital",
      donor_blood_group: "O_POS",
      recipient_blood_group: "O_POS",
      component: "RBC",
      is_exact_match: true,
      units: 16,
      distance_km: 11.5,
      travel_time_minutes: 24.1,
      route_id: "RT_00096",
      is_fefo_priority: false
    },
    {
      source: "BB_007",
      source_name: "West End Voluntary Blood Foundation",
      destination: "HOSP_014",
      destination_name: "St. Jude Memorial Hospital",
      donor_blood_group: "A_NEG",
      recipient_blood_group: "A_NEG",
      component: "Plasma",
      is_exact_match: true,
      units: 6,
      distance_km: 19.8,
      travel_time_minutes: 38.0,
      route_id: "RT_00188",
      is_fefo_priority: false
    },
    {
      source: "BB_008",
      source_name: "Lakeside District Blood Center",
      destination: "HOSP_021",
      destination_name: "Riverside Surgical Center",
      donor_blood_group: "AB_NEG",
      recipient_blood_group: "AB_NEG",
      component: "Platelets",
      is_exact_match: true,
      units: 5,
      distance_km: 14.3,
      travel_time_minutes: 29.2,
      route_id: "RT_00215",
      is_fefo_priority: true
    }
  ],
  donor_recommendations: [
    {
      hospital_id: "HOSP_007",
      hospital_name: "Valley Trauma Center",
      blood_group: "O_NEG",
      component: "RBC",
      priority_tier: "CRITICAL",
      candidate_pool_size: 42,
      expected_response_yield: 4.2,
      top_candidates: [
        {
          donor_id: "DONOR_01421",
          blood_group: "O_NEG",
          distance_km: 6.8,
          composite_score: 0.942,
          rank: 1,
          medical_clearance: true,
          days_since_last_donation: 118,
          availability: "Available",
          contact_priority: "P1_Immediate",
          recommendation_reason: "Universal donor O_NEG, 6.8km proximity, 94% response reliability."
        },
        {
          donor_id: "DONOR_00889",
          blood_group: "O_NEG",
          distance_km: 9.2,
          composite_score: 0.895,
          rank: 2,
          medical_clearance: true,
          days_since_last_donation: 142,
          availability: "Available",
          contact_priority: "P1_Immediate",
          recommendation_reason: "High historical compliance, verified mobile responder."
        },
        {
          donor_id: "DONOR_02150",
          blood_group: "O_NEG",
          distance_km: 11.4,
          composite_score: 0.862,
          rank: 3,
          medical_clearance: true,
          days_since_last_donation: 95,
          availability: "Available",
          contact_priority: "P2_High",
          recommendation_reason: "Eligible inter-donation interval, central corridor transit."
        }
      ]
    }
  ],
  unmet_shortages: [],
  decision_breakdown: {
    transfer_only: 489,
    donor_only: 120,
    combined: 68,
    no_action_needed: 283,
    total_demands_evaluated: 960
  },
  explanations: [
    {
      transfer_id: "TR_BB003_HOSP007_ONEG_RBC",
      transfer_summary: "BB_003 (City Health Authority) -> HOSP_007 (Valley Trauma Center) | 12 O_NEG RBC",
      explanation: {
        hospital_condition: {
          hospital_id: "HOSP_007",
          hospital_name: "Valley Trauma Center",
          shortage_probability: 0.962,
          forecast_demand: 14.8,
          current_inventory: 3.0,
          is_emergency: true
        },
        source_condition: {
          source_id: "BB_003",
          source_name: "City Health Authority Blood Bank",
          current_inventory: 34.0,
          safety_reserve: 8.0,
          transferable_inventory: 26.0
        },
        logistics_feasibility: {
          distance_km: 18.4,
          eta_minutes: 32.5,
          route_status: "Active",
          product_match: "EXACT_MATCH (O_NEG -> O_NEG)",
          fefo_priority: true
        },
        summary_rationale: "HOSP_007 faces a 96.2% critical shortage probability under trauma conditions with only 3 units remaining. BB_003 possesses 26 transferable units above its mandatory safety reserve, including 4 near-expiry units. Route RT_00067 is active with a 32.5 min ETA, well within the viability threshold."
      }
    }
  ],
  disclaimer: "AI BLOOD SUPPLY COMMAND CENTER — DECISION SUPPORT PROTOTYPE. Logistical recommendations require qualified blood-bank authorization."
};

export const MOCK_NETWORK: NetworkPayload = {
  nodes: {
    total_hospitals: 30,
    total_blood_banks: 10,
    hospitals: [
      { id: "HOSP_001", name: "Metro Health Institute", type: "Hospital", hospital_type: "General", latitude: 12.9055, longitude: 77.5876, bed_capacity: 288, icu_capacity: 43, storage_capacity: 66, status: "Operational", shortage_count: 0, risk_level: "LOW" },
      { id: "HOSP_002", name: "Apex Teaching Hospital", type: "Hospital", hospital_type: "Specialty", latitude: 12.9384, longitude: 77.6293, bed_capacity: 180, icu_capacity: 24, storage_capacity: 39, status: "Operational", shortage_count: 1, risk_level: "HIGH" },
      { id: "HOSP_003", name: "City Trauma Center", type: "Hospital", hospital_type: "Government", latitude: 13.0381, longitude: 77.6104, bed_capacity: 564, icu_capacity: 63, storage_capacity: 122, status: "Operational", shortage_count: 4, risk_level: "CRITICAL" },
      { id: "HOSP_004", name: "Central Memorial Hospital", type: "Hospital", hospital_type: "General", latitude: 12.9802, longitude: 77.6334, bed_capacity: 240, icu_capacity: 28, storage_capacity: 40, status: "Operational", shortage_count: 0, risk_level: "LOW" },
      { id: "HOSP_005", name: "Northside Teaching Hospital", type: "Hospital", hospital_type: "Teaching", latitude: 13.0644, longitude: 77.6808, bed_capacity: 788, icu_capacity: 152, storage_capacity: 231, status: "Operational", shortage_count: 2, risk_level: "HIGH" },
      { id: "HOSP_006", name: "Southside Teaching Hospital", type: "Hospital", hospital_type: "Teaching", latitude: 12.9494, longitude: 77.5233, bed_capacity: 1073, icu_capacity: 185, storage_capacity: 293, status: "Operational", shortage_count: 3, risk_level: "CRITICAL" },
      { id: "HOSP_007", name: "Valley Trauma Center", type: "Hospital", hospital_type: "Trauma", latitude: 13.0592, longitude: 77.6682, bed_capacity: 617, icu_capacity: 126, storage_capacity: 170, status: "Operational", shortage_count: 5, risk_level: "CRITICAL" },
      { id: "HOSP_008", name: "Highland Hospital", type: "Hospital", hospital_type: "Private", latitude: 12.9851, longitude: 77.5840, bed_capacity: 390, icu_capacity: 62, storage_capacity: 84, status: "Operational", shortage_count: 0, risk_level: "LOW" },
      { id: "HOSP_009", name: "Mercy Trauma Center", type: "Hospital", hospital_type: "General", latitude: 13.3371, longitude: 77.7852, bed_capacity: 483, icu_capacity: 71, storage_capacity: 111, status: "Operational", shortage_count: 1, risk_level: "HIGH" },
      { id: "HOSP_010", name: "Lakeside Medical Center", type: "Hospital", hospital_type: "Specialty", latitude: 12.8790, longitude: 77.6012, bed_capacity: 310, icu_capacity: 45, storage_capacity: 75, status: "Operational", shortage_count: 0, risk_level: "LOW" },
      { id: "HOSP_014", name: "St. Jude Memorial Hospital", type: "Hospital", hospital_type: "General", latitude: 12.9650, longitude: 77.6510, bed_capacity: 410, icu_capacity: 55, storage_capacity: 90, status: "Operational", shortage_count: 2, risk_level: "HIGH" },
      { id: "HOSP_021", name: "Riverside Surgical Center", type: "Hospital", hospital_type: "Specialty", latitude: 13.0120, longitude: 77.5540, bed_capacity: 220, icu_capacity: 35, storage_capacity: 50, status: "Operational", shortage_count: 2, risk_level: "HIGH" }
    ],
    blood_banks: [
      { id: "BB_001", name: "Metropolitan Central Blood Transfusion Center", type: "Blood_Bank", latitude: 12.9059, longitude: 77.6948, storage_capacity: 3662, daily_collection_capacity: 238, emergency_support: true, status: "Operational" },
      { id: "BB_002", name: "Red Cross Apex Blood Center", type: "Blood_Bank", latitude: 13.0500, longitude: 77.6090, storage_capacity: 5289, daily_collection_capacity: 273, emergency_support: true, status: "Maintenance" },
      { id: "BB_003", name: "City Health Authority Blood Bank", type: "Blood_Bank", latitude: 12.9330, longitude: 77.5587, storage_capacity: 5987, daily_collection_capacity: 239, emergency_support: true, status: "Operational" },
      { id: "BB_004", name: "North District Community Blood Center", type: "Blood_Bank", latitude: 12.9234, longitude: 77.5023, storage_capacity: 1797, daily_collection_capacity: 106, emergency_support: true, status: "Operational" },
      { id: "BB_005", name: "South Valley Regional Blood Bank", type: "Blood_Bank", latitude: 12.7413, longitude: 77.4283, storage_capacity: 1373, daily_collection_capacity: 111, emergency_support: true, status: "Operational" },
      { id: "BB_006", name: "Eastside Memorial Blood Bank", type: "Blood_Bank", latitude: 13.4566, longitude: 77.6316, storage_capacity: 2114, daily_collection_capacity: 91, emergency_support: false, status: "Operational" },
      { id: "BB_007", name: "West End Voluntary Blood Foundation", type: "Blood_Bank", latitude: 12.8599, longitude: 77.7629, storage_capacity: 2297, daily_collection_capacity: 111, emergency_support: false, status: "Operational" },
      { id: "BB_008", name: "Lakeside District Blood Center", type: "Blood_Bank", latitude: 13.0666, longitude: 77.6865, storage_capacity: 1260, daily_collection_capacity: 130, emergency_support: true, status: "Operational" },
      { id: "BB_009", name: "University Medical Blood Services", type: "Blood_Bank", latitude: 12.8287, longitude: 77.6968, storage_capacity: 2277, daily_collection_capacity: 118, emergency_support: true, status: "Operational" },
      { id: "BB_010", name: "Regional Emergency Reserve", type: "Blood_Bank", latitude: 12.9716, longitude: 77.5946, storage_capacity: 4500, daily_collection_capacity: 200, emergency_support: true, status: "Operational" }
    ]
  },
  routes: [
    { route_id: "RT_00001", source_id: "BB_001", destination_id: "HOSP_001", distance_km: 14.8, travel_time_minutes: 27.5, transport_capacity: 30, status: "Active" },
    { route_id: "RT_00002", source_id: "BB_001", destination_id: "HOSP_002", distance_km: 10.2, travel_time_minutes: 17.4, transport_capacity: 100, status: "Active" },
    { route_id: "RT_00003", source_id: "BB_001", destination_id: "HOSP_003", distance_km: 22.2, travel_time_minutes: 39.9, transport_capacity: 100, status: "Active" },
    { route_id: "RT_00067", source_id: "BB_003", destination_id: "HOSP_007", distance_km: 18.4, travel_time_minutes: 32.5, transport_capacity: 80, status: "Active" },
    { route_id: "RT_00096", source_id: "BB_004", destination_id: "HOSP_006", distance_km: 11.5, travel_time_minutes: 24.1, transport_capacity: 60, status: "Active" }
  ],
  metrics: {
    total_routes: 646,
    active_routes: 642,
    disrupted_routes: 4,
    avg_distance_km: 36.4,
    avg_travel_time_min: 58.7
  }
};

export const MOCK_INVENTORY: InventoryPayload = {
  summary: {
    total_units: 9410.0,
    total_safety_reserve: 2450.0,
    usable_excess: 6960.0,
    expiring_1d: 84.0,
    expiring_3d: 222.0,
    expiring_5d: 489.0
  },
  by_blood_group: {
    O_POS: 3120.0,
    A_POS: 2480.0,
    B_POS: 1950.0,
    AB_POS: 680.0,
    O_NEG: 420.0,
    A_NEG: 360.0,
    B_NEG: 280.0,
    AB_NEG: 120.0
  },
  by_component: {
    RBC: 4620.0,
    Whole_Blood: 2210.0,
    Plasma: 1840.0,
    Platelets: 740.0
  },
  facilities: [
    { facility_id: "BB_003", name: "City Health Authority Blood Bank", type: "Blood_Bank", total_units: 1840.0, safety_reserve: 320.0, expiring_3d: 48.0, usable_excess: 1520.0, capacity: 5987, utilization_pct: 30.7 },
    { facility_id: "BB_001", name: "Metropolitan Central Blood Bank", type: "Blood_Bank", total_units: 1420.0, safety_reserve: 280.0, expiring_3d: 36.0, usable_excess: 1140.0, capacity: 3662, utilization_pct: 38.8 },
    { facility_id: "HOSP_007", name: "Valley Trauma Center", type: "Hospital", total_units: 42.0, safety_reserve: 38.0, expiring_3d: 2.0, usable_excess: 4.0, capacity: 170, utilization_pct: 24.7 },
    { facility_id: "HOSP_003", name: "City Trauma Center", type: "Hospital", total_units: 31.0, safety_reserve: 28.0, expiring_3d: 1.0, usable_excess: 3.0, capacity: 122, utilization_pct: 25.4 },
    { facility_id: "HOSP_006", name: "Southside Teaching Hospital", type: "Hospital", total_units: 98.0, safety_reserve: 65.0, expiring_3d: 6.0, usable_excess: 33.0, capacity: 293, utilization_pct: 33.4 }
  ]
};

export const MOCK_HOSPITAL_INTELLIGENCE: HospitalIntelligence = {
  hospital_id: "HOSP_007",
  name: "Valley Trauma Center",
  city: "Metro Metropolis",
  type: "Trauma",
  bed_capacity: 617,
  icu_capacity: 126,
  storage_capacity: 170,
  status: "Operational",
  overall_risk_status: "CRITICAL",
  total_stock_units: 42.0,
  inventory: [
    { blood_group: "O_NEG", component: "RBC", current_units: 3.0, safety_reserve: 2.0, expiring_3d: 0.0, forecast_demand: 14.8, shortage_prob: 0.962, risk_level: "CRITICAL" },
    { blood_group: "O_POS", component: "RBC", current_units: 12.0, safety_reserve: 8.0, expiring_3d: 1.0, forecast_demand: 18.2, shortage_prob: 0.742, risk_level: "HIGH" },
    { blood_group: "B_POS", component: "Platelets", current_units: 4.0, safety_reserve: 4.0, expiring_3d: 1.0, forecast_demand: 7.5, shortage_prob: 0.812, risk_level: "HIGH" },
    { blood_group: "A_POS", component: "Plasma", current_units: 8.0, safety_reserve: 5.0, expiring_3d: 0.0, forecast_demand: 6.0, shortage_prob: 0.320, risk_level: "LOW" },
    { blood_group: "AB_POS", component: "Whole_Blood", current_units: 6.0, safety_reserve: 3.0, expiring_3d: 0.0, forecast_demand: 3.5, shortage_prob: 0.150, risk_level: "LOW" }
  ],
  incoming_transfers: [
    {
      source: "BB_003",
      source_name: "City Health Authority Blood Bank",
      destination: "HOSP_007",
      destination_name: "Valley Trauma Center",
      donor_blood_group: "O_NEG",
      recipient_blood_group: "O_NEG",
      component: "RBC",
      is_exact_match: true,
      units: 12,
      distance_km: 18.4,
      travel_time_minutes: 32.5,
      route_id: "RT_00067",
      is_fefo_priority: true
    }
  ],
  donor_mobilizations: [
    {
      hospital_id: "HOSP_007",
      hospital_name: "Valley Trauma Center",
      blood_group: "O_NEG",
      component: "RBC",
      priority_tier: "CRITICAL",
      candidate_pool_size: 42,
      expected_response_yield: 4.2,
      top_candidates: [
        {
          donor_id: "DONOR_01421",
          blood_group: "O_NEG",
          distance_km: 6.8,
          composite_score: 0.942,
          rank: 1,
          medical_clearance: true,
          days_since_last_donation: 118,
          availability: "Available",
          contact_priority: "P1_Immediate",
          recommendation_reason: "Universal donor O_NEG, 6.8km proximity, 94% response reliability."
        }
      ]
    }
  ],
  nearby_blood_banks: [
    { blood_bank_id: "BB_003", name: "City Health Authority Blood Bank", distance_km: 18.4, eta_minutes: 32.5, status: "Operational" },
    { blood_bank_id: "BB_001", name: "Metropolitan Central Blood Transfusion Center", distance_km: 22.1, eta_minutes: 46.1, status: "Operational" },
    { blood_bank_id: "BB_008", name: "Lakeside District Blood Center", distance_km: 8.2, eta_minutes: 18.0, status: "Operational" }
  ]
};
