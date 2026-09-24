"use client";

import React, { useState } from "react";
import { Share2, AlertOctagon, CheckCircle2, Search, ArrowRight, Route, Navigation } from "lucide-react";
import { NetworkPayload } from "@/types/commandCenter";

interface NetworkViewProps {
  network: NetworkPayload;
}

export const NetworkView: React.FC<NetworkViewProps> = ({ network }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filteredRoutes = network.routes.filter((r) => {
    if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
    if (
      search &&
      !r.route_id.toLowerCase().includes(search.toLowerCase()) &&
      !r.source_id.toLowerCase().includes(search.toLowerCase()) &&
      !r.destination_id.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
            Logistics Network Topology
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            40-node distribution graph with 646 transit corridors, capacity constraints, and active disruption monitoring
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            {network.metrics.active_routes} Active Corridors
          </span>
        </div>
      </div>

      {/* Network Metrics KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 font-sans">
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total Corridors</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{network.metrics.total_routes}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Mapped bidirectional arcs</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
          <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Active Corridors</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{network.metrics.active_routes}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Nominal transit latency</div>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-xs">
          <div className="text-[11px] text-rose-700 font-bold uppercase tracking-wider">Disrupted Corridors</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">{network.metrics.disrupted_routes}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Automatic solver rerouting</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Average Distance</div>
          <div className="text-2xl font-extrabold text-cyan-700 mt-1">{network.metrics.avg_distance_km} km</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Corridor length</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Average ETA</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">{network.metrics.avg_travel_time_min} min</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Traffic-factored transit</div>
        </div>
      </div>

      {/* Corridor Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-gray-50/80 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-900 font-sans">
              Transport Corridors & Rerouting Status
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search route or node ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-gray-800 text-xs focus:outline-none w-48"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 px-3 py-1.5 rounded-xl text-xs focus:outline-none font-medium shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Disrupted">Disrupted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
              <tr>
                <th className="p-3.5">Route ID</th>
                <th className="p-3.5">Origin Node</th>
                <th className="p-3.5">Destination Node</th>
                <th className="p-3.5 text-right">Distance (km)</th>
                <th className="p-3.5 text-right">Travel Time (min)</th>
                <th className="p-3.5 text-right">Capacity (units)</th>
                <th className="p-3.5 text-center">Corridor Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRoutes.slice(0, 30).map((r) => {
                const isDisrupted = r.status !== "Active";
                return (
                  <tr
                    key={r.route_id}
                    className={`hover:bg-gray-50/70 transition-colors ${
                      isDisrupted ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="p-3.5 font-bold text-gray-900 font-mono">{r.route_id}</td>
                    <td className="p-3.5 font-semibold text-blue-700">{r.source_id}</td>
                    <td className="p-3.5 font-semibold text-crimson-700">{r.destination_id}</td>
                    <td className="p-3.5 text-right text-gray-700">{r.distance_km}</td>
                    <td className="p-3.5 text-right text-gray-500">{r.travel_time_minutes}</td>
                    <td className="p-3.5 text-right text-emerald-700 font-bold">{r.transport_capacity}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isDisrupted
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
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
