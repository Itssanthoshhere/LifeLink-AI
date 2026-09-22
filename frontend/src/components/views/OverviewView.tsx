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
  HelpCircle
} from "lucide-react";
import {
  CommandCenterPayload,
  NetworkPayload,
  ShortageAlert,
  TransferRecommendation
} from "@/types/commandCenter";
import { NetworkMap } from "@/components/NetworkMap";
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
      title: "CRITICAL SHORTAGES",
      value: metrics.critical_shortages_before,
      unit: "alerts",
      context: "High-priority clinical deficits",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      icon: AlertTriangle
    },
    {
      title: "HIGH-RISK HOSPITALS",
      value: highRiskCount,
      unit: "/ 30 facilities",
      context: "At risk of stock exhaustion",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      icon: Building2
    },
    {
      title: "AVAILABLE INVENTORY",
      value: "9,410",
      unit: "units",
      context: "Across 40 network nodes",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      icon: Package
    },
    {
      title: "RECOMMENDED TRANSFERS",
      value: metrics.total_units_transferred,
      unit: "units",
      context: `${commandCenter.transfer_recommendations.length} dispatch orders planned`,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      icon: Truck
    },
    {
      title: "DONOR MOBILIZATIONS",
      value: metrics.total_donor_units_mobilized,
      unit: "units",
      context: "From Model 3 top-tier candidates",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      icon: Users
    },
    {
      title: "UNITS AT EXPIRY RISK",
      value: metrics.fefo_expiring_units_rescued,
      unit: "units rescued",
      context: "Prioritized via FEFO transshipment",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      icon: Clock
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Network Operations</h2>
        <p className="text-xs text-ops-dim">
          AI-assisted blood supply monitoring, predictive shortage mitigation, and MILP transshipment dispatch
        </p>
      </div>

      {/* Intelligence Pipeline Story Banner */}
      <IntelligenceChain data={commandCenter} onNavigate={onNavigate} />

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`p-3 rounded border ${kpi.border} ${kpi.bg} bg-ops-card/90 backdrop-blur flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-semibold text-ops-dim tracking-wider uppercase">
                  {kpi.title}
                </span>
                <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`text-xl font-bold font-mono tracking-tight ${kpi.color}`}>
                    {kpi.value}
                  </span>
                  <span className="text-[10px] text-ops-muted font-mono">{kpi.unit}</span>
                </div>
                <div className="text-[10px] text-ops-dim mt-1 truncate">{kpi.context}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Geospatial Map + Live Alert Feed & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Central Operations Map (2 columns wide on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-ops-card rounded border border-ops-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                  Regional Blood Supply Network Map
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {(metrics?.emergency_protection_rate_pct ?? 100).toFixed(0)}% Emergency Protected
                </span>
              </div>
              <span className="text-[11px] font-mono text-ops-dim">
                Click any hospital node to open deep-dive intelligence
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

          {/* AI Recommended Transfers Dispatch Board */}
          <div className="bg-ops-card rounded border border-ops-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-ops-cyan" />
                <span className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                  Engine 4 Recommended Inter-Facility Transshipments
                </span>
              </div>
              <button
                onClick={() => onNavigate("optimization")}
                className="text-xs font-mono text-ops-cyan hover:underline flex items-center gap-1"
              >
                <span>View All {commandCenter.transfer_recommendations.length} Transfers</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {commandCenter.transfer_recommendations.slice(0, 3).map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded bg-ops-panel/80 border border-ops-border flex items-center justify-between hover:border-ops-blue transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-ops-card flex items-center justify-center font-mono text-xs font-bold text-ops-cyan border border-ops-border">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{t.source_name}</span>
                        <ArrowRight className="w-3 h-3 text-ops-dim" />
                        <span className="text-ops-blue">{t.destination_name}</span>
                      </div>
                      <div className="text-[11px] text-ops-muted mt-0.5 flex items-center gap-3 font-mono">
                        <span className="text-emerald-400 font-bold">
                          {t.units} units {t.recipient_blood_group} {t.component}
                        </span>
                        <span>•</span>
                        <span>ETA: {t.travel_time_minutes} min ({t.distance_km} km)</span>
                        {t.is_fefo_priority && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            FEFO PRIORITY
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSelectHospital(t.destination)}
                      className="px-2.5 py-1 rounded bg-ops-card hover:bg-ops-cardHover border border-ops-border text-[11px] font-mono text-ops-text transition"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onApproveTransfer && onApproveTransfer(t)}
                      className="px-3 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-mono font-semibold transition"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Shortage Alerts Feed */}
        <div className="space-y-4">
          <div className="bg-ops-card rounded border border-ops-border p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-ops-crimson" />
                <span className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                  Live Shortage Alerts Feed
                </span>
              </div>
              <span className="text-[10px] font-mono text-red-400 font-bold">
                {criticalAlerts.length} CRITICAL
              </span>
            </div>

            <p className="text-[11px] text-ops-dim mb-3">
              Model 2 early warning risk probabilities across all 30 hospital nodes:
            </p>

            <div className="space-y-2 overflow-y-auto max-h-[720px] pr-1">
              {commandCenter.shortage_alerts.slice(0, 9).map((alert, idx) => {
                const isCrit = alert.risk_level === "CRITICAL";
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectHospital(alert.hospital_id)}
                    className={`p-3 rounded border cursor-pointer transition ${
                      isCrit
                        ? "bg-red-950/20 border-red-500/40 hover:border-red-400"
                        : "bg-amber-950/20 border-amber-500/30 hover:border-amber-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white truncate max-w-[170px]">
                        {alert.hospital_name}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isCrit
                            ? "bg-red-500/20 text-red-400 border border-red-500/40"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        }`}
                      >
                        {alert.risk_level} • {(alert.shortage_probability * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-ops-muted mt-1.5">
                      <span className="text-ops-cyan font-bold">
                        {alert.blood_group} {alert.component}
                      </span>
                      <span className="text-ops-dim">
                        Stock: <strong className="text-white">{alert.current_stock_units}</strong> | Req:{" "}
                        <strong className="text-ops-blue">{alert.forecast_demand_units.toFixed(1)}</strong>
                      </span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-ops-border/60 flex items-center justify-between text-[10px] font-mono text-ops-dim">
                      <span>Horizon: {commandCenter.horizon}h</span>
                      <span className="text-ops-blue hover:underline flex items-center gap-0.5">
                        Inspect &rarr;
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
