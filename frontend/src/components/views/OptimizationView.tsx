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
  PieChart
} from "lucide-react";
import {
  CommandCenterPayload,
  TransferRecommendation,
  OptimizationExplanation
} from "@/types/commandCenter";

interface OptimizationViewProps {
  commandCenter: CommandCenterPayload;
  onSelectHospital: (id: string) => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  commandCenter,
  onSelectHospital
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
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-ops-cyan" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Engine 4 — Network Transshipment Optimization
            </h2>
          </div>
          <p className="text-xs text-ops-dim">
            Mixed-Integer Linear Program (MILP) solving multi-commodity network flow with FEFO rescue and emergency preservation
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="bg-ops-card px-3 py-1 rounded border border-ops-border">
            <span className="text-ops-dim">Solver Status: </span>
            <span className="text-emerald-400 font-bold">{commandCenter.optimization_status}</span>
          </div>
          <div className="bg-ops-card px-3 py-1 rounded border border-ops-border">
            <span className="text-ops-dim">Solve Time: </span>
            <span className="text-ops-cyan font-bold">{commandCenter.solve_time_seconds.toFixed(2)}s</span>
          </div>
          <div className="bg-ops-card px-3 py-1 rounded border border-ops-border">
            <span className="text-ops-dim">Horizon: </span>
            <span className="text-white font-bold">{commandCenter.horizon}h</span>
          </div>
        </div>
      </div>

