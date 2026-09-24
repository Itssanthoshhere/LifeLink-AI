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
  ArrowRight,
  ShieldCheck
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white border-l border-gray-200/90 h-full shadow-2xl flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-200/80 bg-white/90 flex items-start justify-between sticky top-0 z-10 backdrop-blur-md">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight font-sans">
                  {hospital.name}
                </h2>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                  <span className="font-mono text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                    {hospital.hospital_id}
                  </span>
                  <span>•</span>
                  <span>{hospital.type}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2.5">
              <span>Beds: <strong className="text-gray-900">{hospital.bed_capacity}</strong></span>
              <span>•</span>
              <span>ICU: <strong className="text-gray-900">{hospital.icu_capacity}</strong></span>
              <span>•</span>
              <span>Storage: <strong className="text-gray-900">{hospital.storage_capacity} units</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isCritical
                  ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                  : isHigh
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {hospital.overall_risk_status} RISK
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6">
          {/* Section 1: AI Recommended Action Banner */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-crimson-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-crimson-700" />
                ENGINE 4 RECOMMENDED ACTION
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
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
              <div className="text-xs text-gray-700 leading-relaxed mt-1">
                Inter-facility transshipment from{" "}
                <span className="font-bold text-gray-900">
                  {hospital.incoming_transfers[0].source_name} ({hospital.incoming_transfers[0].source})
                </span>{" "}
                scheduled:{" "}
                <span className="font-bold text-crimson-700">
                  {hospital.incoming_transfers[0].units} units{" "}
                  {hospital.incoming_transfers[0].recipient_blood_group}{" "}
                  {hospital.incoming_transfers[0].component}
                </span>{" "}
                via {hospital.incoming_transfers[0].route_id} (ETA:{" "}
                {hospital.incoming_transfers[0].travel_time_minutes} min,{" "}
                {hospital.incoming_transfers[0].distance_km} km).
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-1">
                No active inventory transshipment required. On-site stock currently exceeds safety reserve thresholds.
              </div>
            )}
          </div>

          {/* Section 2: Current Inventory Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Current Inventory vs Safety Reserve
              </h3>
              <span className="text-xs text-gray-500">
                Total: <strong className="text-gray-900">{hospital.total_stock_units}</strong> units
              </span>
            </div>
            <div className="border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-right">Stock</th>
                    <th className="p-2.5 text-right">Reserve</th>
                    <th className="p-2.5 text-right">Expiring (3d)</th>
                    <th className="p-2.5 text-right">Demand (72h)</th>
                    <th className="p-2.5 text-right">Shortage Prob</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hospital.inventory.slice(0, 8).map((inv, i) => (
                    <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-2.5 font-bold text-gray-800">
                        {inv.blood_group} {inv.component}
                      </td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          inv.current_units <= inv.safety_reserve ? "text-rose-600" : "text-gray-900"
                        }`}
                      >
                        {inv.current_units}
                      </td>
                      <td className="p-2.5 text-right text-gray-500">{inv.safety_reserve}</td>
                      <td className="p-2.5 text-right text-amber-600 font-medium">{inv.expiring_3d}</td>
                      <td className="p-2.5 text-right text-blue-700 font-medium">{inv.forecast_demand}</td>
                      <td className="p-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.shortage_prob > 0.7
                              ? "bg-rose-100 text-rose-800"
                              : inv.shortage_prob > 0.4
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
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
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900 mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Model 1 Demand Curve</span>
              </div>
              <div className="space-y-2.5 text-xs font-sans">
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-gray-500">Next 24h:</span>
                    <span className="text-gray-900 font-bold">4.8 units</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-[45%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-gray-500">Next 48h:</span>
                    <span className="text-gray-900 font-bold">9.2 units</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-[70%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-gray-500">Next 72h:</span>
                    <span className="text-gray-900 font-bold">14.8 units</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-[95%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-crimson-600" />
                <span>Model 2 Shortage Risk</span>
              </div>
              <div className="space-y-2.5 text-xs font-sans">
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-gray-500">24h Risk:</span>
                    <span className="text-crimson-700 font-bold">96% CRITICAL</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-crimson-600 h-full w-[96%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-gray-500">48h Risk:</span>
                    <span className="text-crimson-700 font-bold">92% HIGH</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-crimson-600/80 h-full w-[92%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-gray-500">72h Risk:</span>
                    <span className="text-amber-700 font-bold">88% HIGH</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[88%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Model 3 Ranked Local Donor Candidates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Model 3 Eligible Donor Pool
                </h3>
              </div>
              <span className="text-[10px] text-gray-400">Targeted candidate mobilization</span>
            </div>

            {hospital.donor_mobilizations &&
            hospital.donor_mobilizations.length > 0 &&
            hospital.donor_mobilizations[0]?.top_candidates &&
            hospital.donor_mobilizations[0].top_candidates.length > 0 ? (
              <div className="border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
                    <tr>
                      <th className="p-2.5">Rank</th>
                      <th className="p-2.5">Donor ID</th>
                      <th className="p-2.5">Group</th>
                      <th className="p-2.5 text-right">Distance</th>
                      <th className="p-2.5 text-right">Score</th>
                      <th className="p-2.5">Outreach Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {hospital.donor_mobilizations[0].top_candidates.map((c) => (
                      <tr key={c.donor_id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-2.5 text-gray-400 font-bold">#{c.rank}</td>
                        <td className="p-2.5 font-bold text-purple-700">{c.donor_id}</td>
                        <td className="p-2.5 text-gray-800 font-medium">{c.blood_group}</td>
                        <td className="p-2.5 text-right text-gray-500">{c.distance_km} km</td>
                        <td className="p-2.5 text-right text-emerald-700 font-bold">
                          {(c.composite_score * 100).toFixed(1)}
                        </td>
                        <td className="p-2.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {c.contact_priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-gray-500 bg-gray-50/70 rounded-2xl border border-gray-200">
                No active donor dispatch dispatched for this hospital.
              </div>
            )}
          </div>

          {/* Section 5: Nearby Blood Banks */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
              Regional Blood Banks Proximity
            </h3>
            <div className="space-y-2">
              {hospital.nearby_blood_banks.map((bb) => (
                <div
                  key={bb.blood_bank_id}
                  className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/80 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-gray-900">{bb.name}</span>
                    <span className="text-gray-400 text-[11px] font-mono ml-2">({bb.blood_bank_id})</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-gray-500">{bb.distance_km} km</span>
                    <span className="text-blue-700 font-semibold">{bb.eta_minutes} min ETA</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        bb.status === "Operational"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
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
        <div className="p-4 border-t border-gray-200/80 bg-gray-50/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-gray-400">
            Validated Medical Logistics Profile
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold transition shadow-2xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
