"use client";

import React, { useState } from "react";
import { Share2, AlertOctagon, CheckCircle2, Search, ArrowRight } from "lucide-react";
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
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Logistics Network Topology</h2>
        <p className="text-xs text-ops-dim">
          40-node distribution graph with 646 transit corridors, capacity constraints, and active disruption monitoring
        </p>
      </div>

      {/* Network Metrics KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Total Corridors</div>
          <div className="text-xl font-bold text-white">{network.metrics.total_routes}</div>
          <div className="text-[10px] text-ops-dim">Mapped bidirectional arcs</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-emerald-500/30 bg-emerald-950/20">
          <div className="text-[10px] text-emerald-400 uppercase font-bold">Active Corridors</div>
          <div className="text-xl font-bold text-emerald-400">{network.metrics.active_routes}</div>
          <div className="text-[10px] text-emerald-300">Nominal transit latency</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-red-500/30 bg-red-950/20">
          <div className="text-[10px] text-red-400 uppercase font-bold">Disrupted Corridors</div>
          <div className="text-xl font-bold text-red-400">{network.metrics.disrupted_routes}</div>
          <div className="text-[10px] text-red-300">Automatic solver reroute</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Average Distance</div>
          <div className="text-xl font-bold text-ops-cyan">{network.metrics.avg_distance_km} km</div>
          <div className="text-[10px] text-ops-dim">Haversine corridor length</div>
        </div>
        <div className="p-3 rounded bg-ops-card border border-ops-border">
          <div className="text-[10px] text-ops-dim uppercase">Average ETA</div>
          <div className="text-xl font-bold text-ops-blue">{network.metrics.avg_travel_time_min} min</div>
          <div className="text-[10px] text-ops-dim">Traffic-factored transit</div>
        </div>
      </div>

      {/* Corridor Table */}
      <div className="bg-ops-card border border-ops-border rounded overflow-hidden">
        <div className="p-3 bg-ops-panel border-b border-ops-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Transport Corridors & Rerouting Status
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1.5 bg-ops-card px-2.5 py-1 rounded border border-ops-border">
              <Search className="w-3 h-3 text-ops-dim" />
              <input
                type="text"
                placeholder="Search route or node ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-ops-text text-xs focus:outline-none font-mono"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-ops-card border border-ops-border text-ops-text px-2 py-1 rounded text-xs focus:outline-none font-mono"
            >
              <option value="ALL">ALL STATUS</option>
              <option value="Active">ACTIVE</option>
              <option value="Disrupted">DISRUPTED</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-ops-card text-[10px] text-ops-dim uppercase border-b border-ops-border">
            <tr>
              <th className="p-3">Route ID</th>
              <th className="p-3">Origin Node</th>
              <th className="p-3">Destination Node</th>
              <th className="p-3 text-right">Distance (km)</th>
              <th className="p-3 text-right">Travel Time (min)</th>
              <th className="p-3 text-right">Capacity (units)</th>
              <th className="p-3 text-center">Corridor Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-border">
            {filteredRoutes.slice(0, 25).map((r) => {
              const isDisrupted = r.status !== "Active";
              return (
                <tr
                  key={r.route_id}
                  className={`hover:bg-ops-cardHover/60 transition ${
                    isDisrupted ? "bg-red-950/20" : ""
                  }`}
                >
                  <td className="p-3 font-bold text-white">{r.route_id}</td>
                  <td className="p-3 text-ops-cyan">{r.source_id}</td>
                  <td className="p-3 text-ops-blue">{r.destination_id}</td>
                  <td className="p-3 text-right text-ops-text">{r.distance_km}</td>
                  <td className="p-3 text-right text-ops-dim">{r.travel_time_minutes}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">{r.transport_capacity}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isDisrupted
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRoutes.length > 25 && (
          <div className="p-2.5 bg-ops-panel text-center text-[11px] font-mono text-ops-dim border-t border-ops-border">
            Showing top 25 of {filteredRoutes.length} matching corridors
          </div>
        )}
      </div>
    </div>
  );
};
