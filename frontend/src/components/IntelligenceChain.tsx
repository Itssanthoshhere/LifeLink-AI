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
      name: "Demand Forecast",
      subtitle: "Model 1 • Temporal Forecaster",
      question: "What will facilities need?",
      metric: `${data.network_metrics.total_shortage_units_before.toFixed(0)} units`,
      metricLabel: "Projected 72h Deficit",
      icon: TrendingUp,
      color: "text-blue-600",
      border: "border-blue-200/80",
      bg: "bg-blue-50/50 hover:bg-blue-50/80",
      badgeBg: "bg-blue-100 text-blue-800",
      tab: "inventory"
    },
    {
      id: "risk",
      number: "02",
      name: "Shortage Risk",
      subtitle: "Model 2 • Risk Predictor",
      question: "Where will critical deficits hit?",
      metric: `${data.network_metrics.critical_shortages_before} Critical`,
      metricLabel: `${data.network_metrics.total_shortages_before} High-Risk Tiers`,
      icon: AlertTriangle,
      color: "text-crimson-600",
      border: "border-crimson-200/80",
      bg: "bg-crimson-50/40 hover:bg-crimson-50/70",
      badgeBg: "bg-crimson-100 text-crimson-800",
      tab: "shortages"
    },
    {
      id: "donors",
      number: "03",
      name: "Donor Mobilization",
      subtitle: "Model 3 • Candidate Ranker",
      question: "Who is eligible & near?",
      metric: `${data.network_metrics.total_donor_units_mobilized} Units`,
      metricLabel: "Targeted Mobilizations",
      icon: Users,
      color: "text-purple-600",
      border: "border-purple-200/80",
      bg: "bg-purple-50/50 hover:bg-purple-50/80",
      badgeBg: "bg-purple-100 text-purple-800",
      tab: "donors"
    },
    {
      id: "optimization",
      number: "04",
      name: "MILP Transshipment",
      subtitle: "Engine 4 • Multi-Echelon Routing",
      question: "How should supplies transfer?",
      metric: `${data.network_metrics.total_units_transferred} Units`,
      metricLabel: `${data.network_metrics.fefo_expiring_units_rescued} FEFO Rescued`,
      icon: Cpu,
      color: "text-cyan-600",
      border: "border-cyan-200/80",
      bg: "bg-cyan-50/50 hover:bg-cyan-50/80",
      badgeBg: "bg-cyan-100 text-cyan-800",
      tab: "optimization"
    },
    {
      id: "action",
      number: "05",
      name: "Dispatch Action",
      subtitle: "Command Center Verification",
      question: "Executing clinical protection",
      metric: `${data.network_metrics.emergency_protection_rate_pct.toFixed(0)}%`,
      metricLabel: "Emergency Demand Protected",
      icon: ShieldCheck,
      color: "text-emerald-600",
      border: "border-emerald-200/80",
      bg: "bg-emerald-50/50 hover:bg-emerald-50/80",
      badgeBg: "bg-emerald-100 text-emerald-800",
      tab: "overview"
    }
  ];

  return (
    <div className="bg-white/95 border border-gray-200/80 rounded-2xl p-4 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-crimson-700 bg-crimson-50 px-2.5 py-0.5 rounded-full border border-crimson-200/60 font-sans">
            Automated Intelligence Pipeline
          </span>
          <span className="text-xs text-gray-500 hidden sm:inline">
            End-to-end multi-echelon predictive reasoning pipeline
          </span>
        </div>
        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>Solver Latency:</span>
          <strong className="text-gray-800">{data.solve_time_seconds.toFixed(2)}s</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              onClick={() => onNavigate(step.tab)}
              className={`p-3.5 rounded-xl border ${step.border} ${step.bg} transition-all duration-200 cursor-pointer relative group flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${step.badgeBg}`}>
                    {step.number}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-white shadow-2xs ${step.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-900 tracking-tight">{step.name}</div>
                <div className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">
                  &ldquo;{step.question}&rdquo;
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-200/60">
                <div className={`text-base font-extrabold font-sans ${step.color}`}>
                  {step.metric}
                </div>
                <div className="text-[10px] text-gray-500 font-medium truncate">
                  {step.metricLabel}
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-white border border-gray-200 items-center justify-center text-gray-400 shadow-2xs">
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
