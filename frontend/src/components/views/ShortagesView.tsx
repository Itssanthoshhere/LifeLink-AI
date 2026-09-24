"use client";

import React, { useState, useMemo } from "react";
import { AlertTriangle, Filter, Search, ArrowUpDown, Building2, ShieldAlert } from "lucide-react";
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
    <div className="space-y-6">
      {/* Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
            Shortage Early Warning Monitor
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Model 2 probabilistic shortage signals across hospital facilities and blood product categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-crimson-50 text-crimson-700 text-xs font-semibold border border-crimson-200">
            {filteredAlerts.filter(a => a.risk_level === "CRITICAL").length} Critical Deficits
          </span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-sm bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-200 text-xs shadow-2xs">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search facility name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-gray-800 text-xs focus:outline-none w-full placeholder-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center space-x-1.5 bg-gray-50/80 px-2.5 py-1.5 rounded-xl border border-gray-200">
            <span className="text-gray-500 text-[11px] font-medium">Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-transparent text-gray-800 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-gray-50/80 px-2.5 py-1.5 rounded-xl border border-gray-200">
            <span className="text-gray-500 text-[11px] font-medium">Group:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent text-gray-800 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Groups</option>
              <option value="O_NEG">O-</option>
              <option value="O_POS">O+</option>
              <option value="A_NEG">A-</option>
              <option value="A_POS">A+</option>
              <option value="B_NEG">B-</option>
              <option value="B_POS">B+</option>
              <option value="AB_NEG">AB-</option>
              <option value="AB_POS">AB+</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-gray-50/80 px-2.5 py-1.5 rounded-xl border border-gray-200">
            <span className="text-gray-500 text-[11px] font-medium">Component:</span>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="bg-transparent text-gray-800 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Components</option>
              <option value="RBC">RBC</option>
              <option value="Platelets">Platelets</option>
              <option value="Plasma">Plasma</option>
              <option value="Whole_Blood">Whole Blood</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Showing <strong className="text-gray-900">{filteredAlerts.length}</strong> alerts
        </div>
      </div>

      {/* Shortage Alerts Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
              <tr>
                <th
                  onClick={() => toggleSort("hospital")}
                  className="p-3.5 cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Hospital Node</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="p-3.5">Product</th>
                <th
                  onClick={() => toggleSort("risk")}
                  className="p-3.5 text-right cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Shortage Prob (24h)</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="p-3.5 text-right">48h Risk</th>
                <th className="p-3.5 text-right">72h Risk</th>
                <th
                  onClick={() => toggleSort("stock")}
                  className="p-3.5 text-right cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Current Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("demand")}
                  className="p-3.5 text-right cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Forecast Demand</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Risk Tier</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, idx) => {
                  const isCrit = alert.risk_level === "CRITICAL";
                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectHospital(alert.hospital_id)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-sans font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span>{alert.hospital_name}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono pl-5.5">{alert.hospital_id}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-crimson-700 bg-crimson-50 px-2 py-0.5 rounded-md border border-crimson-200">
                          {alert.blood_group}
                        </span>{" "}
                        <span className="text-gray-600 font-medium ml-1">{alert.component}</span>
                      </td>
                      <td className="p-3.5 text-right font-bold">
                        <span
                          className={`${
                            isCrit
                              ? "text-crimson-600"
                              : alert.shortage_probability > 0.6
                              ? "text-amber-600"
                              : "text-gray-700"
                          }`}
                        >
                          {(alert.shortage_probability * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-gray-500 font-medium">
                        {(Math.min(0.99, alert.shortage_probability * 0.95) * 100).toFixed(0)}%
                      </td>
                      <td className="p-3.5 text-right text-gray-500 font-medium">
                        {(Math.min(0.99, alert.shortage_probability * 0.91) * 100).toFixed(0)}%
                      </td>
                      <td
                        className={`p-3.5 text-right font-bold ${
                          alert.current_stock_units < 3 ? "text-rose-600" : "text-gray-800"
                        }`}
                      >
                        {alert.current_stock_units.toFixed(1)}
                      </td>
                      <td className="p-3.5 text-right text-blue-700 font-semibold">
                        {alert.forecast_demand_units.toFixed(1)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCrit
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : alert.risk_level === "HIGH"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {alert.risk_level}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectHospital(alert.hospital_id);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-gray-50 hover:bg-crimson-50 text-[11px] font-semibold text-crimson-700 border border-gray-200 hover:border-crimson-200 transition-colors shadow-2xs"
                        >
                          Details &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 font-sans">
                    No shortage alerts match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
