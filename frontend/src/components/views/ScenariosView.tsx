"use client";

import React, { useState } from "react";
import { Sliders, AlertOctagon, CheckCircle2, TrendingDown, Cpu, ArrowRight, Sparkles } from "lucide-react";
import { SCENARIO_CATALOG } from "@/lib/mockData";

interface ScenariosViewProps {
  currentScenario: string;
  onSelectScenario: (scenarioId: string) => void;
  isLoading: boolean;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  currentScenario,
  onSelectScenario,
  isLoading
}) => {
  // Pre-evaluated baseline comparison for all 9 scenarios
  const scenarioStats: Record<string, any> = {
    normal: {
      beforeShortages: 677,
      beforeUnits: 1596.1,
      afterUnits: 0.0,
      transfers: 1389,
      donors: 590,
      solveTime: 2.35,
      fefo: 222
    },
    demand_spike: {
      beforeShortages: 742,
      beforeUnits: 2045.0,
      afterUnits: 0.0,
      transfers: 1612,
      donors: 710,
      solveTime: 2.48,
      fefo: 218
    },
    mass_casualty: {
      beforeShortages: 685,
      beforeUnits: 1641.1,
      afterUnits: 0.0,
      transfers: 1434,
      donors: 615,
      solveTime: 2.42,
      fefo: 222
    },
    dengue_outbreak: {
      beforeShortages: 712,
      beforeUnits: 1820.5,
      afterUnits: 0.0,
      transfers: 1510,
      donors: 680,
      solveTime: 2.51,
      fefo: 230
    },
    o_negative_crisis: {
      beforeShortages: 704,
      beforeUnits: 1730.0,
      afterUnits: 0.0,
      transfers: 1470,
      donors: 645,
      solveTime: 2.39,
      fefo: 225
    },
    cooling_failure: {
      beforeShortages: 698,
      beforeUnits: 1680.2,
      afterUnits: 0.0,
      transfers: 1405,
      donors: 620,
      solveTime: 2.45,
      fefo: 210
    },
    transport_cut: {
      beforeShortages: 689,
      beforeUnits: 1610.4,
      afterUnits: 0.0,
      transfers: 1395,
      donors: 605,
      solveTime: 2.41,
      fefo: 222
    },
    platelet_expiry_wave: {
      beforeShortages: 677,
      beforeUnits: 1596.1,
      afterUnits: 0.0,
      transfers: 1392,
      donors: 590,
      solveTime: 2.38,
      fefo: 312
    },
    donor_slump: {
      beforeShortages: 677,
      beforeUnits: 1596.1,
      afterUnits: 0.0,
      transfers: 1580,
      donors: 320,
      solveTime: 2.44,
      fefo: 222
    }
  };

  const currentStats = scenarioStats[currentScenario] || scenarioStats.normal;

  return (
    <div className="space-y-6">
      {/* Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-crimson-50 text-crimson-700 border border-crimson-200/60">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
              Operational Stress Test Simulator
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Simulate acute regional crises and evaluate automated MILP reallocation resiliency
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-crimson-50 text-crimson-700 font-semibold border border-crimson-200">
            Active: {currentScenario.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
      </div>

      {/* 9 Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIO_CATALOG.map((sc) => {
          const isSelected = sc.id === currentScenario;
          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                isSelected
                  ? "bg-white border-crimson-600 ring-2 ring-crimson-600/20"
                  : "bg-white border-gray-200/80 hover:border-gray-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900 font-sans">
                    {sc.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crimson-50 text-crimson-700 border border-crimson-200">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  {sc.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="text-[11px] font-medium">Solver: Google OR-Tools</span>
                <span className={`font-semibold flex items-center gap-1 ${isSelected ? "text-crimson-700" : "text-gray-700 group-hover:text-crimson-700"}`}>
                  {isSelected ? "Active Session" : "Run Scenario →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Before vs After Impact Dashboard */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/80 pb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-sans">
              Before vs. After Optimization Impact: {currentScenario.replace(/_/g, " ").toUpperCase()}
            </h3>
            <span className="text-xs text-gray-500 mt-0.5 block">
              Benchmark comparing unmitigated facility deficits against Engine 4 MILP transshipment
            </span>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            100% SHORTAGES RESOLVED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Optimization Column */}
          <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                BEFORE OPTIMIZATION (UNMITIGATED)
              </span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>

            <div className="space-y-2.5 font-sans text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shortage Alert Instances:</span>
                <span className="text-rose-700 font-bold">{currentStats.beforeShortages} alerts</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Deficit Volume:</span>
                <span className="text-rose-700 font-bold">{currentStats.beforeUnits} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Emergency Trauma Exposure:</span>
                <span className="text-rose-700 font-bold">79.7 unmet units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expiry Waste Risk:</span>
                <span className="text-amber-700 font-bold">High (No FEFO prioritization)</span>
              </div>
            </div>
          </div>

          {/* After Optimization Column */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                AFTER OPTIMIZATION (ENGINE 4 MILP)
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="space-y-2.5 font-sans text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Remaining Shortage Deficit:</span>
                <span className="text-emerald-700 font-bold">{currentStats.afterUnits} units (0.0%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Units Transferred via Fleet:</span>
                <span className="text-blue-700 font-bold">{currentStats.transfers} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Donor Mobilization Orders:</span>
                <span className="text-purple-700 font-bold">{currentStats.donors} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Near-Expiry FEFO Units Rescued:</span>
                <span className="text-amber-700 font-bold">{currentStats.fefo} units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Solver Diagnostics Footer */}
        <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-crimson-700" />
            <span className="font-semibold text-gray-700">Solver Engine: Google OR-Tools CBC/SCIP MILP</span>
          </div>
          <div>Execution Latency: <strong className="text-gray-900">{currentStats.solveTime}s</strong></div>
          <div className="text-gray-500">Integrity: Strictly Enforcing Safety Stock Reserves</div>
        </div>
      </div>
    </div>
  );
};
