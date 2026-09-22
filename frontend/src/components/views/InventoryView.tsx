"use client";

import React, { useState } from "react";
import { Package, Clock, ShieldAlert, BarChart2, CheckCircle2 } from "lucide-react";
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
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Inventory & Expiry Management</h2>
        <p className="text-xs text-ops-dim">
          Multi-echelon stock levels, safety reserve compliance, and FEFO expiry runway monitoring
        </p>
      </div>

      {/* 8 Product & Expiry KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 font-mono">
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Total Stock</div>
          <div className="text-lg font-bold text-white">{inventory.summary.total_units}</div>
          <div className="text-[9px] text-ops-dim">Units network-wide</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">RBC Units</div>
          <div className="text-lg font-bold text-ops-cyan">{inventory.by_component.RBC}</div>
          <div className="text-[9px] text-ops-dim">42d shelf life</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Platelets</div>
          <div className="text-lg font-bold text-amber-400">{inventory.by_component.Platelets}</div>
          <div className="text-[9px] text-ops-dim">5d shelf life</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Plasma</div>
          <div className="text-lg font-bold text-blue-400">{inventory.by_component.Plasma}</div>
          <div className="text-[9px] text-ops-dim">Frozen reserves</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Whole Blood</div>
          <div className="text-lg font-bold text-purple-400">{inventory.by_component.Whole_Blood}</div>
          <div className="text-[9px] text-ops-dim">35d shelf life</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-red-500/30 bg-red-950/20">
          <div className="text-[10px] text-red-400 uppercase font-bold">Expiring &lt;24h</div>
          <div className="text-lg font-bold text-red-400">{inventory.summary.expiring_1d}</div>
          <div className="text-[9px] text-red-300">Urgent FEFO</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-amber-500/30 bg-amber-950/20">
          <div className="text-[10px] text-amber-400 uppercase font-bold">Expiring &lt;3d</div>
          <div className="text-lg font-bold text-amber-400">{inventory.summary.expiring_3d}</div>
          <div className="text-[9px] text-amber-300">FEFO priority</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Expiring &lt;5d</div>
          <div className="text-lg font-bold text-ops-text">{inventory.summary.expiring_5d}</div>
          <div className="text-[9px] text-ops-dim">Runway monitor</div>
        </div>
      </div>

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blood Group Breakdown */}
        <div className="bg-ops-card p-4 rounded border border-ops-border">
          <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider mb-3">
            Inventory by Blood Group
          </h3>
          <div className="space-y-2 font-mono text-xs">
            {Object.entries(inventory.by_blood_group).map(([group, count]) => {
              const pct = (count / inventory.summary.total_units) * 100;
              const isOneg = group === "O_NEG";
              return (
                <div key={group} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={`font-bold ${isOneg ? "text-red-400" : "text-ops-text"}`}>
                      {group} {isOneg && "(Universal Donor)"}
                    </span>
                    <span className="text-ops-dim">
                      {count} units ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-ops-panel h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isOneg ? "bg-red-500" : "bg-ops-blue"}`}
                      style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Component & Expiry Exposure Breakdown */}
        <div className="bg-ops-card p-4 rounded border border-ops-border space-y-4">
          <div>
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider mb-3">
              Inventory by Component
            </h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {Object.entries(inventory.by_component).map(([comp, count]) => (
                <div key={comp} className="p-2.5 rounded bg-ops-panel border border-ops-border">
                  <div className="text-[10px] text-ops-dim uppercase">{comp}</div>
                  <div className="text-base font-bold text-white mt-0.5">{count} units</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider mb-2">
              FEFO Expiry Risk Exposure
            </h3>
            <div className="p-3 rounded bg-ops-panel border border-ops-border font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-ops-muted">Usable Excess Inventory:</span>
                <span className="text-emerald-400 font-bold">{inventory.summary.usable_excess} units</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-ops-muted">Mandatory Safety Reserves:</span>
                <span className="text-ops-cyan font-bold">{inventory.summary.total_safety_reserve} units</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-ops-muted">Near-Term Expiry Waste Exposure:</span>
                <span className="text-amber-400 font-bold">{inventory.summary.expiring_3d} units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facility Inventory Table */}
      <div className="bg-ops-card border border-ops-border rounded overflow-hidden">
        <div className="p-3 bg-ops-panel border-b border-ops-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Facility Stock Audit
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-ops-dim text-[11px]">Filter:</span>
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-2 py-0.5 rounded text-[10px] ${
                filterType === "ALL" ? "bg-ops-blue text-white font-bold" : "text-ops-dim hover:text-white"
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilterType("Hospital")}
              className={`px-2 py-0.5 rounded text-[10px] ${
                filterType === "Hospital" ? "bg-ops-blue text-white font-bold" : "text-ops-dim hover:text-white"
              }`}
            >
              HOSPITALS
            </button>
            <button
              onClick={() => setFilterType("Blood_Bank")}
              className={`px-2 py-0.5 rounded text-[10px] ${
                filterType === "Blood_Bank" ? "bg-ops-blue text-white font-bold" : "text-ops-dim hover:text-white"
              }`}
            >
              BLOOD BANKS
            </button>
          </div>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-ops-card text-[10px] text-ops-dim uppercase border-b border-ops-border">
            <tr>
              <th className="p-3">Facility</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Available Units</th>
              <th className="p-3 text-right">Safety Reserve</th>
              <th className="p-3 text-right">Expiring &lt;3d</th>
              <th className="p-3 text-right">Usable Excess</th>
              <th className="p-3 text-right">Capacity</th>
              <th className="p-3 text-right">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-border">
            {filteredFacilities.map((f) => {
              const isLow = f.total_units <= f.safety_reserve;
              return (
                <tr key={f.facility_id} className="hover:bg-ops-cardHover/60 transition">
                  <td className="p-3 font-sans font-bold text-white">
                    <div>{f.name}</div>
                    <div className="text-[10px] font-mono text-ops-dim">{f.facility_id}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] ${
                        f.type === "Blood_Bank"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-purple-500/20 text-purple-300"
                      }`}
                    >
                      {f.type}
                    </span>
                  </td>
                  <td className={`p-3 text-right font-bold ${isLow ? "text-red-400" : "text-ops-text"}`}>
                    {f.total_units}
                  </td>
                  <td className="p-3 text-right text-ops-dim">{f.safety_reserve}</td>
                  <td className="p-3 text-right text-amber-400">{f.expiring_3d}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">{f.usable_excess}</td>
                  <td className="p-3 text-right text-ops-dim">{f.capacity}</td>
                  <td className="p-3 text-right text-ops-blue">{f.utilization_pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