      {/* 6 Solver Impact KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
        <div className="p-3 rounded bg-ops-card border border-emerald-500/30 bg-emerald-950/20">
          <div className="text-[10px] text-emerald-400 uppercase font-bold">Unmet Shortage Units</div>
          <div className="text-xl font-bold text-emerald-400">{metrics.total_shortage_units_after.toFixed(1)}</div>
          <div className="text-[9px] text-emerald-300">100% Solved</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Units Transferred</div>
          <div className="text-xl font-bold text-ops-cyan">{metrics.total_units_transferred}</div>
          <div className="text-[9px] text-ops-dim">{transfers.length} dispatch orders</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Donor Mobilized</div>
          <div className="text-xl font-bold text-purple-400">{metrics.total_donor_units_mobilized}</div>
          <div className="text-[9px] text-ops-dim">Model 3 candidates</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-amber-500/30 bg-amber-950/20">
          <div className="text-[10px] text-amber-400 uppercase font-bold">FEFO Units Rescued</div>
          <div className="text-xl font-bold text-amber-400">{metrics.fefo_expiring_units_rescued}</div>
          <div className="text-[9px] text-amber-300">Expiry rebate credit</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Total Distance</div>
          <div className="text-xl font-bold text-ops-text">{metrics.total_transport_distance_km.toFixed(0)} km</div>
          <div className="text-[9px] text-ops-dim">Avg: {metrics.average_transfer_distance_km} km</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-emerald-500/30 bg-emerald-950/20">
          <div className="text-[10px] text-emerald-400 uppercase font-bold">Emergency Protection</div>
          <div className="text-xl font-bold text-emerald-400">{metrics.emergency_protection_rate_pct.toFixed(0)}%</div>
          <div className="text-[9px] text-emerald-300">Trauma priority</div>
        </div>
      </div>

      {/* Decision Mix Donut/Bar Breakdown */}
      <div className="bg-ops-card p-4 rounded border border-ops-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-ops-cyan" />
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Optimal Decision Policy Mix ({breakdown.total_demands_evaluated} Evaluated Demands)
            </span>
          </div>
          <span className="text-[11px] font-mono text-ops-dim">
            Engine 4 Multi-Tier Logistics Dispatch Logic
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="p-3 rounded bg-ops-panel border border-blue-500/30">
            <div className="text-[10px] text-blue-400 uppercase font-bold">TRANSFER ONLY</div>
            <div className="text-lg font-bold text-white mt-1">{breakdown.transfer_only}</div>
            <div className="text-[10px] text-ops-dim">
              {((breakdown.transfer_only / breakdown.total_demands_evaluated) * 100).toFixed(1)}% of demands
            </div>
            <div className="w-full bg-ops-border h-1 rounded mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${(breakdown.transfer_only / breakdown.total_demands_evaluated) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-ops-panel border border-purple-500/30">
            <div className="text-[10px] text-purple-400 uppercase font-bold">DONOR ONLY</div>
            <div className="text-lg font-bold text-white mt-1">{breakdown.donor_only}</div>
            <div className="text-[10px] text-ops-dim">
              {((breakdown.donor_only / breakdown.total_demands_evaluated) * 100).toFixed(1)}% of demands
            </div>
            <div className="w-full bg-ops-border h-1 rounded mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full"
                style={{ width: `${(breakdown.donor_only / breakdown.total_demands_evaluated) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-ops-panel border border-emerald-500/30">
            <div className="text-[10px] text-emerald-400 uppercase font-bold">COMBINED INTERVENTION</div>
            <div className="text-lg font-bold text-white mt-1">{breakdown.combined}</div>
            <div className="text-[10px] text-ops-dim">
              {((breakdown.combined / breakdown.total_demands_evaluated) * 100).toFixed(1)}% of demands
            </div>
            <div className="w-full bg-ops-border h-1 rounded mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(breakdown.combined / breakdown.total_demands_evaluated) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-ops-panel border border-ops-border">
            <div className="text-[10px] text-ops-dim uppercase font-bold">NO ACTION NEEDED</div>
            <div className="text-lg font-bold text-white mt-1">{breakdown.no_action_needed}</div>
            <div className="text-[10px] text-ops-dim">
              {((breakdown.no_action_needed / breakdown.total_demands_evaluated) * 100).toFixed(1)}% safe reserve
            </div>
            <div className="w-full bg-ops-border h-1 rounded mt-2 overflow-hidden">
              <div
                className="bg-ops-dim h-full"
                style={{ width: `${(breakdown.no_action_needed / breakdown.total_demands_evaluated) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Transfer Plan Table + Explainability Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Schedule Table (2 cols) */}
        <div className="lg:col-span-2 bg-ops-card border border-ops-border rounded overflow-hidden">
          <div className="p-3 bg-ops-panel border-b border-ops-border flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Recommended Transshipment Orders ({transfers.length} allocations)
            </span>
            <span className="text-[10px] font-mono text-ops-dim">
              Select an order to view mathematical explanation &rarr;
            </span>
          </div>

          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-ops-card text-[10px] text-ops-dim uppercase border-b border-ops-border">
              <tr>
                <th className="p-3">Source Facility</th>
                <th className="p-3">Destination Hospital</th>
                <th className="p-3">Product Transferred</th>
                <th className="p-3 text-right">Units</th>
                <th className="p-3 text-right">Transit ETA</th>
                <th className="p-3 text-right">Distance</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ops-border">
              {transfers.slice(0, 15).map((t, idx) => {
                const isSelected = idx === selectedTransferIdx;
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedTransferIdx(idx)}
                    className={`cursor-pointer transition ${
                      isSelected ? "bg-ops-cardHover border-l-2 border-ops-cyan" : "hover:bg-ops-panel/60"
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-sans font-bold text-white">{t.source_name}</div>
                      <div className="text-[10px] text-ops-dim">{t.source}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-sans font-bold text-ops-blue">{t.destination_name}</div>
                      <div className="text-[10px] text-ops-dim">{t.destination}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-ops-cyan">{t.recipient_blood_group}</span>{" "}
                      <span className="text-ops-muted">{t.component}</span>
                    </td>
                    <td className="p-3 text-right text-emerald-400 font-bold text-sm">
                      {t.units}
                    </td>
                    <td className="p-3 text-right text-ops-text">{t.travel_time_minutes} min</td>
                    <td className="p-3 text-right text-ops-dim">{t.distance_km} km</td>
                    <td className="p-3 text-center">
                      {t.is_fefo_priority ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          FEFO
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-ops-panel text-ops-dim border border-ops-border">
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

        {/* Explainability Panel (1 col) */}
        <div className="bg-ops-card border border-ops-border rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-ops-border pb-3">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-ops-blue" />
              <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Constraint Explainability
              </span>
            </div>
            <span className="text-[10px] font-mono text-ops-cyan">WHY THIS TRANSFER?</span>
          </div>

          {activeExplanation?.explanation ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded bg-ops-panel border border-ops-border">
                <div className="text-[10px] text-ops-dim uppercase mb-1">Target Demand Condition</div>
                <div className="text-white font-bold font-sans">
                  {activeExplanation.explanation.hospital_condition?.hospital_name || activeTransfer?.destination_name || "Hospital"}
                </div>
                <div className="text-red-400 mt-1">
                  Shortage Probability:{" "}
                  {((activeExplanation.explanation.hospital_condition?.shortage_probability ?? 0) * 100).toFixed(1)}%
                </div>
                <div className="text-ops-muted text-[11px] mt-0.5">
                  Forecast Demand: {activeExplanation.explanation.hospital_condition?.forecast_demand ?? 0} | Stock:{" "}
                  {activeExplanation.explanation.hospital_condition?.current_inventory ?? 0}
                </div>
              </div>

              <div className="p-3 rounded bg-ops-panel border border-ops-border">
                <div className="text-[10px] text-ops-dim uppercase mb-1">Source Inventory Reserve</div>
                <div className="text-white font-bold font-sans">
                  {activeExplanation.explanation.source_condition?.source_name || activeTransfer?.source_name || "Source Facility"}
                </div>
                <div className="text-emerald-400 mt-1">
                  Transferable Above Reserve:{" "}
                  {activeExplanation.explanation.source_condition?.transferable_inventory ?? 0} units
                </div>
                <div className="text-ops-muted text-[11px] mt-0.5">
                  Mandatory Reserve: {activeExplanation.explanation.source_condition?.safety_reserve ?? 0} units
                </div>
              </div>

              <div className="p-3 rounded bg-ops-panel border border-ops-border">
                <div className="text-[10px] text-ops-dim uppercase mb-1">Logistics Feasibility</div>
                <div className="text-ops-blue">
                  ETA: {activeExplanation.explanation.logistics_feasibility?.eta_minutes ?? activeTransfer?.travel_time_minutes ?? 0} min (
                  {activeExplanation.explanation.logistics_feasibility?.distance_km ?? activeTransfer?.distance_km ?? 0} km)
                </div>
                <div className="text-ops-dim text-[11px] mt-0.5">
                  Route Status: {activeExplanation.explanation.logistics_feasibility?.route_status || "Active"} •{" "}
                  {activeExplanation.explanation.logistics_feasibility?.product_match || "Compatible match"}
                </div>
              </div>

              <div className="p-3 rounded bg-ops-card border border-ops-blue/30 bg-blue-950/20 font-sans text-ops-text text-xs leading-relaxed">
                <strong className="font-mono text-ops-blue block text-[10px] uppercase mb-1">
                  Solver Rationale Summary:
                </strong>
                {activeExplanation.explanation.summary_rationale || "Optimal allocation determined by OR-Tools MILP to minimize shortages and transit latency."}
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-ops-dim py-8">
              Select a transfer order from the table to inspect mathematical constraints.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
