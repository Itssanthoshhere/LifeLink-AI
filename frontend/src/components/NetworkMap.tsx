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
    <div className="relative bg-[#f8fafc] border border-gray-200/90 rounded-2xl overflow-hidden select-none h-[540px] flex items-center justify-center shadow-xs">
      {/* Grid Pattern Overlay for Crisp Cartography */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#94a3b8 1px, #f8fafc 1px)",
          backgroundSize: "28px 28px",
          backgroundPosition: "0 0, 14px 14px"
        }}
      />

      {/* Map Header Status */}
      <div className="absolute top-3.5 left-3.5 z-10 flex items-center space-x-2.5 bg-white/90 px-3.5 py-1.5 rounded-xl border border-gray-200/90 backdrop-blur-md shadow-2xs">
        <Crosshair className="w-3.5 h-3.5 text-crimson-700" />
        <span className="text-xs font-bold text-gray-900 font-sans">
          Regional Corridor Network Map
        </span>
        <span className="text-[11px] text-gray-500 font-medium">
          ({hospitals.length} Hospitals, {bloodBanks.length} Hubs)
        </span>
      </div>

      {/* Map Controls */}
      <div className="absolute top-3.5 right-3.5 z-10 flex flex-col space-y-1.5 bg-white/90 p-1 rounded-xl border border-gray-200 shadow-2xs backdrop-blur-md">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
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
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a4161a" />
          </marker>
        </defs>

        {/* 1. Background Inactive Route Lines */}
        <g opacity="0.35">
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
                stroke="#cbd5e1"
                strokeWidth="1.2"
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
                  stroke="#fda4af"
                  strokeWidth="4"
                  strokeOpacity="0.6"
                />
                {/* Animated dash line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#a4161a"
                  strokeWidth="2.2"
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
                  fill={isOffline ? "#ef4444" : "#1e40af"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="drop-shadow-xs"
                />
                {/* Inner Core */}
                <circle r="3" fill="#ffffff" />
                {/* Label */}
                <text
                  x="12"
                  y="4"
                  fill="#334155"
                  fontSize="9.5"
                  fontFamily="sans-serif"
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

            const fillColor = isCrit ? "#a4161a" : isHigh ? "#f59e0b" : "#10b981";

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
                    stroke="#a4161a"
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Selected Halo */}
                {isSelected && (
                  <circle
                    r="11"
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="2.5"
                    strokeDasharray="3 2"
                  />
                )}

                {/* Node Body */}
                <circle
                  r={isCrit ? 6.5 : 5}
                  fill={fillColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="drop-shadow-xs"
                />

                {/* Label */}
                <text
                  x="9"
                  y="3.5"
                  fill={isCrit ? "#a4161a" : "#475569"}
                  fontSize="8.5"
                  fontFamily="sans-serif"
                  fontWeight={isCrit ? "bold" : "500"}
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
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 border border-gray-200/90 p-3.5 rounded-xl shadow-lg text-xs max-w-xs backdrop-blur-md font-sans pointer-events-none">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="font-bold text-gray-900">{hoveredNode.name}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                hoveredNode.kind === "blood_bank"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : hoveredNode.risk_level === "CRITICAL"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {hoveredNode.kind === "blood_bank" ? "Blood Bank" : `${hoveredNode.risk_level} Risk`}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            ID: <span className="text-gray-900 font-semibold">{hoveredNode.id}</span>
          </div>
          {hoveredNode.kind === "hospital" ? (
            <div className="text-[11px] text-gray-600 mt-2 space-y-1">
              <div>Type: <strong className="text-gray-800">{hoveredNode.hospital_type}</strong></div>
              <div>Beds: {hoveredNode.bed_capacity} | ICU: {hoveredNode.icu_capacity}</div>
              <div>Storage Cap: {hoveredNode.storage_capacity} units</div>
              <div className="text-crimson-700 font-semibold mt-1">Click node to inspect intelligence &rarr;</div>
            </div>
          ) : (
            <div className="text-[11px] text-gray-600 mt-2 space-y-1">
              <div>Storage Capacity: {hoveredNode.storage_capacity} units</div>
              <div>Daily Intake: {hoveredNode.daily_collection_capacity} units/day</div>
              <div>Emergency Support: {hoveredNode.emergency_support ? "Yes" : "No"}</div>
            </div>
          )}
        </div>
      )}

      {/* Hover Transfer Route Tooltip */}
      {hoveredTransfer && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 border border-gray-200/90 p-3.5 rounded-xl shadow-lg text-xs max-w-xs backdrop-blur-md font-sans pointer-events-none">
          <div className="text-[10px] text-crimson-700 uppercase font-bold mb-1">
            Recommended Transshipment
          </div>
          <div className="text-gray-900 font-bold">
            {hoveredTransfer.source} &rarr; {hoveredTransfer.destination}
          </div>
          <div className="text-emerald-700 font-bold mt-1">
            {hoveredTransfer.units} units {hoveredTransfer.recipient_blood_group} {hoveredTransfer.component}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            ETA: {hoveredTransfer.travel_time_minutes} min | Dist: {hoveredTransfer.distance_km} km
          </div>
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center space-x-3.5 bg-white/90 px-3.5 py-1.5 rounded-xl border border-gray-200/90 text-xs font-sans text-gray-600 backdrop-blur-md shadow-2xs">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-crimson-600" />
          <span className="text-[11px]">Critical</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-[11px]">High Risk</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[11px]">Nominal</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 bg-blue-700 transform rotate-45" />
          <span className="text-[11px]">Blood Bank</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-4 h-0.5 bg-crimson-600" />
          <span className="text-[11px]">Active Transfer</span>
        </div>
      </div>
    </div>
  );
};
