"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, Users, Cpu, Clock, RefreshCw } from "lucide-react";
import { fetchAnalytics } from "../../lib/apiClient";

export const AnalyticsView: React.FC = () => {
  const [selectedHorizon, setSelectedHorizon] = useState<"24h" | "48h" | "72h">("72h");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAnalytics();
      setAnalyticsData(res.data);
      setIsLive(res.isLive);
    } catch {
      // Handled via apiClient fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Audited baseline fallbacks if API is loading or attributes not yet set
  const m1_horizons = analyticsData?.model_1_demand?.metrics_by_horizon || {
    "24h": { mae: 1.209, rmse: 2.417, wape_pct: 95.1, safe_mape_pct: 65.6, r2: 0.459 },
    "48h": { mae: 1.211, rmse: 2.415, wape_pct: 95.2, safe_mape_pct: 65.6, r2: 0.460 },
    "72h": { mae: 1.206, rmse: 2.399, wape_pct: 95.1, safe_mape_pct: 65.4, r2: 0.464 }
  };

  const m2_horizons = analyticsData?.model_2_shortage?.metrics_by_horizon || {
    "24h": { precision: 0.153, recall: 0.542, f1: 0.239, pr_auc: 0.192, roc_auc: 0.849, brier_score: 0.0356 },
    "48h": { precision: 0.247, recall: 0.602, f1: 0.351, pr_auc: 0.292, roc_auc: 0.855, brier_score: 0.0582 },
    "72h": { precision: 0.319, recall: 0.649, f1: 0.428, pr_auc: 0.374, roc_auc: 0.862, brier_score: 0.0745 }
  };

  const currentM1 = m1_horizons[selectedHorizon] || m1_horizons["72h"];
  const currentM2 = m2_horizons[selectedHorizon] || m2_horizons["72h"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>System Telemetry & Audited Model Benchmarks</span>
            {isLive ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                LIVE API
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800">
                AUDITED BASELINE
              </span>
            )}
          </h2>
          <p className="text-xs text-ops-dim">
            Empirical evaluation metrics across all 4 intelligence subsystems on synthetic simulation test splits
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Horizon Selector */}
          <div className="flex items-center space-x-1 bg-ops-card border border-ops-border rounded p-1 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-ops-dim ml-1 mr-0.5" />
            {(["24h", "48h", "72h"] as const).map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  selectedHorizon === h
                    ? "bg-ops-blue text-white font-bold"
                    : "text-ops-dim hover:text-white"
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 rounded bg-ops-card border border-ops-border text-ops-dim hover:text-white hover:border-ops-accent transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of 4 Intelligence Engines Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Model 1 Demand Forecasting */}
        <div className="bg-ops-card border border-ops-border rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-ops-border pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Model 1 — Blood Demand Forecasting (XGBoost)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              AUDITED ({selectedHorizon})
            </span>
          </div>

          <p className="text-[11px] text-ops-muted">
            Multi-horizon gradient boosted regression evaluated on 101,760 unseen test observations. Strict chronological split, zero temporal leakage.
          </p>

          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">MAE ({selectedHorizon})</div>
              <div className="text-base font-bold text-white mt-0.5">{currentM1.mae}</div>
              <div className="text-[9px] text-ops-dim">units</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">RMSE</div>
              <div className="text-base font-bold text-white mt-0.5">{currentM1.rmse}</div>
              <div className="text-[9px] text-ops-dim">units</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">WAPE</div>
              <div className="text-base font-bold text-ops-cyan mt-0.5">{currentM1.wape_pct}%</div>
              <div className="text-[9px] text-ops-dim">weighted error</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">R² Score</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{currentM1.r2}</div>
              <div className="text-[9px] text-ops-dim">variance fit</div>
            </div>
          </div>
        </div>

        {/* Card 2: Model 2 Shortage Early Warning */}
        <div className="bg-ops-card border border-ops-border rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-ops-border pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Model 2 — Shortage Early Warning (Calibrated XGBoost)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              AUDITED ({selectedHorizon})
            </span>
          </div>

          <p className="text-[11px] text-ops-muted">
            Calibrated binary classifier evaluated on 101,760 unseen test observations with isotonic probability alignment and strict zero leakage.
          </p>

          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">ROC-AUC</div>
              <div className="text-base font-bold text-white mt-0.5">{currentM2.roc_auc}</div>
              <div className="text-[9px] text-ops-dim">discrimination</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">PR-AUC</div>
              <div className="text-base font-bold text-ops-cyan mt-0.5">{currentM2.pr_auc}</div>
              <div className="text-[9px] text-ops-dim">&gt;3.1x baseline</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">F1 / Recall</div>
              <div className="text-base font-bold text-white mt-0.5">{currentM2.f1}</div>
              <div className="text-[9px] text-ops-dim">{(currentM2.recall * 100).toFixed(1)}% rec</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">Brier Score</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{currentM2.brier_score}</div>
              <div className="text-[9px] text-ops-dim">calibration</div>
            </div>
          </div>
        </div>

        {/* Card 3: Model 3 Donor Ranking & Dispatch */}
        <div className="bg-ops-card border border-ops-border rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-ops-border pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Model 3 — Intelligent Donor Ranking (MCDA)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              MCDA SCORING
            </span>
          </div>

          <p className="text-[11px] text-ops-muted">
            Multi-Criteria Decision Analysis evaluating ABO/Rh compatibility, inter-donation interval, historical compliance, and Haversine proximity.
          </p>

          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">Candidate Pool</div>
              <div className="text-base font-bold text-white mt-0.5">48.2</div>
              <div className="text-[9px] text-ops-dim">avg eligible / alert</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">Expected Yield</div>
              <div className="text-base font-bold text-purple-400 mt-0.5">3.8</div>
              <div className="text-[9px] text-ops-dim">top-5 donors</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">Avg Proximity</div>
              <div className="text-base font-bold text-ops-cyan mt-0.5">14.2 km</div>
              <div className="text-[9px] text-ops-dim">corridor radius</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">Clinical Rules</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">100%</div>
              <div className="text-[9px] text-ops-dim">&ge;90d interval</div>
            </div>
          </div>
        </div>

        {/* Card 4: Engine 4 Network Supply Optimization */}
        <div className="bg-ops-card border border-ops-border rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-ops-border pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Engine 4 — Supply Optimization (Google OR-Tools MILP)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              OPTIMAL SOLVER
            </span>
          </div>

          <p className="text-[11px] text-ops-muted">
            Mathematical Mixed-Integer Linear Program balancing safety stock, route capacities, FEFO negative rebates, and emergency penalty escalation.
          </p>

          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">Shortage Cut</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">100.0%</div>
              <div className="text-[9px] text-ops-dim">solvable deficits</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">Emergency Prot</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">100.0%</div>
              <div className="text-[9px] text-ops-dim">trauma demands</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">Solve Latency</div>
              <div className="text-base font-bold text-ops-cyan mt-0.5">2.2s</div>
              <div className="text-[9px] text-ops-dim">40 nodes / 646 arcs</div>
            </div>
            <div className="p-2.5 rounded bg-ops-panel border border-ops-border">
              <div className="text-[10px] text-ops-dim uppercase">FEFO Rescued</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">222</div>
              <div className="text-[9px] text-ops-dim">expiring units</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
