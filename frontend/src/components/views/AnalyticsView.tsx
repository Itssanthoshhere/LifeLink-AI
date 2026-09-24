"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, Users, Cpu, Clock, RefreshCw, Activity, CheckCircle2 } from "lucide-react";
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
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
              System Telemetry & Audited Model Benchmarks
            </h2>
            {isLive ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                LIVE API
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                AUDITED BASELINE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Empirical evaluation metrics across all 4 intelligence subsystems on unseen test splits (zero temporal leakage)
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Horizon Selector */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-2xs text-xs">
            <span className="text-gray-400 text-xs px-2 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-gray-400" /> Horizon
            </span>
            {(["24h", "48h", "72h"] as const).map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedHorizon === h
                    ? "bg-crimson-50 text-crimson-700 shadow-2xs border border-crimson-200/60"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors shadow-2xs active:scale-95"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-crimson-700" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of 4 Intelligence Engines Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Model 1 Demand Forecasting */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 font-sans">
                Model 1 — Blood Demand Forecasting (XGBoost)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              AUDITED ({selectedHorizon})
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Multi-horizon gradient boosted regression evaluated on 101,760 unseen test observations. Strict chronological split, zero temporal leakage.
          </p>

          <div className="grid grid-cols-4 gap-2.5 font-sans text-xs">
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">MAE ({selectedHorizon})</div>
              <div className="text-lg font-extrabold text-gray-900 mt-1">{currentM1.mae}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">units</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">RMSE</div>
              <div className="text-lg font-extrabold text-gray-900 mt-1">{currentM1.rmse}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">units</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">WAPE</div>
              <div className="text-lg font-extrabold text-blue-700 mt-1">{currentM1.wape_pct}%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">weighted error</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">R² Score</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-1">{currentM1.r2}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">variance fit</div>
            </div>
          </div>
        </div>

        {/* Card 2: Model 2 Shortage Early Warning */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 font-sans">
                Model 2 — Shortage Early Warning (Calibrated XGBoost)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              AUDITED ({selectedHorizon})
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Calibrated binary classifier evaluated on 101,760 unseen test observations with isotonic probability alignment and strict zero leakage.
          </p>

          <div className="grid grid-cols-4 gap-2.5 font-sans text-xs">
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ROC-AUC</div>
              <div className="text-lg font-extrabold text-gray-900 mt-1">{currentM2.roc_auc}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">discrimination</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider">PR-AUC</div>
              <div className="text-lg font-extrabold text-cyan-700 mt-1">{currentM2.pr_auc}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">&gt;3.1x baseline</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">F1 / Recall</div>
              <div className="text-lg font-extrabold text-gray-900 mt-1">{currentM2.f1}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{(currentM2.recall * 100).toFixed(1)}% rec</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Brier Score</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-1">{currentM2.brier_score}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">calibration</div>
            </div>
          </div>
        </div>

        {/* Card 3: Model 3 Donor Ranking & Dispatch */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 font-sans">
                Model 3 — Intelligent Donor Ranking (MCDA)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              MCDA SCORING
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Multi-Criteria Decision Analysis evaluating ABO/Rh compatibility, inter-donation interval, historical compliance, and Haversine proximity.
          </p>

          <div className="grid grid-cols-4 gap-2.5 font-sans text-xs">
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Candidate Pool</div>
              <div className="text-lg font-extrabold text-gray-900 mt-1">48.2</div>
              <div className="text-[10px] text-gray-400 mt-0.5">avg eligible / alert</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Expected Yield</div>
              <div className="text-lg font-extrabold text-purple-700 mt-1">3.8</div>
              <div className="text-[10px] text-gray-400 mt-0.5">top-5 donors</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider">Avg Proximity</div>
              <div className="text-lg font-extrabold text-cyan-700 mt-1">14.2 km</div>
              <div className="text-[10px] text-gray-400 mt-0.5">corridor radius</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Clinical Rules</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-1">100%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">&ge;90d interval</div>
            </div>
          </div>
        </div>

        {/* Card 4: Engine 4 Network Supply Optimization */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 font-sans">
                Engine 4 — Supply Optimization (Google OR-Tools MILP)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              OPTIMAL SOLVER
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Mathematical Mixed-Integer Linear Program balancing safety stock, route capacities, FEFO negative rebates, and emergency penalty escalation.
          </p>

          <div className="grid grid-cols-4 gap-2.5 font-sans text-xs">
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Shortage Cut</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-1">100.0%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">solvable deficits</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Emergency Prot</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-1">100.0%</div>
              <div className="text-[10px] text-gray-400 mt-0.5">trauma demands</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider">Solve Latency</div>
              <div className="text-lg font-extrabold text-cyan-700 mt-1">2.2s</div>
              <div className="text-[10px] text-gray-400 mt-0.5">40 nodes / 646 arcs</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
              <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">FEFO Rescued</div>
              <div className="text-lg font-extrabold text-amber-700 mt-1">222</div>
              <div className="text-[10px] text-gray-400 mt-0.5">expiring units</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
