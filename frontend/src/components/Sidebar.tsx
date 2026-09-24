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
  CheckCircle2,
  Droplets,
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
  criticalAlertsCount,
}) => {
  const navItems: {
    id: NavView;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    {
      id: "shortages",
      label: "Shortage Alerts",
      icon: AlertTriangle,
      badge: criticalAlertsCount,
    },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "network", label: "Network", icon: Share2 },
    { id: "donors", label: "Donor Dispatch", icon: Users },
    { id: "optimization", label: "Optimization", icon: Zap },
    { id: "scenarios", label: "Scenarios", icon: Sliders },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <aside className="w-[260px] bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div>
        {/* Logo and Brand */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200/90 flex items-center justify-center shadow-xs overflow-hidden p-1 flex-shrink-0">
              <img
                src="/logo.png?v=2"
                alt="LifeLink AI Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-charcoal">
                LifeLink AI
              </div>
              <div className="text-[11px] text-muted font-medium">
                Blood Supply Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold text-muted uppercase tracking-wider">
            Command Center
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "nav-active font-semibold"
                    : "text-muted-foreground hover:bg-gray-50 hover:text-charcoal"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-[18px] h-[18px] ${
                      isActive ? "text-primary" : "text-gray-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ll-badge ll-badge-critical text-[10px] px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operational Status Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="ll-card-sm p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              System Status
            </span>
            <span className="ll-badge ll-badge-live text-[10px] px-2 py-0.5">
              <CheckCircle2 className="w-3 h-3" /> Online
            </span>
          </div>
          <div className="text-[12px] font-medium text-charcoal">
            All 4 Engines Active
          </div>
          <div className="text-[10px] text-muted leading-relaxed">
            Models 1–3 + MILP transshipment solver operational.
          </div>
        </div>

        <div className="mt-2 text-[9px] text-gray-400 text-center tracking-wide uppercase font-medium">
          Decision Support Prototype
        </div>
      </div>
    </aside>
  );
};
