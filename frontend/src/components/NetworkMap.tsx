"use client";

import React, { useState, useMemo } from "react";
import {
  HospitalNode,
  BloodBankNode,
  TransportRoute,
  TransferRecommendation
} from "@/types/commandCenter";
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from "lucide-react";

interface NetworkMapProps {
  hospitals: HospitalNode[];
  bloodBanks: BloodBankNode[];
  routes: TransportRoute[];
  recommendedTransfers: TransferRecommendation[];
  onSelectHospital: (hospitalId: string) => void;
  selectedHospitalId?: string | null;
}

export const NetworkMap: React.FC<NetworkMapProps> = ({
  hospitals,
  bloodBanks,
  routes,
  recommendedTransfers,
  onSelectHospital,
  selectedHospitalId
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [hoveredTransfer, setHoveredTransfer] = useState<TransferRecommendation | null>(null);

  // Coordinate bounding box for Bangalore Metro Region
  // Lat: ~12.72 to 13.48, Lon: ~77.40 to 77.82
  const minLat = 12.72;
  const maxLat = 13.48;
  const minLon = 77.40;
  const maxLon = 77.82;

  const width = 800;
  const height = 540;
  const padding = 40;

  // Project geographic coordinates to SVG viewport
  const project = (lat: number, lon: number) => {
    const x = padding + ((lon - minLon) / (maxLon - minLon)) * (width - 2 * padding);
    // Invert lat for SVG y-axis
    const y = height - (padding + ((lat - minLat) / (maxLat - minLat)) * (height - 2 * padding));
    return { x, y };
  };

  // Build lookup of node coordinates
  const nodeCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    hospitals.forEach((h) => {
      coords[h.id] = project(h.latitude, h.longitude);
    });
    bloodBanks.forEach((b) => {
      coords[b.id] = project(b.latitude, b.longitude);
    });
    return coords;
  }, [hospitals, bloodBanks]);

  // Handle Pan & Zoom
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.3, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.3, 0.7));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative bg-[#070B11] border border-ops-border rounded overflow-hidden select-none h-[540px] flex items-center justify-center">
      {/* Grid Pattern Overlay for Operations Aesthetic */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(#202E42 1px, transparent 1px), radial-gradient(#202E42 1px, #070B11 1px)",
          backgroundSize: "32px 32px",
          backgroundPosition: "0 0, 16px 16px"
        }}
      />

      {/* Map Header Status */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-ops-panel/90 px-3 py-1.5 rounded border border-ops-border backdrop-blur">
        <Crosshair className="w-3.5 h-3.5 text-ops-cyan" />
        <span className="text-[11px] font-mono text-ops-text font-semibold">
          METRO LOGISTICS CORRIDOR MAP
        </span>
        <span className="text-[10px] font-mono text-ops-dim">
          ({hospitals.length} Hospitals, {bloodBanks.length} Blood Banks)
        </span>
      </div>

      {/* Map Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1 bg-ops-panel/90 p-1 rounded border border-ops-border backdrop-blur">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-ops-card text-ops-dim hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-ops-card text-ops-dim hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded hover:bg-ops-card text-ops-dim hover:text-white transition"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-75"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
        }}
      >
        <defs>
          {/* Arrowhead marker for transfers */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#06B6D4" />
          </marker>
        </defs>

        {/* 1. Background Inactive Route Lines */}
        <g opacity="0.15">
          {routes.slice(0, 100).map((r, idx) => {
            const p1 = nodeCoords[r.source_id];
            const p2 = nodeCoords[r.destination_id];
            if (!p1 || !p2) return null;
            return (
              <line
                key={idx}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#64748B"
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* 2. Highlighted Active Recommended Transfer Routes */}
        <g>
          {recommendedTransfers.slice(0, 20).map((t, idx) => {
            const p1 = nodeCoords[t.source];
            const p2 = nodeCoords[t.destination];
            if (!p1 || !p2) return null;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredTransfer(t)}
                onMouseLeave={() => setHoveredTransfer(null)}
                className="cursor-pointer"
              >
                {/* Glow line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#06B6D4"
                  strokeWidth="3"
                  strokeOpacity="0.4"
                />
                {/* Animated dash line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#38BDF8"
                  strokeWidth="2"
                  className="route-animated"
                  markerEnd="url(#arrow)"
                />
              </g>
            );
          })}
        </g>

        {/* 3. Blood Bank Nodes (Diamonds) */}
        <g>
          {bloodBanks.map((b) => {
            const p = nodeCoords[b.id];
            if (!p) return null;
            const isOffline = b.status !== "Operational";

            return (
              <g
                key={b.id}
                transform={`translate(${p.x}, ${p.y})`}
                onMouseEnter={() => setHoveredNode({ ...b, kind: "blood_bank" })}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* Outer Ring */}
                <rect
                  x="-8"
                  y="-8"
                  width="16"
                  height="16"
                  transform="rotate(45)"
                  fill={isOffline ? "#7F1D1D" : "#0F172A"}
                  stroke={isOffline ? "#EF4444" : "#0284C7"}
                  strokeWidth="2"
                />
                {/* Inner Core */}
                <circle r="3" fill={isOffline ? "#EF4444" : "#38BDF8"} />
                {/* Label */}
                <text
                  x="12"
                  y="4"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {b.id}
                </text>
              </g>
            );
          })}
        </g>

        {/* 4. Hospital Nodes (Circles with Risk Rings) */}
        <g>
          {hospitals.map((h) => {
            const p = nodeCoords[h.id];
            if (!p) return null;

            const isSelected = selectedHospitalId === h.id;
            const isCrit = h.risk_level === "CRITICAL";
            const isHigh = h.risk_level === "HIGH";

            const fillColor = isCrit ? "#EF4444" : isHigh ? "#F59E0B" : "#10B981";
            const strokeColor = isCrit ? "#7F1D1D" : isHigh ? "#78350F" : "#064E3B";

            return (
              <g
                key={h.id}
                transform={`translate(${p.x}, ${p.y})`}
                onClick={() => onSelectHospital(h.id)}
                onMouseEnter={() => setHoveredNode({ ...h, kind: "hospital" })}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                {/* Pulse ring for critical nodes */}
                {isCrit && (
                  <circle
                    r="12"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Selection indicator */}
                {isSelected && (
                  <circle
                    r="14"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                )}

                {/* Main Node */}
                <circle
                  r={isCrit ? "6" : "5"}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="2"
                />

                {/* Label */}
                <text
                  x="9"
                  y="3"
                  fill={isCrit ? "#FCA5A5" : "#64748B"}
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight={isCrit ? "bold" : "normal"}
                >
                  {h.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 z-20 bg-ops-panel/95 border border-ops-border p-3 rounded shadow-xl text-xs max-w-xs backdrop-blur font-mono pointer-events-none">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-white">{hoveredNode.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                hoveredNode.kind === "blood_bank"
                  ? "bg-blue-500/20 text-blue-400"
                  : hoveredNode.risk_level === "CRITICAL"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {hoveredNode.kind === "blood_bank" ? "BLOOD BANK" : `${hoveredNode.risk_level} RISK`}
            </span>
          </div>
          <div className="text-[10px] text-ops-muted">
            ID: <span className="text-white">{hoveredNode.id}</span>
          </div>
          {hoveredNode.kind === "hospital" ? (
            <div className="text-[10px] text-ops-dim mt-1 space-y-0.5">
              <div>Type: {hoveredNode.hospital_type}</div>
              <div>Beds: {hoveredNode.bed_capacity} | ICU: {hoveredNode.icu_capacity}</div>
              <div>Storage Cap: {hoveredNode.storage_capacity} units</div>
              <div className="text-ops-cyan mt-1">Click node to open Hospital Intelligence &rarr;</div>
            </div>
          ) : (
            <div className="text-[10px] text-ops-dim mt-1 space-y-0.5">
              <div>Storage Capacity: {hoveredNode.storage_capacity} units</div>
              <div>Daily Intake: {hoveredNode.daily_collection_capacity} units/day</div>
              <div>Emergency Support: {hoveredNode.emergency_support ? "YES" : "NO"}</div>
            </div>
          )}
        </div>
      )}

      {/* Hover Transfer Route Tooltip */}
      {hoveredTransfer && (
        <div className="absolute bottom-3 right-3 z-20 bg-ops-panel/95 border border-ops-border p-3 rounded shadow-xl text-xs max-w-xs backdrop-blur font-mono pointer-events-none">
          <div className="text-[10px] text-ops-cyan uppercase font-bold mb-1">
            RECOMMENDED TRANSSHIPMENT
          </div>
          <div className="text-white font-bold">
            {hoveredTransfer.source} &rarr; {hoveredTransfer.destination}
          </div>
          <div className="text-emerald-400 font-bold mt-1">
            {hoveredTransfer.units} units {hoveredTransfer.recipient_blood_group} {hoveredTransfer.component}
          </div>
          <div className="text-[10px] text-ops-muted mt-1">
            ETA: {hoveredTransfer.travel_time_minutes} min | Dist: {hoveredTransfer.distance_km} km
          </div>
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-3 bg-ops-panel/90 px-3 py-1.5 rounded border border-ops-border text-[10px] font-mono text-ops-dim backdrop-blur">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>High Risk</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Nominal</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-ops-blue transform rotate-45" />
          <span>Blood Bank</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-0.5 bg-ops-cyan border border-ops-cyan" />
          <span>Active Transfer</span>
        </div>
      </div>
    </div>
  );
};
