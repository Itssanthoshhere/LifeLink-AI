import {
  CommandCenterPayload,
  NetworkPayload,
  InventoryPayload,
  HospitalIntelligence,
  ScenarioComparison
} from "../types/commandCenter";
import {
  MOCK_COMMAND_CENTER,
  MOCK_NETWORK,
  MOCK_INVENTORY,
  MOCK_HOSPITAL_INTELLIGENCE
} from "./mockData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ApiResponse<T> {
  data: T;
  isLive: boolean;
  error?: string;
}

/**
 * Fetch unified Command Center master intelligence with fallback to mock data.
 */
export async function fetchCommandCenter(
  date: string = "2025-12-01",
  horizon: number = 72,
  scenario: string = "normal"
): Promise<ApiResponse<CommandCenterPayload>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/command-center?date=${date}&horizon=${horizon}&scenario=${scenario}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err: any) {
    // Graceful fallback to mock data
    const mock = { ...MOCK_COMMAND_CENTER, date, horizon, scenario };
    return { data: mock, isLive: false, error: err.message };
  }
}

/**
 * Fetch Network topology nodes and routes.
 */
export async function fetchNetwork(scenario: string = "normal"): Promise<ApiResponse<NetworkPayload>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/network?scenario=${scenario}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err: any) {
    return { data: MOCK_NETWORK, isLive: false, error: err.message };
  }
}

/**
 * Fetch Inventory breakdown.
 */
export async function fetchInventory(horizon: number = 72, scenario: string = "normal"): Promise<ApiResponse<InventoryPayload>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventory?horizon=${horizon}&scenario=${scenario}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err: any) {
    return { data: MOCK_INVENTORY, isLive: false, error: err.message };
  }
}

/**
 * Fetch deep-dive intelligence for a single hospital.
 */
export async function fetchHospitalIntelligence(
  hospitalId: string,
  date: string = "2025-12-01",
  horizon: number = 72,
  scenario: string = "normal"
): Promise<ApiResponse<HospitalIntelligence>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/hospital/${hospitalId}?date=${date}&horizon=${horizon}&scenario=${scenario}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err: any) {
    const mock = { ...MOCK_HOSPITAL_INTELLIGENCE, hospital_id: hospitalId };
    return { data: mock, isLive: false, error: err.message };
  }
}

/**
 * Fetch before vs after optimization scenario comparison.
 */
export async function fetchScenarioImpact(scenario: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scenarios/${scenario}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err: any) {
    return {
      data: {
        scenario,
        source: "mock_fallback",
        data: {
          scenario_name: scenario.replace("_", " ").toUpperCase(),
          solver_status: "OPTIMAL",
          solver_time_seconds: 2.2,
          impact_summary: MOCK_COMMAND_CENTER.network_metrics
        }
      },
      isLive: false,
      error: err.message
    };
  }
}

/**
 * Fetch Analytics benchmarks.
 */
export async function fetchAnalytics(): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analytics`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch (err: any) {
    return {
      data: {
        model_1_demand: {
          name: "Model 1: Demand Forecasting (XGBoost)",
          metrics_72h: { mae: 1.206, rmse: 2.399, wape_pct: 95.1, safe_mape_pct: 65.4, r2: 0.464 },
          metrics_by_horizon: {
            "24h": { mae: 1.209, rmse: 2.417, wape_pct: 95.1, safe_mape_pct: 65.6, r2: 0.459 },
            "48h": { mae: 1.211, rmse: 2.415, wape_pct: 95.2, safe_mape_pct: 65.6, r2: 0.460 },
            "72h": { mae: 1.206, rmse: 2.399, wape_pct: 95.1, safe_mape_pct: 65.4, r2: 0.464 }
          },
          features_used: 28,
          status: "Validated & Frozen"
        },
        model_2_shortage: {
          name: "Model 2: Shortage Early Warning (Calibrated XGBoost)",
          metrics_72h: { roc_auc: 0.862, pr_auc: 0.374, brier_score: 0.0745, f1: 0.428, precision: 0.319, recall: 0.649 },
          metrics_by_horizon: {
            "24h": { precision: 0.153, recall: 0.542, f1: 0.239, pr_auc: 0.192, roc_auc: 0.849, brier_score: 0.0356 },
            "48h": { precision: 0.247, recall: 0.602, f1: 0.351, pr_auc: 0.292, roc_auc: 0.855, brier_score: 0.0582 },
            "72h": { precision: 0.319, recall: 0.649, f1: 0.428, pr_auc: 0.374, roc_auc: 0.862, brier_score: 0.0745 }
          },
          status: "Audited (Zero Leakage)"
        },
        model_3_donors: {
          name: "Model 3: Intelligent Donor Ranking (MCDA)",
          metrics: { avg_candidate_pool: 48.2, expected_yield_top5: 3.8, avg_distance_km: 14.2 },
          status: "Validated (Rule/MCDA)"
        },
        engine_4_optimization: {
          name: "Engine 4: Supply Network Optimization (Google OR-Tools MILP)",
          metrics: {
            shortage_elimination_rate_pct: 100.0,
            emergency_protection_rate_pct: 100.0,
            avg_solve_time_seconds: 2.2,
            fefo_rescue_units: 222
          },
          status: "Optimal MILP"
        }
      },
      isLive: false,
      error: err.message
    };
  }
}
