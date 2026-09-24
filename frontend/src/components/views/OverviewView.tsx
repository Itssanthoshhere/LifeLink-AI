"use client";

import React from "react";
import {
  AlertTriangle,
  Building2,
  Package,
  Truck,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Sparkles
} from "lucide-react";
import {
  CommandCenterPayload,
  NetworkPayload,
  ShortageAlert,
  TransferRecommendation
} from "@/types/commandCenter";
import { NetworkMap } from "@/components/NetworkMap";
import { HorizonScrubber } from "@/components/HorizonScrubber";
import { IntelligenceChain } from "@/components/IntelligenceChain";

interface OverviewViewProps {
  commandCenter: CommandCenterPayload;
  network: NetworkPayload;
  onSelectHospital: (id: string) => void;
  onNavigate: (tab: any) => void;
  onApproveTransfer?: (transfer: TransferRecommendation) => void;
  selectedHospitalId?: string | null;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  commandCenter,
  network,
  onSelectHospital,
  onNavigate,
  onApproveTransfer,
  selectedHospitalId
}) => {
  const metrics = commandCenter.network_metrics;
  const criticalAlerts = commandCenter.shortage_alerts.filter(
    (a) => a.risk_level === "CRITICAL"
  );
  const highRiskCount = new Set(
    commandCenter.shortage_alerts
      .filter((a) => a.risk_level === "CRITICAL" || a.risk_level === "HIGH")
      .map((a) => a.hospital_id)
  ).size;

  const kpis = [
    {
      title: "Critical Shortages",
      value: metrics.critical_shortages_before,
      unit: "alerts",
      context: "High-priority clinical deficits",
      color: "text-crimson-600",
      bg: "bg-crimson-50/70",
      border: "border-crimson-200/80",
      iconBg: "bg-crimson-100 text-crimson-700",
      icon: AlertTriangle
    },
    {
      title: "High-Risk Hospitals",
      value: highRiskCount,
      unit: "/ 30 facilities",
      context: "Imminent stock exhaustion",
      color: "text-amber-600",
      bg: "bg-amber-50/70",
      border: "border-amber-200/80",
      iconBg: "bg-amber-100 text-amber-700",
      icon: Building2
    },
    {
      title: "Available Inventory",
      value: "9,410",
      unit: "units",
      context: "Across 40 network facilities",
      color: "text-blue-600",
      bg: "bg-blue-50/70",
      border: "border-blue-200/80",
      iconBg: "bg-blue-100 text-blue-700",
      icon: Package
    },
    {
      title: "Recommended Transfers",
      value: metrics.total_units_transferred,
      unit: "units",
      context: `${commandCenter.transfer_recommendations.length} planned dispatches`,
      color: "text-cyan-600",
      bg: "bg-cyan-50/70",
      border: "border-cyan-200/80",
      iconBg: "bg-cyan-100 text-cyan-700",
      icon: Truck
    },
    {
      title: "Donor Mobilizations",
      value: metrics.total_donor_units_mobilized,
      unit: "units",
      context: "High-probability candidate callouts",
      color: "text-purple-600",
      bg: "bg-purple-50/70",
      border: "border-purple-200/80",
      iconBg: "bg-purple-100 text-purple-700",
      icon: Users
    },
    {
      title: "Units at Expiry Risk",
      value: metrics.fefo_expiring_units_rescued,
      unit: "units rescued",
      context: "Prioritized via FEFO transshipment",
      color: "text-emerald-600",
      bg: "bg-emerald-50/70",
      border: "border-emerald-200/80",
      iconBg: "bg-emerald-100 text-emerald-700",
      icon: Clock
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
            Network Operations Dashboard
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time blood supply monitoring, predictive shortage mitigation, and MILP transshipment dispatch
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 font-medium shadow-2xs">
            Region: <strong className="text-gray-900">Tamil Nadu (30 Hospitals, 10 Blood Banks)</strong>
          </span>
        </div>
      </div>

      {/* Intelligence Pipeline Story Banner */}
      <IntelligenceChain data={commandCenter} onNavigate={onNavigate} />

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-2xl border ${kpi.border} bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-1.5 rounded-xl ${kpi.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`text-2xl font-extrabold font-sans ${kpi.color}`}>
                    {kpi.value}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {kpi.unit}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                  {kpi.context}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Central Operations Map (2 columns wide on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <span className="text-sm font-bold text-gray-900 font-sans">
                  Regional Blood Supply Network Map
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {(metrics?.emergency_protection_rate_pct ?? 100).toFixed(0)}% Emergency Protected
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Click any hospital node for deep intelligence
              </span>
            </div>

            <NetworkMap
              hospitals={network.nodes.hospitals}
              bloodBanks={network.nodes.blood_banks}
              routes={network.routes}
              recommendedTransfers={commandCenter.transfer_recommendations}
              onSelectHospital={onSelectHospital}
              selectedHospitalId={selectedHospitalId}
            />
          </div>

          {/* 72-Hour Forecast Horizon Scrubber */}
          <HorizonScrubber
            horizon={commandCenter.horizon}
            shortageAlerts={commandCenter.shortage_alerts}
            transfers={commandCenter.transfer_recommendations}
          />

          {/* AI Recommended Transfers Dispatch Board */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-sans">
                    Recommended Inter-Facility Transshipments
                  </h3>
                  <p className="text-xs text-gray-500">
                    Engine 4 MILP optimized routing with FEFO priority
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("optimization")}
                className="text-xs font-semibold text-crimson-700 hover:text-crimson-800 hover:underline flex items-center gap-1"
              >
                <span>View All {commandCenter.transfer_recommendations.length} Transfers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {commandCenter.transfer_recommendations.slice(0, 3).map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-xs font-bold text-cyan-700 border border-gray-200 shadow-2xs flex-shrink-0">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                        <span>{t.source_name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-blue-700">{t.destination_name}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {t.units} units {t.recipient_blood_group} {t.component}
                        </span>
                        <span>•</span>
                        <span>ETA: {t.travel_time_minutes} min ({t.distance_km} km)</span>
                        {t.is_fefo_priority && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            FEFO Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => onSelectHospital(t.destination)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 transition shadow-2xs"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onApproveTransfer && onApproveTransfer(t)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition active:scale-95"
                    >
                      Approve Dispatch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Shortage Alerts Feed */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 flex flex-col h-full shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-crimson-50 text-crimson-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 font-sans">
                  Live Shortage Alerts Feed
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-crimson-50 text-crimson-700 border border-crimson-200">
                {criticalAlerts.length} Critical
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-3.5">
              Model 2 early warning probabilities across all 30 facility nodes:
            </p>

            <div className="space-y-2.5 overflow-y-auto max-h-[720px] pr-1">
              {commandCenter.shortage_alerts.slice(0, 9).map((alert, idx) => {
                const isCrit = alert.risk_level === "CRITICAL";
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectHospital(alert.hospital_id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-xs ${
                      isCrit
                        ? "bg-rose-50/60 border-rose-200/90 hover:bg-rose-50 hover:border-rose-300"
                        : "bg-amber-50/60 border-amber-200/90 hover:bg-amber-50 hover:border-amber-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-gray-900 truncate max-w-[170px]">
                        {alert.hospital_name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isCrit
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {alert.risk_level} • {(alert.shortage_probability * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                      <span className="font-bold text-crimson-700 bg-white px-2 py-0.5 rounded-md border border-gray-200/80">
                        {alert.blood_group} {alert.component}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Stock: <strong className="text-gray-900">{alert.current_stock_units}</strong> | Req:{" "}
                        <strong className="text-blue-700">{alert.forecast_demand_units.toFixed(1)}</strong>
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Horizon: {commandCenter.horizon}h</span>
                      <span className="text-crimson-700 font-semibold hover:underline flex items-center gap-0.5">
                        Inspect Node &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
