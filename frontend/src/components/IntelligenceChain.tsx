"use client";

import React from "react";
import { ArrowRight, TrendingUp, AlertTriangle, Users, Cpu, ShieldCheck } from "lucide-react";
import { CommandCenterPayload } from "@/types/commandCenter";

interface IntelligenceChainProps {
  data: CommandCenterPayload;
  onNavigate: (tab: any) => void;
}

export const IntelligenceChain: React.FC<IntelligenceChainProps> = ({ data, onNavigate }) => {
  const steps = [
    {
      id: "demand",
      number: "01",
      name: "DEMAND",
      subtitle: "Model 1 — Demand Forecast",
      question: "What will we need?",
      metric: `${data.network_metrics.total_shortage_units_before.toFixed(0)} units`,
      metricLabel: "Projected 72h Deficit",
      icon: TrendingUp,
      color: "text-blue-400",
      border: "border-blue-500/30",
      bg: "bg-blue-950/20",
      tab: "inventory"
    },
    {
      id: "risk",
      number: "02",
      name: "RISK",
      subtitle: "Model 2 — Shortage Predictor",
      question: "Where will shortages occur?",
      metric: `${data.network_metrics.critical_shortages_before} Critical`,
      metricLabel: `${data.network_metrics.total_shortages_before} High-Risk Tiers`,
      icon: AlertTriangle,
      color: "text-red-400",
      border: "border-red-500/30",
      bg: "bg-red-950/20",
      tab: "shortages"
    },
    {
      id: "donors",
      number: "03",
      name: "DONORS",
      subtitle: "Model 3 — Donor Ranker",
      question: "Who can potentially help?",
      metric: `${data.network_metrics.total_donor_units_mobilized} Units`,
      metricLabel: "Ranked Candidate Mobilization",
      icon: Users,
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-950/20",
      tab: "donors"
    },
    {
      id: "optimization",
      number: "04",
      name: "OPTIMIZATION",
      subtitle: "Engine 4 — MILP Transshipment",
      question: "Where should inventory move?",
      metric: `${data.network_metrics.total_units_transferred} Units`,
      metricLabel: `${data.network_metrics.fefo_expiring_units_rescued} FEFO Rescued`,
      icon: Cpu,
      color: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-950/20",
      tab: "optimization"
    },
    {
      id: "action",
      number: "05",
      name: "ACTION",
      subtitle: "Command Center Dispatch",
      question: "What should we execute?",
      metric: `${data.network_metrics.emergency_protection_rate_pct.toFixed(0)}%`,
      metricLabel: "Emergency Demand Protected",
      icon: ShieldCheck,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-950/20",
      tab: "overview"
    }
  ];

  return (
    <div className="bg-ops-card/80 border border-ops-border rounded p-3.5 mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ops-cyan font-bold">
            END-TO-END INTELLIGENCE PIPELINE
          </span>
          <span className="text-[11px] text-ops-dim">
            Unified multi-stage automated reasoning sequence
          </span>
        </div>
        <span className="text-[10px] font-mono text-ops-dim">
          SOLVER LATENCY: {data.solve_time_seconds.toFixed(2)}s
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              onClick={() => onNavigate(step.tab)}
              className={`p-3 rounded border ${step.border} ${step.bg} hover:border-ops-blue transition cursor-pointer relative group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-ops-dim">{step.number}</span>
                  <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                </div>
                <div className="text-xs font-bold text-white tracking-wide">{step.name}</div>
                <div className="text-[10px] text-ops-muted italic mb-1.5">&ldquo;{step.question}&rdquo;</div>
              </div>

              <div className="mt-2 pt-2 border-t border-ops-border/60">
                <div className={`text-sm font-bold font-mono ${step.color}`}>{step.metric}</div>
                <div className="text-[9px] text-ops-dim">{step.metricLabel}</div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-ops-panel border border-ops-border items-center justify-center text-ops-dim shadow">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
