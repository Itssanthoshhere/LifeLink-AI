"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, Filter, Search, ArrowUpDown, Building2 } from "lucide-react";
import { ShortageAlert, RiskLevel, BloodGroup, BloodComponent } from "@/types/commandCenter";

interface ShortagesViewProps {
  alerts: ShortageAlert[];
  onSelectHospital: (hospitalId: string) => void;
}

export const ShortagesView: React.FC<ShortagesViewProps> = ({ alerts, onSelectHospital }) => {
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [selectedComponent, setSelectedComponent] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"risk" | "stock" | "demand" | "hospital">("risk");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => {
        if (selectedRisk !== "ALL" && a.risk_level !== selectedRisk) return false;
        if (selectedGroup !== "ALL" && a.blood_group !== selectedGroup) return false;
        if (selectedComponent !== "ALL" && a.component !== selectedComponent) return false;
        if (
          searchQuery &&
          !a.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !a.hospital_id.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === "risk") cmp = a.shortage_probability - b.shortage_probability;
        else if (sortBy === "stock") cmp = a.current_stock_units - b.current_stock_units;
        else if (sortBy === "demand") cmp = a.forecast_demand_units - b.forecast_demand_units;
        else if (sortBy === "hospital") cmp = a.hospital_name.localeCompare(b.hospital_name);
        return sortAsc ? cmp : -cmp;
      });
  }, [alerts, selectedRisk, selectedGroup, selectedComponent, searchQuery, sortBy, sortAsc]);

  const toggleSort = (col: "risk" | "stock" | "demand" | "hospital") => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Shortage Early Warning Monitor</h2>
        <p className="text-xs text-ops-dim">
          Model 2 probabilistic shortage signals across all hospital nodes and blood product categories
        </p>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-ops-card p-3 rounded border border-ops-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-sm bg-ops-panel px-2.5 py-1.5 rounded border border-ops-border text-xs">
          <Search className="w-3.5 h-3.5 text-ops-dim" />
          <input
            type="text"
            placeholder="Filter by hospital name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-ops-text text-xs focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-ops-dim text-[11px] font-mono">Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-ops-panel border border-ops-border text-ops-text px-2 py-1 rounded text-xs focus:outline-none font-mono"
            >
              <option value="ALL">ALL TIERS</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-ops-dim text-[11px] font-mono">Group:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-ops-panel border border-ops-border text-ops-text px-2 py-1 rounded text-xs focus:outline-none font-mono"
            >
              <option value="ALL">ALL GROUPS</option>
              <option value="O_NEG">O_NEG</option>
              <option value="O_POS">O_POS</option>
              <option value="A_NEG">A_NEG</option>
              <option value="A_POS">A_POS</option>
              <option value="B_NEG">B_NEG</option>
              <option value="B_POS">B_POS</option>
              <option value="AB_NEG">AB_NEG</option>
              <option value="AB_POS">AB_POS</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-ops-dim text-[11px] font-mono">Component:</span>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="bg-ops-panel border border-ops-border text-ops-text px-2 py-1 rounded text-xs focus:outline-none font-mono"
            >
              <option value="ALL">ALL COMPONENTS</option>
              <option value="RBC">RBC</option>
              <option value="Platelets">Platelets</option>
              <option value="Plasma">Plasma</option>
              <option value="Whole_Blood">Whole Blood</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] font-mono text-ops-dim">
          Showing <strong className="text-white">{filteredAlerts.length}</strong> alerts
        </div>
      </div>

      {/* Shortage Alerts Table */}
      <div className="bg-ops-card border border-ops-border rounded overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-ops-panel text-[10px] font-mono text-ops-dim uppercase border-b border-ops-border">
            <tr>
              <th
                onClick={() => toggleSort("hospital")}
                className="p-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Hospital</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3">Product</th>
              <th
                onClick={() => toggleSort("risk")}
                className="p-3 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Shortage Prob (24h)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3 text-right">48h Risk</th>
              <th className="p-3 text-right">72h Risk</th>
              <th
                onClick={() => toggleSort("stock")}
                className="p-3 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Current Stock</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("demand")}
                className="p-3 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Forecast Demand</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3 text-center">Risk Tier</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-border font-mono">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, idx) => {
                const isCrit = alert.risk_level === "CRITICAL";
                return (
                  <tr
                    key={idx}
                    onClick={() => onSelectHospital(alert.hospital_id)}
                    className="hover:bg-ops-cardHover/70 cursor-pointer transition"
                  >
                    <td className="p-3 font-sans font-bold text-white">
                      <div>{alert.hospital_name}</div>
                      <div className="text-[10px] font-mono text-ops-dim">{alert.hospital_id}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-ops-cyan">{alert.blood_group}</span>{" "}
                      <span className="text-ops-muted">{alert.component}</span>
                    </td>
                    <td className="p-3 text-right font-bold">
                      <span
                        className={`${
                          isCrit
                            ? "text-red-400"
                            : alert.shortage_probability > 0.6
                            ? "text-amber-400"
                            : "text-ops-text"
                        }`}
                      >
                        {(alert.shortage_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right text-ops-muted">
                      {(Math.min(0.99, alert.shortage_probability * 0.95) * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 text-right text-ops-muted">
                      {(Math.min(0.99, alert.shortage_probability * 0.91) * 100).toFixed(0)}%
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        alert.current_stock_units < 3 ? "text-red-400" : "text-ops-text"
                      }`}
                    >
                      {alert.current_stock_units.toFixed(1)}
                    </td>
                    <td className="p-3 text-right text-ops-blue">
                      {alert.forecast_demand_units.toFixed(1)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCrit
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                            : alert.risk_level === "HIGH"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {alert.risk_level}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectHospital(alert.hospital_id);
                        }}
                        className="px-2.5 py-1 rounded bg-ops-panel hover:bg-ops-border text-[10px] text-ops-cyan border border-ops-border transition"
                      >
                        Intelligence &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="p-6 text-center text-ops-dim font-sans">
                  No shortage alerts match the active filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
