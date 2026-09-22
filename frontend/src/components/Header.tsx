"use client";

import React from "react";
import { RefreshCw, Play, Clock, Calendar, AlertOctagon, Server } from "lucide-react";
import { SCENARIO_CATALOG } from "@/lib/mockData";

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  horizon: number;
  onHorizonChange: (h: number) => void;
  selectedScenario: string;
  onScenarioChange: (s: string) => void;
  onRefresh: () => void;
  onLaunchDemo: () => void;
  isLoading: boolean;
  isLiveBackend: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  horizon,
  onHorizonChange,
  selectedScenario,
  onScenarioChange,
  onRefresh,
  onLaunchDemo,
  isLoading,
  isLiveBackend
}) => {
  return (
    <header className="h-16 border-b border-ops-border bg-ops-panel/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title / Context */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            AI BLOOD SUPPLY COMMAND CENTER
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ops-card border border-ops-border text-ops-cyan">
              MILP 72H
            </span>
          </h1>
          <p className="text-[11px] text-ops-dim">
            Real-time multi-echelon network monitoring & transshipment optimization
          </p>
        </div>
      </div>

      {/* Global Controls */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Date Selector */}
        <div className="flex items-center space-x-1.5 bg-ops-card px-2.5 py-1.5 rounded border border-ops-border">
          <Calendar className="w-3.5 h-3.5 text-ops-dim" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-ops-text text-xs focus:outline-none font-mono cursor-pointer"
          />
        </div>

        {/* Planning Horizon Toggle */}
        <div className="flex items-center bg-ops-card rounded border border-ops-border p-0.5">
          <span className="px-2 text-[10px] text-ops-dim font-mono uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-ops-dim" /> Horizon:
          </span>
          {[24, 48, 72].map((h) => (
            <button
              key={h}
              onClick={() => onHorizonChange(h)}
              className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                horizon === h
                  ? "bg-ops-accent text-white font-bold shadow-sm"
                  : "text-ops-muted hover:text-white"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>

        {/* Operational Scenario Dropdown */}
        <div className="flex items-center space-x-1.5 bg-ops-card px-2.5 py-1.5 rounded border border-ops-border">
          <AlertOctagon className="w-3.5 h-3.5 text-ops-amber" />
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="bg-transparent text-ops-text text-xs focus:outline-none cursor-pointer font-medium"
          >
            {SCENARIO_CATALOG.map((sc) => (
              <option key={sc.id} value={sc.id} className="bg-ops-panel text-white">
                {sc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Network Optimization"
          className="p-2 rounded bg-ops-card hover:bg-ops-cardHover border border-ops-border text-ops-muted hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-ops-cyan" : ""}`} />
        </button>

        {/* Demo Mode Button */}
        <button
          onClick={onLaunchDemo}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-red-600/90 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs border border-red-500/40 shadow-sm shadow-red-950 transition active:scale-95"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>DEMO MODE</span>
        </button>

        {/* Backend Status Badge */}
        <div
          title={isLiveBackend ? "Connected to live FastAPI backend bridge (port 8000)" : "Using verified mock snapshot fallback"}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-[10px] font-mono font-medium ${
            isLiveBackend
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          <Server className="w-3 h-3" />
          <span>{isLiveBackend ? "LIVE BACKEND" : "DEMO DATA"}</span>
        </div>
      </div>
    </header>
  );
};
