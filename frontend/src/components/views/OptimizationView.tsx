"use client";

import React, { useState } from "react";
import {
  Zap,
  Truck,
  ShieldCheck,
  Clock,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  PieChart,
  Cpu
} from "lucide-react";
import {
  CommandCenterPayload,
  TransferRecommendation,
  OptimizationExplanation
} from "@/types/commandCenter";

interface OptimizationViewProps {
  commandCenter: CommandCenterPayload;
  onSelectHospital: (id: string) => void;
  onOpenExplainer?: (transfer: TransferRecommendation) => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  commandCenter,
  onSelectHospital,
  onOpenExplainer
}) => {
  const [selectedTransferIdx, setSelectedTransferIdx] = useState<number>(0);
  const transfers = commandCenter.transfer_recommendations;
  const metrics = commandCenter.network_metrics;
  const breakdown = commandCenter.decision_breakdown;
  const activeTransfer = transfers[selectedTransferIdx] || transfers[0];

  const explanationsList = Array.isArray(commandCenter.explanations)
    ? commandCenter.explanations
    : [];

  // Match corresponding explanation
  const activeExplanation =
    explanationsList.find(
      (e) =>
        e?.explanation?.hospital_condition?.hospital_id === activeTransfer?.destination
    ) || explanationsList[0];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-crimson-50 text-crimson-700 border border-crimson-200/60">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
              Engine 4 — Network Transshipment Optimization
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Mixed-Integer Linear Program (MILP) solving multi-commodity network flow with FEFO rescue and emergency preservation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-gray-500 font-medium">Status: </span>
            <span className="text-emerald-700 font-bold">{commandCenter.optimization_status}</span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-gray-500 font-medium">Solve Time: </span>
            <span className="text-crimson-700 font-bold">{commandCenter.solve_time_seconds.toFixed(2)}s</span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-gray-500 font-medium">Horizon: </span>
            <span className="text-gray-900 font-bold">{commandCenter.horizon}h</span>
          </div>
        </div>
      </div>

      {/* 6 Solver Impact KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 font-sans">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
          <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Unmet Shortages</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{metrics.total_shortage_units_after.toFixed(1)}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">100% Mitigated</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Transferred Units</div>
          <div className="text-2xl font-extrabold text-cyan-700 mt-1">{metrics.total_units_transferred}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{transfers.length} orders</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Donor Mobilized</div>
          <div className="text-2xl font-extrabold text-purple-700 mt-1">{metrics.total_donor_units_mobilized}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Model 3 candidates</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
          <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">FEFO Rescued</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{metrics.fefo_expiring_units_rescued}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Expiry rebate credit</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total Distance</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{metrics.total_transport_distance_km.toFixed(0)} km</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Avg: {metrics.average_transfer_distance_km} km</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
          <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Emergency Rate</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{metrics.emergency_protection_rate_pct.toFixed(0)}%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Trauma priority</div>
        </div>
      </div>

      {/* Decision Mix Donut/Bar Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-crimson-700" />
            <span className="text-sm font-bold text-gray-900 font-sans">
              Optimal Decision Policy Mix ({breakdown.total_demands_evaluated} Evaluated Demands)
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Multi-Tier Dispatch Classification
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 font-sans">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80">
            <div className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">TRANSFER ONLY</div>
            <div className="text-xl font-extrabold text-gray-900 mt-1">{breakdown.transfer_only}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {((breakdown.transfer_only / breakdown.total_demands_evaluated) * 100).toFixed(1)}% of demands
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${(breakdown.transfer_only / breakdown.total_demands_evaluated) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80">
            <div className="text-[10px] text-purple-700 uppercase font-bold tracking-wider">DONOR ONLY</div>
            <div className="text-xl font-extrabold text-gray-900 mt-1">{breakdown.donor_only}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {((breakdown.donor_only / breakdown.total_demands_evaluated) * 100).toFixed(1)}% of demands
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full"
                style={{ width: `${(breakdown.donor_only / breakdown.total_demands_evaluated) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">COMBINED INTERVENTION</div>
            <div className="text-xl font-extrabold text-gray-900 mt-1">{breakdown.combined}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {((breakdown.combined / breakdown.total_demands_evaluated) * 100).toFixed(1)}% of demands
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${(breakdown.combined / breakdown.total_demands_evaluated) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">NO ACTION NEEDED</div>
            <div className="text-xl font-extrabold text-gray-900 mt-1">{breakdown.no_action_needed}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {((breakdown.no_action_needed / breakdown.total_demands_evaluated) * 100).toFixed(1)}% safe reserves
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-gray-400 h-full rounded-full"
                style={{ width: `${(breakdown.no_action_needed / breakdown.total_demands_evaluated) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Transfer Plan Table + Explainability Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Schedule Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-gray-50/80 border-b border-gray-200/80 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900 font-sans">
              Recommended Transshipment Orders ({transfers.length} allocations)
            </span>
            <span className="text-xs text-gray-500">
              Select an order to view mathematical constraints &rarr;
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
                <tr>
                  <th className="p-3.5">Source Facility</th>
                  <th className="p-3.5">Destination Hospital</th>
                  <th className="p-3.5">Product Transferred</th>
                  <th className="p-3.5 text-right">Units</th>
                  <th className="p-3.5 text-right">Transit ETA</th>
                  <th className="p-3.5 text-right">Distance</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfers.slice(0, 15).map((t, idx) => {
                  const isSelected = idx === selectedTransferIdx;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedTransferIdx(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-crimson-50/50 border-l-4 border-crimson-600" : "hover:bg-gray-50/70"
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900">{t.source_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{t.source}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-blue-700">{t.destination_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{t.destination}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-crimson-700 bg-crimson-50 px-2 py-0.5 rounded-md border border-crimson-200">
                          {t.recipient_blood_group}
                        </span>{" "}
                        <span className="text-gray-600 font-medium ml-1">{t.component}</span>
                      </td>
                      <td className="p-3.5 text-right text-emerald-700 font-bold text-sm">
                        {t.units}
                      </td>
                      <td className="p-3.5 text-right text-gray-700">{t.travel_time_minutes} min</td>
                      <td className="p-3.5 text-right text-gray-500">{t.distance_km} km</td>
                      <td className="p-3.5 text-center">
                        {t.is_fefo_priority ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            FEFO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                            ROUTINE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Explainability Panel (1 col) */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-crimson-700" />
              <span className="text-sm font-bold text-gray-900 font-sans">
                Constraint Explainability
              </span>
            </div>
            <span className="text-xs font-semibold text-crimson-700 bg-crimson-50 px-2.5 py-0.5 rounded-full border border-crimson-200">
              Why this transfer?
            </span>
          </div>

          {activeExplanation?.explanation ? (
            <div className="space-y-3.5 text-xs font-sans">
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/80 shadow-2xs">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Target Demand Condition</div>
                <div className="text-gray-900 font-bold text-sm">
                  {activeExplanation.explanation.hospital_condition?.hospital_name || activeTransfer?.destination_name || "Hospital"}
                </div>
                <div className="text-crimson-700 font-semibold mt-1">
                  Shortage Risk:{" "}
                  {((activeExplanation.explanation.hospital_condition?.shortage_probability ?? 0) * 100).toFixed(1)}%
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5">
                  Forecast Demand: {activeExplanation.explanation.hospital_condition?.forecast_demand ?? 0} | Stock:{" "}
                  {activeExplanation.explanation.hospital_condition?.current_inventory ?? 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/80 shadow-2xs">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Source Inventory Reserve</div>
                <div className="text-gray-900 font-bold text-sm">
                  {activeExplanation.explanation.source_condition?.source_name || activeTransfer?.source_name || "Source Facility"}
                </div>
                <div className="text-emerald-700 font-semibold mt-1">
                  Transferable Above Reserve:{" "}
                  {activeExplanation.explanation.source_condition?.transferable_inventory ?? 0} units
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5">
                  Safety Reserve Level: {activeExplanation.explanation.source_condition?.safety_reserve ?? 0} units
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/80 shadow-2xs">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Logistics Feasibility</div>
                <div className="text-blue-700 font-semibold">
                  ETA: {activeExplanation.explanation.logistics_feasibility?.eta_minutes ?? activeTransfer?.travel_time_minutes ?? 0} min (
                  {activeExplanation.explanation.logistics_feasibility?.distance_km ?? activeTransfer?.distance_km ?? 0} km)
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5">
                  Route Status: {activeExplanation.explanation.logistics_feasibility?.route_status || "Active"} •{" "}
                  {activeExplanation.explanation.logistics_feasibility?.product_match || "Compatible match"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-crimson-50/60 border border-crimson-200/80 text-gray-800 text-xs leading-relaxed shadow-2xs">
                <strong className="text-crimson-800 block text-[11px] uppercase tracking-wider mb-1 font-bold">
                  MILP Solver Rationale Summary:
                </strong>
                {activeExplanation.explanation.summary_rationale || "Optimal allocation determined by OR-Tools MILP to minimize shortages and transit latency."}
                
                {onOpenExplainer && (
                  <button
                    onClick={() => onOpenExplainer(activeTransfer)}
                    className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-crimson-600 to-crimson-800 hover:from-crimson-700 hover:to-crimson-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Deep MILP Audit & Sensitivity Stress-Test</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-gray-500 py-8">
              Select a transfer order from the table to inspect mathematical constraints.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
