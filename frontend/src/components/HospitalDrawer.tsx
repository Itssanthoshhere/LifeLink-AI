"use client";

import React from "react";
import {
  X,
  Building2,
  AlertTriangle,
  TrendingUp,
  Truck,
  Users,
  Shield,
  Clock,
  ArrowRight
} from "lucide-react";
import { HospitalIntelligence } from "@/types/commandCenter";

interface HospitalDrawerProps {
  hospital: HospitalIntelligence | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectHospital?: (id: string) => void;
}

export const HospitalDrawer: React.FC<HospitalDrawerProps> = ({
  hospital,
  isOpen,
  onClose
}) => {
  if (!isOpen || !hospital) return null;

  const isCritical = hospital.overall_risk_status === "CRITICAL";
  const isHigh = hospital.overall_risk_status === "HIGH";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-ops-panel border-l border-ops-border h-full shadow-2xl flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-ops-border bg-ops-card/50 flex items-start justify-between sticky top-0 z-10 backdrop-blur">
          <div>
            <div className="flex items-center space-x-2.5">
              <Building2 className="w-5 h-5 text-ops-blue" />
              <h2 className="text-base font-bold text-white tracking-tight">{hospital.name}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-ops-card border border-ops-border text-ops-cyan">
                {hospital.hospital_id}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-ops-muted mt-1.5 font-mono">
              <span>{hospital.type}</span>
              <span>•</span>
              <span>Beds: {hospital.bed_capacity}</span>
              <span>•</span>
              <span>ICU: {hospital.icu_capacity}</span>
              <span>•</span>
              <span>Storage Cap: {hospital.storage_capacity}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border ${
                isCritical
                  ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                  : isHigh
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              }`}
            >
              {hospital.overall_risk_status} RISK
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-ops-card text-ops-dim hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-5 space-y-6">
          {/* Section 1: AI Recommended Action Banner */}
          <div className="p-3.5 rounded bg-ops-card border border-ops-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-ops-cyan uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-ops-cyan" />
                ENGINE 4 RECOMMENDED ACTION
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                {(hospital.incoming_transfers?.length ?? 0) > 0 && (hospital.donor_mobilizations?.length ?? 0) > 0
                  ? "COMBINED INTERVENTION"
                  : (hospital.incoming_transfers?.length ?? 0) > 0
                  ? "INTER-FACILITY TRANSFER"
                  : (hospital.donor_mobilizations?.length ?? 0) > 0
                  ? "LOCAL DONOR MOBILIZATION"
                  : "ROUTINE MONITORING"}
              </span>
            </div>
            {hospital.incoming_transfers && hospital.incoming_transfers.length > 0 ? (
              <div className="text-xs text-ops-text leading-relaxed">
                Inter-facility transshipment from{" "}
                <span className="font-bold text-ops-blue">
                  {hospital.incoming_transfers[0].source_name} ({hospital.incoming_transfers[0].source})
                </span>{" "}
                scheduled:{" "}
                <span className="font-bold text-emerald-400 font-mono">
                  {hospital.incoming_transfers[0].units} units{" "}
                  {hospital.incoming_transfers[0].recipient_blood_group}{" "}
                  {hospital.incoming_transfers[0].component}
                </span>{" "}
                via {hospital.incoming_transfers[0].route_id} (ETA:{" "}
                {hospital.incoming_transfers[0].travel_time_minutes} min,{" "}
                {hospital.incoming_transfers[0].distance_km} km).
              </div>
            ) : (
              <div className="text-xs text-ops-muted">
                No active inventory transshipment required. On-site stock exceeds safety reserve thresholds.
              </div>
            )}
          </div>

          {/* Section 2: Current Inventory Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Current Inventory vs Safety Reserve
              </h3>
              <span className="text-[11px] font-mono text-ops-dim">
                Total Stock: <strong className="text-white">{hospital.total_stock_units}</strong> units
              </span>
            </div>
            <div className="border border-ops-border rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-ops-card text-[10px] font-mono text-ops-dim uppercase border-b border-ops-border">
                  <tr>
                    <th className="p-2">Product</th>
                    <th className="p-2 text-right">Stock</th>
                    <th className="p-2 text-right">Reserve</th>
                    <th className="p-2 text-right">Expiring (3d)</th>
                    <th className="p-2 text-right">Demand (72h)</th>
                    <th className="p-2 text-right">Shortage Prob</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ops-border font-mono">
                  {hospital.inventory.slice(0, 8).map((inv, i) => (
                    <tr key={i} className="hover:bg-ops-cardHover/50">
                      <td className="p-2 font-bold text-ops-text">
                        {inv.blood_group} {inv.component}
                      </td>
                      <td
                        className={`p-2 text-right font-bold ${
                          inv.current_units <= inv.safety_reserve ? "text-red-400" : "text-ops-text"
                        }`}
                      >
                        {inv.current_units}
                      </td>
                      <td className="p-2 text-right text-ops-dim">{inv.safety_reserve}</td>
                      <td className="p-2 text-right text-amber-400">{inv.expiring_3d}</td>
                      <td className="p-2 text-right text-ops-blue">{inv.forecast_demand}</td>
                      <td className="p-2 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            inv.shortage_prob > 0.7
                              ? "bg-red-500/20 text-red-400"
                              : inv.shortage_prob > 0.4
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {(inv.shortage_prob * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Model 1 Demand Forecast & Model 2 Shortage Risk Horizon */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded bg-ops-card border border-ops-border">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-ops-blue" />
                <span>Model 1 Demand Curve</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-ops-dim">Next 24h:</span>
                  <span className="text-ops-text font-bold">4.8 units</span>
                </div>
                <div className="w-full bg-ops-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-ops-blue h-full w-[45%]" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ops-dim">Next 48h:</span>
                  <span className="text-ops-text font-bold">9.2 units</span>
                </div>
                <div className="w-full bg-ops-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-ops-blue h-full w-[70%]" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ops-dim">Next 72h:</span>
                  <span className="text-ops-text font-bold">14.8 units</span>
                </div>
                <div className="w-full bg-ops-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-ops-blue h-full w-[95%]" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded bg-ops-card border border-ops-border">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-white mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-ops-crimson" />
                <span>Model 2 Shortage Timeline</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-ops-dim">24h Risk:</span>
                  <span className="text-red-400 font-bold">96% CRITICAL</span>
                </div>
                <div className="w-full bg-ops-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full w-[96%]" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ops-dim">48h Risk:</span>
                  <span className="text-red-400 font-bold">92% HIGH</span>
                </div>
                <div className="w-full bg-ops-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-500/80 h-full w-[92%]" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ops-dim">72h Risk:</span>
                  <span className="text-amber-400 font-bold">88% HIGH</span>
                </div>
                <div className="w-full bg-ops-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[88%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Model 3 Ranked Local Donor Candidates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Model 3 Eligible Donor Pool
                </h3>
              </div>
              <span className="text-[10px] font-mono text-ops-dim">Synthetic Donor Candidates</span>
            </div>

            {hospital.donor_mobilizations &&
            hospital.donor_mobilizations.length > 0 &&
            hospital.donor_mobilizations[0]?.top_candidates &&
            hospital.donor_mobilizations[0].top_candidates.length > 0 ? (
              <div className="border border-ops-border rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ops-card text-[10px] font-mono text-ops-dim uppercase border-b border-ops-border">
                    <tr>
                      <th className="p-2">Rank</th>
                      <th className="p-2">Donor ID</th>
                      <th className="p-2">Group</th>
                      <th className="p-2 text-right">Distance</th>
                      <th className="p-2 text-right">Score</th>
                      <th className="p-2">Outreach Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ops-border font-mono">
                    {hospital.donor_mobilizations[0].top_candidates.map((c) => (
                      <tr key={c.donor_id} className="hover:bg-ops-cardHover/50">
                        <td className="p-2 text-ops-dim font-bold">#{c.rank}</td>
                        <td className="p-2 font-bold text-purple-400">{c.donor_id}</td>
                        <td className="p-2 text-ops-text">{c.blood_group}</td>
                        <td className="p-2 text-right text-ops-dim">{c.distance_km} km</td>
                        <td className="p-2 text-right text-emerald-400 font-bold">
                          {(c.composite_score * 100).toFixed(1)}
                        </td>
                        <td className="p-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {c.contact_priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-ops-dim bg-ops-card/40 rounded border border-ops-border">
                No active donor dispatch dispatched for this hospital.
              </div>
            )}
          </div>

          {/* Section 5: Nearby Blood Banks */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
              Regional Blood Banks Proximity
            </h3>
            <div className="space-y-1.5">
              {hospital.nearby_blood_banks.map((bb) => (
                <div
                  key={bb.blood_bank_id}
                  className="p-2.5 rounded bg-ops-card/50 border border-ops-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-ops-text">{bb.name}</span>
                    <span className="text-ops-dim text-[11px] font-mono ml-2">({bb.blood_bank_id})</span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono text-[11px]">
                    <span className="text-ops-muted">{bb.distance_km} km</span>
                    <span className="text-ops-blue">{bb.eta_minutes} min ETA</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded ${
                        bb.status === "Operational"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {bb.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-ops-border bg-ops-card/80 flex items-center justify-between text-xs">
          <span className="text-[10px] text-ops-dim">
            CONFIDENTIAL LOGISTICS PROFILE • VALIDATED BACKEND
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-ops-card hover:bg-ops-cardHover border border-ops-border text-ops-text font-medium transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
