"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  Package,
  Share2,
  Users,
  Zap,
  Sliders,
  BarChart3,
  ShieldAlert,
  CheckCircle2,
  Layers
} from "lucide-react";

export type NavView =
  | "overview"
  | "shortages"
  | "inventory"
  | "network"
  | "donors"
  | "optimization"
  | "scenarios"
  | "analytics";

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  criticalAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  criticalAlertsCount
}) => {
  const navItems: { id: NavView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "shortages", label: "Shortage Alerts", icon: AlertTriangle, badge: criticalAlertsCount },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "network", label: "Network", icon: Share2 },
    { id: "donors", label: "Donor Dispatch", icon: Users },
    { id: "optimization", label: "Optimization", icon: Zap },
    { id: "scenarios", label: "Scenarios", icon: Sliders },
    { id: "analytics", label: "Analytics", icon: BarChart3 }
  ];

  return (
    <aside className="w-64 bg-ops-panel border-r border-ops-border flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div>
        {/* Logo and Brand */}
        <div className="p-4 border-b border-ops-border">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border border-red-500/30 shadow-sm shadow-red-900/50">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider text-red-400 uppercase">
                AI Blood Supply
              </div>
              <div className="text-sm font-bold tracking-tight text-ops-text">
                COMMAND CENTER
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-ops-dim font-mono flex items-center gap-1">
            <span>CORE INTELLIGENCE v4.0</span>
            <span className="text-emerald-400">● ONLINE</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all ${
                  isActive
                    ? "bg-ops-card text-white border-l-2 border-ops-blue font-semibold shadow-sm"
                    : "text-ops-muted hover:bg-ops-cardHover hover:text-ops-text"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-ops-blue" : "text-ops-dim"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operational Status Footer */}
      <div className="p-3 border-t border-ops-border bg-ops-bg/60">
        <div className="p-2.5 rounded bg-ops-card border border-ops-border text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-ops-dim uppercase">System Status</span>
            <span className="flex items-center text-[10px] text-emerald-400 font-mono font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1 inline" /> READY
            </span>
          </div>
          <div className="text-[11px] text-ops-muted">All 4 Engines Active</div>
          <div className="text-[9px] text-ops-dim mt-1 line-clamp-2">
            Models 1–3 + Engine 4 MILP transshipment operational.
          </div>
        </div>

        <div className="mt-2 text-[9px] text-ops-dim text-center px-1">
          DECISION SUPPORT PROTOTYPE
        </div>
      </div>
    </aside>
  );
};
