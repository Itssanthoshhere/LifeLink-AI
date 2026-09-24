"use client";

import React from "react";
import { RefreshCw, Play, Clock, Calendar, AlertOctagon, Server, Sparkles } from "lucide-react";
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
    <header className="h-16 border-b border-gray-200/80 bg-white/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title / Context */}
      <div className="flex items-center space-x-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-gray-900 font-sans">
              AI Blood Supply Command Center
            </h1>
            <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-crimson-50 text-crimson-700 border border-crimson-200/80">
              MILP 72H Active
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-sans mt-0.5">
            Real-time multi-echelon network monitoring & transshipment intelligence
          </p>
        </div>
      </div>

      {/* Global Controls */}
      <div className="flex items-center space-x-2.5 text-xs">
        {/* Date Selector */}
        <div className="flex items-center space-x-1.5 bg-gray-50/90 hover:bg-gray-100/80 transition-colors px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-gray-800 text-xs focus:outline-none font-sans cursor-pointer font-medium"
          />
        </div>

        {/* Planning Horizon Toggle */}
        <div className="flex items-center bg-gray-50/90 rounded-xl border border-gray-200 p-1 shadow-2xs">
          <span className="px-2 text-[10px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" /> Horizon
          </span>
          {[24, 48, 72].map((h) => (
            <button
              key={h}
              onClick={() => onHorizonChange(h)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                horizon === h
                  ? "bg-white text-crimson-700 shadow-xs border border-gray-200/80"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>

        {/* Operational Scenario Dropdown */}
        <div className="flex items-center space-x-1.5 bg-gray-50/90 hover:bg-gray-100/80 transition-colors px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
          <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="bg-transparent text-gray-800 text-xs focus:outline-none cursor-pointer font-medium"
          >
            {SCENARIO_CATALOG.map((sc) => (
              <option key={sc.id} value={sc.id} className="bg-white text-gray-800">
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
          className="p-2 rounded-xl bg-gray-50/90 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 transition-all disabled:opacity-50 shadow-2xs active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-crimson-600" : ""}`} />
        </button>

        {/* Demo Mode Button */}
        <button
          onClick={onLaunchDemo}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-crimson-600 to-crimson-800 hover:from-crimson-700 hover:to-crimson-900 text-white font-semibold text-xs shadow-xs hover:shadow-sm transition-all active:scale-95"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>Demo Simulation</span>
        </button>

        {/* Backend Status Badge */}
        <div
          title={isLiveBackend ? "Connected to live FastAPI backend bridge (port 8000)" : "Using verified mock snapshot fallback"}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
            isLiveBackend
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/90"
              : "bg-amber-50 text-amber-700 border-amber-200/90"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLiveBackend ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <Server className="w-3 h-3 opacity-80" />
          <span className="font-semibold text-[10px] tracking-wide">{isLiveBackend ? "LIVE BACKEND" : "SIMULATED"}</span>
        </div>
      </div>
    </header>
  );
};
