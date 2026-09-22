/**
 * TypeScript definitions for AI Blood Supply Command Center Operations Dashboard.
 * Strict 1-to-1 parity with FastAPI bridge and Python backend schemas.
 */

export type BloodGroup = "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG";
export type BloodComponent = "RBC" | "Platelets" | "Plasma" | "Whole_Blood";
export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type DecisionType = "TRANSFER_ONLY" | "DONOR_ONLY" | "COMBINED" | "NO_ACTION_NEEDED";

export interface ShortageAlert {
  hospital_id: string;
  hospital_name: string;
  blood_group: BloodGroup;
  component: BloodComponent;
  forecast_demand_units: number;
  current_stock_units: number;
  shortage_probability: number;
  risk_level: RiskLevel;
  is_emergency: boolean;
}

export interface TransferRecommendation {
  source: string;
  source_name: string;
  destination: string;
  destination_name: string;
  donor_blood_group: BloodGroup;
  recipient_blood_group: BloodGroup;
  component: BloodComponent;
  is_exact_match: boolean;
  units: number;
  distance_km: number;
  travel_time_minutes: number;
  route_id: string;
  is_fefo_priority: boolean;
}

export interface DonorCandidate {
  donor_id: string;
  blood_group: BloodGroup;
  distance_km: number;
  composite_score: number;
  rank: number;
  medical_clearance: boolean;
  days_since_last_donation: number;
  availability: string;
  contact_priority: string;
  recommendation_reason: string;
}

export interface DonorRecommendation {
  hospital_id: string;
  hospital_name: string;
  blood_group: BloodGroup;
  component: BloodComponent;
  priority_tier: RiskLevel;
  candidate_pool_size: number;
  expected_response_yield: number;
  top_candidates: DonorCandidate[];
}

export interface DecisionBreakdown {
  transfer_only: number;
  donor_only: number;
  combined: number;
  no_action_needed: number;
  total_demands_evaluated: number;
}

export interface NetworkMetrics {
  total_shortages_before: number;
  critical_shortages_before: number;
  total_shortage_units_before: number;
  emergency_unmet_units_before: number;
  total_shortages_after: number;
  total_shortage_units_after: number;
  emergency_unmet_units_after: number;
  emergency_protection_rate_pct: number;
  total_units_transferred: number;
  total_donor_units_mobilized: number;
  fefo_expiring_units_rescued: number;
  total_transport_distance_km: number;
  average_transfer_distance_km: number;
  average_eta_minutes: number;
  decision_breakdown: DecisionBreakdown;
}

export interface OptimizationExplanation {
  transfer_id: string;
  transfer_summary: string;
  explanation: {
    hospital_condition: {
      hospital_id: string;
      hospital_name: string;
      shortage_probability: number;
      forecast_demand: number;
      current_inventory: number;
      is_emergency: boolean;
    };
    source_condition: {
      source_id: string;
      source_name: string;
      current_inventory: number;
      safety_reserve: number;
      transferable_inventory: number;
    };
    logistics_feasibility: {
      distance_km: number;
      eta_minutes: number;
      route_status: string;
      product_match: string;
      fefo_priority: boolean;
    };
    summary_rationale: string;
  };
}

export interface CommandCenterPayload {
  status: string;
  date: string;
  horizon: number;
  scenario: string;
  optimization_status: string;
  solve_time_seconds: number;
  network_metrics: NetworkMetrics;
  shortage_alerts: ShortageAlert[];
  transfer_recommendations: TransferRecommendation[];
  donor_recommendations: DonorRecommendation[];
  unmet_shortages: Array<{
    hospital: string;
    blood_group: BloodGroup;
    component: BloodComponent;
    unmet_units: number;
    reason: string;
  }>;
  decision_breakdown: DecisionBreakdown;
  explanations: OptimizationExplanation[];
  disclaimer: string;
}

export interface HospitalNode {
  id: string;
  name: string;
  type: "Hospital";
  hospital_type: string;
  latitude: number;
  longitude: number;
  bed_capacity: number;
  icu_capacity: number;
  storage_capacity: number;
  status: string;
  shortage_count: number;
  risk_level: RiskLevel;
}

export interface BloodBankNode {
  id: string;
  name: string;
  type: "Blood_Bank";
  latitude: number;
  longitude: number;
  storage_capacity: number;
  daily_collection_capacity: number;
  emergency_support: boolean;
  status: string;
}

export interface TransportRoute {
  route_id: string;
  source_id: string;
  destination_id: string;
  distance_km: number;
  travel_time_minutes: number;
  transport_capacity: number;
  status: "Active" | "Disrupted" | "Maintenance";
}

export interface NetworkPayload {
  nodes: {
    hospitals: HospitalNode[];
    blood_banks: BloodBankNode[];
    total_hospitals: number;
    total_blood_banks: number;
  };
  routes: TransportRoute[];
  metrics: {
    total_routes: number;
    active_routes: number;
    disrupted_routes: number;
    avg_distance_km: number;
    avg_travel_time_min: number;
  };
}

export interface FacilityInventoryRow {
  facility_id: string;
  name: string;
  type: string;
  total_units: number;
  safety_reserve: number;
  expiring_3d: number;
  usable_excess: number;
  capacity: number;
  utilization_pct: number;
}

export interface InventoryPayload {
  summary: {
    total_units: number;
    total_safety_reserve: number;
    usable_excess: number;
    expiring_1d: number;
    expiring_3d: number;
    expiring_5d: number;
  };
  by_blood_group: Record<BloodGroup, number>;
  by_component: Record<BloodComponent, number>;
  facilities: FacilityInventoryRow[];
}

export interface HospitalIntelligence {
  hospital_id: string;
  name: string;
  city: string;
  type: string;
  bed_capacity: number;
  icu_capacity: number;
  storage_capacity: number;
  status: string;
  overall_risk_status: RiskLevel;
  total_stock_units: number;
  inventory: Array<{
    blood_group: BloodGroup;
    component: BloodComponent;
    current_units: number;
    safety_reserve: number;
    expiring_3d: number;
    forecast_demand: number;
    shortage_prob: number;
    risk_level: RiskLevel;
  }>;
  incoming_transfers: TransferRecommendation[];
  donor_mobilizations: DonorRecommendation[];
  nearby_blood_banks: Array<{
    blood_bank_id: string;
    name: string;
    distance_km: number;
    eta_minutes: number;
    status: string;
  }>;
}

export interface ScenarioMeta {
  id: string;
  name: string;
  description: string;
}

export interface ScenarioComparison {
  scenario_id: string;
  scenario_name: string;
  date: string;
  horizon_hours: number;
  solver_status: string;
  solver_time_seconds: number;
  before_optimization: {
    shortage_count: number;
    shortage_units: number;
    critical_shortage_count: number;
    emergency_unmet_units: number;
  };
  after_optimization: {
    shortage_count: number;
    shortage_units: number;
    critical_shortage_count: number;
    emergency_unmet_units: number;
    emergency_protection_rate_pct: number;
  };
  transfers: {
    order_count: number;
    total_units_transferred: number;
    total_transport_distance_km: number;
    average_distance_km: number;
    average_eta_minutes: number;
  };
  donor_mobilizations: {
    total_units_mobilized: number;
  };
  fefo: {
    expiring_units_rescued: number;
  };
  decision_breakdown: DecisionBreakdown;
}
