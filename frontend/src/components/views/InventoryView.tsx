"use client";

import React, { useState } from "react";
import { Package, Clock, ShieldAlert, BarChart2, CheckCircle2, Droplet, ArrowRight } from "lucide-react";
import { InventoryPayload } from "@/types/commandCenter";

interface InventoryViewProps {
  inventory: InventoryPayload;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory }) => {
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredFacilities = inventory.facilities.filter((f) => {
    if (filterType === "ALL") return true;
    return f.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
            Inventory & Expiry Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Multi-echelon stock levels, safety reserve compliance, and FEFO expiry runway monitoring
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            {inventory.summary.usable_excess} Units Usable Excess
          </span>
        </div>
      </div>

      {/* 8 Product & Expiry KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 font-sans">
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Stock</div>
          <div className="text-xl font-extrabold text-gray-900 mt-1">{inventory.summary.total_units}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Network-wide</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">RBC Units</div>
          <div className="text-xl font-extrabold text-blue-600 mt-1">{inventory.by_component.RBC}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">42d shelf life</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Platelets</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1">{inventory.by_component.Platelets}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">5d shelf life</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider">Plasma</div>
          <div className="text-xl font-extrabold text-cyan-600 mt-1">{inventory.by_component.Plasma}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Frozen reserve</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Whole Blood</div>
          <div className="text-xl font-extrabold text-purple-600 mt-1">{inventory.by_component.Whole_Blood}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">35d shelf life</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-2xs">
          <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Expiring &lt;24h</div>
          <div className="text-xl font-extrabold text-rose-600 mt-1">{inventory.summary.expiring_1d}</div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">Urgent FEFO</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
          <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Expiring &lt;3d</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1">{inventory.summary.expiring_3d}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">FEFO priority</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Expiring &lt;5d</div>
          <div className="text-xl font-extrabold text-gray-700 mt-1">{inventory.summary.expiring_5d}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Runway monitor</div>
        </div>
      </div>

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blood Group Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 font-sans">
              Inventory by Blood Group
            </h3>
            <span className="text-xs text-gray-500">Distribution across 8 major groups</span>
          </div>
          <div className="space-y-3 font-sans text-xs">
            {Object.entries(inventory.by_blood_group).map(([group, count]) => {
              const pct = (count / inventory.summary.total_units) * 100;
              const isOneg = group === "O_NEG";
              return (
                <div key={group} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-semibold ${isOneg ? "text-crimson-700 font-bold" : "text-gray-700"}`}>
                      {group} {isOneg && "(Universal Donor)"}
                    </span>
                    <span className="text-gray-500 font-medium">
                      {count} units ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOneg ? "bg-crimson-600" : "bg-blue-600"
                      }`}
                      style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Component & Expiry Exposure Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans mb-3">
              Inventory by Component
            </h3>
            <div className="grid grid-cols-2 gap-3 font-sans text-xs">
              {Object.entries(inventory.by_component).map(([comp, count]) => (
                <div key={comp} className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/70 shadow-2xs">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{comp}</div>
                  <div className="text-lg font-extrabold text-gray-900 mt-1">{count} units</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans mb-3">
              FEFO Expiry Risk Exposure
            </h3>
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/70 font-sans text-xs space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Usable Excess Inventory:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {inventory.summary.usable_excess} units
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Mandatory Safety Reserves:</span>
                <span className="text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                  {inventory.summary.total_safety_reserve} units
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Near-Term Expiry Waste Exposure:</span>
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {inventory.summary.expiring_3d} units
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facility Inventory Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-gray-50/80 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-900 font-sans">
              Facility Stock Audit
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-500 font-medium">Filter Type:</span>
            <div className="flex items-center bg-white rounded-xl border border-gray-200 p-0.5 shadow-2xs">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterType === "ALL" ? "bg-crimson-50 text-crimson-700 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("Hospital")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterType === "Hospital" ? "bg-crimson-50 text-crimson-700 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Hospitals
              </button>
              <button
                onClick={() => setFilterType("Blood_Bank")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterType === "Blood_Bank" ? "bg-crimson-50 text-crimson-700 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Blood Banks
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
              <tr>
                <th className="p-3.5">Facility</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5 text-right">Available Units</th>
                <th className="p-3.5 text-right">Safety Reserve</th>
                <th className="p-3.5 text-right">Expiring &lt;3d</th>
                <th className="p-3.5 text-right">Usable Excess</th>
                <th className="p-3.5 text-right">Capacity</th>
                <th className="p-3.5 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFacilities.map((f) => {
                const isLow = f.total_units <= f.safety_reserve;
                return (
                  <tr key={f.facility_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-gray-900">
                      <div>{f.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{f.facility_id}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          f.type === "Blood_Bank"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {f.type === "Blood_Bank" ? "Blood Bank" : "Hospital"}
                      </span>
                    </td>
                    <td className={`p-3.5 text-right font-bold ${isLow ? "text-crimson-600" : "text-gray-800"}`}>
                      {f.total_units}
                    </td>
                    <td className="p-3.5 text-right text-gray-500">{f.safety_reserve}</td>
                    <td className="p-3.5 text-right text-amber-600 font-medium">{f.expiring_3d}</td>
                    <td className="p-3.5 text-right text-emerald-700 font-bold">{f.usable_excess}</td>
                    <td className="p-3.5 text-right text-gray-500">{f.capacity}</td>
                    <td className="p-3.5 text-right text-blue-700 font-semibold">{f.utilization_pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
