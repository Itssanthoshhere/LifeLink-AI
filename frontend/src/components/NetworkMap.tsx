"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  HospitalNode,
  BloodBankNode,
  TransportRoute,
  TransferRecommendation
} from "@/types/commandCenter";
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Move, Compass, Radio, Volume2, VolumeX } from "lucide-react";

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [hoveredTransfer, setHoveredTransfer] = useState<TransferRecommendation | null>(null);

  // Audio & Beacon Pulse Settings
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [beaconPulse, setBeaconPulse] = useState(true);

  // Web Audio API Audio Ping for Dispatch Alerts
  const playPingSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context fallback
    }
  }, [soundEnabled]);

  // Interactive Layer Filter State
  const [layers, setLayers] = useState({
    critical: true,
    high: true,
    nominal: true,
    bloodBanks: true,
    transfers: true
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isAllLayersActive = Object.values(layers).every(Boolean);
  const resetLayers = () => {
    setLayers({
      critical: true,
      high: true,
      nominal: true,
      bloodBanks: true,
      transfers: true
    });
  };

  // Node Tier & Route Counts for Legend Badges
  const layerCounts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let nominal = 0;

    hospitals.forEach((h) => {
      const risk = h.shortage_risk_score ?? 0;
      const isCrit = h.status === "CRITICAL" || risk >= 0.7;
      const isHigh = h.status === "WARNING" || (risk >= 0.4 && risk < 0.7);
      if (isCrit) critical++;
      else if (isHigh) high++;
      else nominal++;
    });

    return {
      critical,
      high,
      nominal,
      bloodBanks: bloodBanks.length,
      transfers: recommendedTransfers.length
    };
  }, [hospitals, bloodBanks, recommendedTransfers]);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean up hover debounce timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Debounced hover handlers to eliminate rapid flicker and lag
  const handleNodeHover = useCallback((node: any | null) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!node) {
      // Small buffer before removing to avoid flicker between adjacent SVG elements
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredNode(null);
      }, 100);
    } else {
      // 70ms stabilization buffer so quick mouse sweeps across dense clusters stay smooth
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredNode(node);
        setHoveredTransfer(null);
        playPingSound();
      }, 70);
    }
  }, [playPingSound]);

  const handleTransferHover = useCallback((transfer: TransferRecommendation | null) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!transfer) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredTransfer(null);
      }, 100);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredTransfer(transfer);
        setHoveredNode(null);
      }, 70);
    }
  }, []);

  const width = 800;
  const height = 540;
  const padding = 50;

  // Dynamically calculate coordinate bounding box from actual nodes
  const { minLat, maxLat, minLon, maxLon } = useMemo(() => {
    let minLt = 90;
    let maxLt = -90;
    let minLn = 180;
    let maxLn = -180;

    const allNodes = [...hospitals, ...bloodBanks];
    if (allNodes.length === 0) {
      return { minLat: 12.72, maxLat: 13.48, minLon: 77.40, maxLon: 77.82 };
    }

    allNodes.forEach((n) => {
      if (n.latitude < minLt) minLt = n.latitude;
      if (n.latitude > maxLt) maxLt = n.latitude;
      if (n.longitude < minLn) minLn = n.longitude;
      if (n.longitude > maxLn) maxLn = n.longitude;
    });

    const latSpan = maxLt - minLt || 0.1;
    const lonSpan = maxLn - minLn || 0.1;

    return {
      minLat: minLt - latSpan * 0.08,
      maxLat: maxLt + latSpan * 0.08,
      minLon: minLn - lonSpan * 0.08,
      maxLon: maxLn + lonSpan * 0.08
    };
  }, [hospitals, bloodBanks]);

  // Build lookup of node coordinates
  const nodeCoords = useMemo(() => {
    const project = (lat: number, lon: number) => {
      const x = padding + ((lon - minLon) / (maxLon - minLon)) * (width - 2 * padding);
      const y = height - (padding + ((lat - minLat) / (maxLat - minLat)) * (height - 2 * padding));
      return { x, y };
    };

    const coords: Record<string, { x: number; y: number }> = {};
    hospitals.forEach((h) => {
      coords[h.id] = project(h.latitude, h.longitude);
    });
    bloodBanks.forEach((b) => {
      coords[b.id] = project(b.latitude, b.longitude);
    });
    return coords;
  }, [hospitals, bloodBanks, minLat, maxLat, minLon, maxLon]);

  // Handle Zoom Controls
  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPan({ x: pan.x, y: pan.y });
    setHasMoved(false);
    setHoveredNode(null);
    setHoveredTransfer(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setHasMoved(true);
    }
    setPan({ x: initialPan.x + dx, y: initialPan.y + dy });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredNode(null);
    setHoveredTransfer(null);
  };

  // Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.max(0.5, Math.min(3.5, Number((prev + zoomDelta).toFixed(2)))));
  };

  // Touch Support
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setInitialPan({ x: pan.x, y: pan.y });
      setHasMoved(false);
      setHoveredNode(null);
      setHoveredTransfer(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        setHasMoved(true);
      }
      setPan({ x: initialPan.x + dx, y: initialPan.y + dy });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative bg-[#f8fafc] border border-gray-200/90 rounded-2xl overflow-hidden select-none h-[540px] flex items-center justify-center shadow-xs ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#94a3b8 1px, #f8fafc 1px)",
          backgroundSize: "28px 28px",
          backgroundPosition: `${pan.x % 28}px ${pan.y % 28}px`
        }}
      />

      {/* Map Header Status & Move Hint */}
      <div className="absolute top-3.5 left-3.5 z-10 flex items-center space-x-2.5 bg-white/90 px-3.5 py-1.5 rounded-xl border border-gray-200/90 backdrop-blur-md shadow-2xs pointer-events-none">
        <Crosshair className="w-3.5 h-3.5 text-crimson-700" />
        <span className="text-xs font-bold text-gray-900 font-sans">
          Regional Corridor Network Map
        </span>
        <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">
          ({hospitals.length} Hospitals, {bloodBanks.length} Hubs)
        </span>
        <span className="text-gray-300 hidden sm:inline">•</span>
        <span className="text-[11px] text-crimson-700 font-medium flex items-center gap-1">
          <Move className="w-3 h-3" /> Drag to move
        </span>
      </div>

      {/* Map Controls Toolbar */}
      <div
        className="absolute top-3.5 right-3.5 z-10 flex flex-col space-y-1.5 bg-white/95 p-1 rounded-2xl border border-gray-200 shadow-sm backdrop-blur-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded-xl hover:bg-crimson-50 text-crimson-700 transition-colors"
          title="Orient North & Reset Camera View"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>

        <div className="w-full h-px bg-gray-200 my-0.5" />

        {/* Beacon Radar Toggle */}
        <button
          onClick={() => setBeaconPulse((prev) => !prev)}
          className={`p-1.5 rounded-xl transition-colors ${
            beaconPulse ? 'bg-crimson-50 text-crimson-700' : 'hover:bg-gray-100 text-gray-400'
          }`}
          title={beaconPulse ? 'Emergency Beacon Radar Pulse: Active' : 'Emergency Beacon Radar Pulse: Muted'}
        >
          <Radio className={`w-3.5 h-3.5 ${beaconPulse ? 'animate-pulse text-crimson-600' : ''}`} />
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          className={`p-1.5 rounded-xl transition-colors ${
            soundEnabled ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-100 text-gray-400'
          }`}
          title={soundEnabled ? 'Map Audio Ping Alerts: Enabled' : 'Map Audio Ping Alerts: Muted'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* SVG Canvas with Movable Pan & Zoom */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full pointer-events-auto"
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

        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}
        >
          {/* 1. Background Inactive Route Lines - strictly non-interactive */}
          <g opacity="0.3" className="pointer-events-none">
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
          <g opacity={layers.transfers ? 1 : 0} style={{ transition: 'opacity 0.25s ease' }}>
            {recommendedTransfers.slice(0, 20).map((t, idx) => {
              const p1 = nodeCoords[t.source];
              const p2 = nodeCoords[t.destination];
              if (!p1 || !p2) return null;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => {
                    if (!isDragging && layers.transfers) handleTransferHover(t);
                  }}
                  onMouseLeave={() => handleTransferHover(null)}
                  className={layers.transfers ? 'cursor-pointer' : 'pointer-events-none'}
                >
                  {/* Glow line (passive backdrop) */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#fda4af"
                    strokeWidth="4"
                    strokeOpacity="0.6"
                    className="pointer-events-none"
                  />
                  {/* Active line */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#a4161a"
                    strokeWidth="2.5"
                    className="route-animated"
                    markerEnd="url(#arrow)"
                  />

                  {/* Flow Direction Animated Supply Particle */}
                  <circle r="3" fill="#e11d48" className="pointer-events-none shadow-xs">
                    <animate
                      attributeName="cx"
                      from={p1.x}
                      to={p2.x}
                      dur={`${Math.max(1.2, (t.travel_time_minutes || 20) / 10)}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      from={p1.y}
                      to={p2.y}
                      dur={`${Math.max(1.2, (t.travel_time_minutes || 20) / 10)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </g>

          {/* 3. Blood Bank Nodes (Diamonds) */}
          <g opacity={layers.bloodBanks ? 1 : 0} style={{ transition: 'opacity 0.25s ease' }}>
            {bloodBanks.map((b) => {
              const p = nodeCoords[b.id];
              if (!p) return null;
              const isOffline = b.status !== "Operational";
              const isHovered = hoveredNode?.id === b.id;

              return (
                <g
                  key={b.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  onMouseEnter={() => {
                    if (!isDragging && layers.bloodBanks) handleNodeHover({ ...b, kind: "blood_bank" });
                  }}
                  onMouseLeave={() => handleNodeHover(null)}
                  className={layers.bloodBanks ? 'cursor-pointer' : 'pointer-events-none'}
                >
                  {/* Outer Diamond */}
                  <rect
                    x="-8"
                    y="-8"
                    width="16"
                    height="16"
                    transform="rotate(45)"
                    fill={isOffline ? "#ef4444" : "#1e40af"}
                    stroke={isHovered ? "#38bdf8" : "#ffffff"}
                    strokeWidth={isHovered ? "2.5" : "2"}
                    className="drop-shadow-xs transition-colors duration-150"
                  />
                  {/* Inner Core */}
                  <circle r="3" fill="#ffffff" className="pointer-events-none" />
                  {/* Label */}
                  <text
                    x="12"
                    y="4"
                    fill="#334155"
                    fontSize="9.5"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
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
              const isNominal = !isCrit && !isHigh;
              const isHovered = hoveredNode?.id === h.id;

              // Determine if this node's layer is visible
              const layerVisible = isCrit ? layers.critical : isHigh ? layers.high : layers.nominal;

              const fillColor = isCrit ? "#a4161a" : isHigh ? "#f59e0b" : "#10b981";

              return (
                <g
                  key={h.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  opacity={layerVisible ? 1 : 0}
                  style={{ transition: 'opacity 0.25s ease' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!hasMoved && layerVisible) {
                      onSelectHospital(h.id);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!isDragging && layerVisible) handleNodeHover({ ...h, kind: "hospital" });
                  }}
                  onMouseLeave={() => handleNodeHover(null)}
                  className={layerVisible ? 'cursor-pointer' : 'pointer-events-none'}
                >
                  {/* Pulse ring for critical nodes (strictly non-interactive) */}
                  {isCrit && beaconPulse && (
                    <>
                      <circle
                        r="14"
                        fill="none"
                        stroke="#e11d48"
                        strokeWidth="2"
                        opacity="0.7"
                        className="pointer-events-none animate-ping"
                      />
                      <circle
                        r="20"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1"
                        opacity="0.3"
                        className="pointer-events-none animate-pulse"
                      />
                    </>
                  )}

                  {/* Selected Halo */}
                  {isSelected && (
                    <circle
                      r="11"
                      fill="none"
                      stroke="#1e40af"
                      strokeWidth="2.5"
                      strokeDasharray="3 2"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Node Body */}
                  <circle
                    r={isHovered ? (isCrit ? 8 : 6.5) : (isCrit ? 6.5 : 5)}
                    fill={fillColor}
                    stroke={isHovered ? "#ffffff" : "#ffffff"}
                    strokeWidth={isHovered ? "2.5" : "2"}
                    className="drop-shadow-xs transition-all duration-150"
                  />

                  {/* Label */}
                  <text
                    x="9"
                    y="3.5"
                    fill={isCrit ? "#a4161a" : "#475569"}
                    fontSize="8.5"
                    fontFamily="sans-serif"
                    fontWeight={isCrit ? "bold" : "500"}
                    className="pointer-events-none select-none"
                  >
                    {h.id}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Hover Node Tooltip */}
      {hoveredNode && !isDragging && (
        <div
          className="absolute bottom-4 left-4 z-20 bg-white/95 border border-gray-200/90 p-3.5 rounded-xl shadow-lg text-xs max-w-xs backdrop-blur-md font-sans pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
        >
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
      {hoveredTransfer && !isDragging && (
        <div
          className="absolute bottom-4 right-4 z-20 bg-white/95 border border-gray-200/90 p-3.5 rounded-xl shadow-lg text-xs max-w-xs backdrop-blur-md font-sans pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
        >
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

      {/* Interactive Layer Legend */}
      <div
        className="absolute bottom-3.5 right-3.5 z-10 flex items-center space-x-1.5 bg-white/95 p-1 rounded-2xl border border-gray-200/90 text-xs font-sans text-gray-600 backdrop-blur-md shadow-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Reset All */}
        {!isAllLayersActive && (
          <button
            onClick={resetLayers}
            className="px-2 py-1 rounded-xl text-[10px] font-bold bg-crimson-50 text-crimson-700 border border-crimson-200 hover:bg-crimson-100 transition-colors mr-0.5"
            title="Show all layers"
          >
            Reset All
          </button>
        )}

        {/* Critical */}
        <button
          onClick={() => toggleLayer('critical')}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl transition-all duration-200 border ${
            layers.critical
              ? 'bg-rose-50/90 border-rose-200/90 text-rose-900 shadow-2xs'
              : 'border-transparent opacity-40 hover:opacity-75'
          }`}
          title={layers.critical ? 'Hide critical nodes' : 'Show critical nodes'}
        >
          <span className={`w-2.5 h-2.5 rounded-full inline-block transition-colors duration-200 ${layers.critical ? 'bg-rose-600' : 'bg-gray-300'}`} />
          <span className={`text-[11px] font-medium transition-all duration-200 ${!layers.critical ? 'line-through text-gray-400' : 'text-gray-800'}`}>Critical</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
            layers.critical ? 'bg-white text-rose-800 border border-rose-200' : 'bg-gray-200 text-gray-500'
          }`}>
            {layerCounts.critical}
          </span>
        </button>

        {/* High Risk */}
        <button
          onClick={() => toggleLayer('high')}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl transition-all duration-200 border ${
            layers.high
              ? 'bg-amber-50/90 border-amber-200/90 text-amber-900 shadow-2xs'
              : 'border-transparent opacity-40 hover:opacity-75'
          }`}
          title={layers.high ? 'Hide high-risk nodes' : 'Show high-risk nodes'}
        >
          <span className={`w-2.5 h-2.5 rounded-full inline-block transition-colors duration-200 ${layers.high ? 'bg-amber-500' : 'bg-gray-300'}`} />
          <span className={`text-[11px] font-medium transition-all duration-200 ${!layers.high ? 'line-through text-gray-400' : 'text-gray-800'}`}>High Risk</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
            layers.high ? 'bg-white text-amber-800 border border-amber-200' : 'bg-gray-200 text-gray-500'
          }`}>
            {layerCounts.high}
          </span>
        </button>

        {/* Nominal */}
        <button
          onClick={() => toggleLayer('nominal')}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl transition-all duration-200 border ${
            layers.nominal
              ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-900 shadow-2xs'
              : 'border-transparent opacity-40 hover:opacity-75'
          }`}
          title={layers.nominal ? 'Hide nominal nodes' : 'Show nominal nodes'}
        >
          <span className={`w-2.5 h-2.5 rounded-full inline-block transition-colors duration-200 ${layers.nominal ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          <span className={`text-[11px] font-medium transition-all duration-200 ${!layers.nominal ? 'line-through text-gray-400' : 'text-gray-800'}`}>Nominal</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
            layers.nominal ? 'bg-white text-emerald-800 border border-emerald-200' : 'bg-gray-200 text-gray-500'
          }`}>
            {layerCounts.nominal}
          </span>
        </button>

        {/* Blood Banks */}
        <button
          onClick={() => toggleLayer('bloodBanks')}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl transition-all duration-200 border ${
            layers.bloodBanks
              ? 'bg-blue-50/90 border-blue-200/90 text-blue-900 shadow-2xs'
              : 'border-transparent opacity-40 hover:opacity-75'
          }`}
          title={layers.bloodBanks ? 'Hide blood banks' : 'Show blood banks'}
        >
          <span className={`w-2.5 h-2.5 transform rotate-45 inline-block transition-colors duration-200 ${layers.bloodBanks ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <span className={`text-[11px] font-medium transition-all duration-200 ${!layers.bloodBanks ? 'line-through text-gray-400' : 'text-gray-800'}`}>Blood Bank</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
            layers.bloodBanks ? 'bg-white text-blue-800 border border-blue-200' : 'bg-gray-200 text-gray-500'
          }`}>
            {layerCounts.bloodBanks}
          </span>
        </button>

        {/* Active Transfers */}
        <button
          onClick={() => toggleLayer('transfers')}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl transition-all duration-200 border ${
            layers.transfers
              ? 'bg-purple-50/90 border-purple-200/90 text-purple-900 shadow-2xs'
              : 'border-transparent opacity-40 hover:opacity-75'
          }`}
          title={layers.transfers ? 'Hide transfer routes' : 'Show transfer routes'}
        >
          <span className={`w-4 h-0.5 inline-block transition-colors duration-200 ${layers.transfers ? 'bg-purple-600' : 'bg-gray-300'}`} />
          <span className={`text-[11px] font-medium transition-all duration-200 ${!layers.transfers ? 'line-through text-gray-400' : 'text-gray-800'}`}>Transfers</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
            layers.transfers ? 'bg-white text-purple-800 border border-purple-200' : 'bg-gray-200 text-gray-500'
          }`}>
            {layerCounts.transfers}
          </span>
        </button>
      </div>
    </div>
  );
};
