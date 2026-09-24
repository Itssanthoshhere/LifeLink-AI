"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  AlertTriangle,
  Truck,
  Activity
} from "lucide-react";
import {
  ShortageAlert,
  TransferRecommendation
} from "@/types/commandCenter";

interface HorizonScrubberProps {
  horizon: number; // 24, 48, or 72
  shortageAlerts: ShortageAlert[];
  transfers: TransferRecommendation[];
  onHourChange?: (hour: number) => void;
}

interface TimelineEvent {
  hour: number;
  type: "shortage" | "transfer" | "expiry";
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  detail: string;
}

export const HorizonScrubber: React.FC<HorizonScrubberProps> = ({
  horizon,
  shortageAlerts,
  transfers,
  onHourChange
}) => {
  const [currentHour, setCurrentHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate synthetic timeline events from real shortage + transfer data
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Scatter shortage alerts across the timeline based on probability
    shortageAlerts.forEach((alert, idx) => {
      // Higher probability = earlier in timeline (more imminent)
      const estimatedHour = Math.round(
        (1 - alert.shortage_probability) * horizon * 0.85 + Math.random() * 4
      );
      const clampedHour = Math.min(Math.max(estimatedHour, 1), horizon);

      events.push({
        hour: clampedHour,
        type: "shortage",
        label: alert.hospital_name,
        severity: alert.risk_level === "CRITICAL" ? "critical" : alert.risk_level === "HIGH" ? "high" : "medium",
        detail: `${alert.blood_group} ${alert.component} — ${alert.current_stock_units} units remaining, ${(alert.shortage_probability * 100).toFixed(0)}% probability`
      });
    });

    // Plot transfer ETAs
    transfers.slice(0, 15).forEach((t, idx) => {
      const etaHour = Math.round(t.travel_time_minutes / 60 * 10) / 10;
      const clampedHour = Math.min(Math.max(Math.ceil(etaHour), 1), horizon);

      events.push({
        hour: clampedHour,
        type: "transfer",
        label: `${t.source_name} → ${t.destination_name}`,
        severity: "low",
        detail: `${t.units} units ${t.recipient_blood_group} ${t.component} • ETA ${t.travel_time_minutes}min`
      });
    });

    // Simulated expiry milestones
    const expiryMilestones = [12, 24, 48].filter((h) => h <= horizon);
    expiryMilestones.forEach((h) => {
      events.push({
        hour: h,
        type: "expiry",
        label: `${h}h FEFO checkpoint`,
        severity: "medium",
        detail: `Units expiring within ${h} hours must be triaged or re-routed`
      });
    });

    return events.sort((a, b) => a.hour - b.hour);
  }, [shortageAlerts, transfers, horizon]);

  // Playback logic
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentHour((prev) => {
          const next = Math.min(prev + 0.5, horizon);
          if (next >= horizon) {
            setIsPlaying(false);
          }
          return next;
        });
      }, 500 / playbackSpeed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, horizon]);

  // Notify parent
  useEffect(() => {
    if (onHourChange) onHourChange(currentHour);
  }, [currentHour, onHourChange]);

  // Track click / drag handler
  const updateHourFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newHour = Math.round(ratio * horizon * 2) / 2; // Snap to 0.5h
      setCurrentHour(newHour);
    },
    [horizon]
  );

  const handleTrackMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsPlaying(false);
    updateHourFromPointer(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) updateHourFromPointer(e.clientX);
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateHourFromPointer]);

  // Events visible at the current hour
  const eventsAtCurrent = useMemo(
    () => timelineEvents.filter((e) => Math.abs(e.hour - currentHour) < 1.5),
    [timelineEvents, currentHour]
  );

  // Count active shortages up to current hour
  const activeShortages = useMemo(
    () => timelineEvents.filter((e) => e.type === "shortage" && e.hour <= currentHour).length,
    [timelineEvents, currentHour]
  );

  const activeTransfers = useMemo(
    () => timelineEvents.filter((e) => e.type === "transfer" && e.hour <= currentHour).length,
    [timelineEvents, currentHour]
  );

  // Hour marks
  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    const step = horizon <= 24 ? 3 : horizon <= 48 ? 6 : 12;
    for (let h = 0; h <= horizon; h += step) marks.push(h);
    if (marks[marks.length - 1] !== horizon) marks.push(horizon);
    return marks;
  }, [horizon]);

  const progressPct = (currentHour / horizon) * 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-200/60">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans">
              {horizon}-Hour Forecast Horizon Scrubber
            </h3>
            <p className="text-xs text-gray-500">
              Time-travel through predicted supply events • {timelineEvents.length} events plotted
            </p>
          </div>
        </div>

        {/* Current Time Readout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/80">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-bold text-gray-900 font-mono tabular-nums">
              T+{currentHour.toFixed(1)}h
            </span>
            <span className="text-[10px] text-gray-400 font-medium">/ {horizon}h</span>
          </div>

          {/* Live counters */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 font-semibold">
              <AlertTriangle className="w-3 h-3" />
              {activeShortages}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-50 border border-cyan-200/80 text-cyan-700 font-semibold">
              <Truck className="w-3 h-3" />
              {activeTransfers}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative">
        {/* Clickable track area */}
        <div
          ref={trackRef}
          onMouseDown={handleTrackMouseDown}
          className="relative h-10 cursor-pointer group"
        >
          {/* Background rail */}
          <div className="absolute top-4 left-0 right-0 h-2 rounded-full bg-gray-100 border border-gray-200/60" />

          {/* Filled portion */}
          <div
            className="absolute top-4 left-0 h-2 rounded-full transition-all duration-100 ease-out"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #6d28d9 0%, #a4161a 50%, #dc2626 100%)"
            }}
          />

          {/* Event markers on the track */}
          {timelineEvents.map((evt, idx) => {
            const left = (evt.hour / horizon) * 100;
            const markerColor =
              evt.type === "shortage"
                ? evt.severity === "critical"
                  ? "bg-rose-500"
                  : evt.severity === "high"
                  ? "bg-amber-500"
                  : "bg-yellow-400"
                : evt.type === "transfer"
                ? "bg-cyan-500"
                : "bg-violet-400";

            return (
              <div
                key={idx}
                className={`absolute top-2.5 w-1.5 h-5 rounded-full ${markerColor} opacity-60 hover:opacity-100 transition-opacity`}
                style={{ left: `${left}%`, transform: "translateX(-50%)" }}
                title={`${evt.label}: ${evt.detail}`}
              />
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-1 transition-all duration-100 ease-out"
            style={{ left: `${progressPct}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-4 h-4 rounded-full bg-white border-2 border-crimson-600 shadow-md group-hover:scale-125 transition-transform">
              <div className="w-1.5 h-1.5 rounded-full bg-crimson-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            {/* Playhead drop line */}
            <div className="w-0.5 h-3.5 bg-crimson-400/50 mx-auto" />
          </div>
        </div>

        {/* Hour labels */}
        <div className="relative h-5 mt-0.5">
          {hourMarks.map((h) => (
            <span
              key={h}
              className="absolute text-[10px] text-gray-400 font-medium font-mono"
              style={{
                left: `${(h / horizon) * 100}%`,
                transform: "translateX(-50%)"
              }}
            >
              {h}h
            </span>
          ))}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Playback controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentHour(Math.max(0, currentHour - (horizon <= 24 ? 1 : 3)))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            title="Step back"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (currentHour >= horizon) setCurrentHour(0);
              setIsPlaying(!isPlaying);
            }}
            className={`p-2 rounded-xl transition-all ${
              isPlaying
                ? "bg-crimson-600 text-white shadow-md hover:bg-crimson-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            }`}
            title={isPlaying ? "Pause" : "Play timeline"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setCurrentHour(Math.min(horizon, currentHour + (horizon <= 24 ? 1 : 3)))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            title="Step forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200/80 p-0.5 ml-2">
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  playbackSpeed === s
                    ? "bg-white text-crimson-700 shadow-xs border border-gray-200/80"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Events at current time */}
        <div className="flex items-center gap-2 max-w-md overflow-hidden">
          {eventsAtCurrent.length > 0 ? (
            eventsAtCurrent.slice(0, 2).map((evt, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border truncate max-w-[220px] ${
                  evt.type === "shortage"
                    ? evt.severity === "critical"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                    : evt.type === "transfer"
                    ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                    : "bg-violet-50 text-violet-700 border-violet-200"
                }`}
              >
                {evt.type === "shortage" ? (
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <Truck className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="truncate">{evt.label}</span>
              </div>
            ))
          ) : (
            <span className="text-[11px] text-gray-400 italic">
              No events at T+{currentHour.toFixed(1)}h
            </span>
          )}
        </div>

        {/* Quick jump shortcuts */}
        <div className="flex items-center gap-1">
          {[0, Math.round(horizon / 4), Math.round(horizon / 2), horizon].map((h) => (
            <button
              key={h}
              onClick={() => {
                setCurrentHour(h);
                setIsPlaying(false);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                Math.abs(currentHour - h) < 1
                  ? "bg-crimson-50 text-crimson-700 border border-crimson-200"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {h === 0 ? "Start" : `${h}h`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
