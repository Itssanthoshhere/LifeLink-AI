"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search,
  Command,
  Building2,
  Droplets,
  AlertTriangle,
  ArrowRight,
  Activity,
  Package,
  Share2,
  Users,
  Zap,
  Sliders,
  BarChart3,
  X,
  CornerDownLeft
} from "lucide-react";
import { HospitalNode, BloodBankNode, ShortageAlert } from "@/types/commandCenter";
import { NavView } from "@/components/Sidebar";

interface CommandPaletteProps {
  hospitals: HospitalNode[];
  bloodBanks: BloodBankNode[];
  shortageAlerts: ShortageAlert[];
  onSelectHospital: (id: string) => void;
  onNavigate: (view: NavView) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  type: "hospital" | "blood_bank" | "alert" | "nav";
  title: string;
  subtitle: string;
  icon: React.ElementType;
  severity?: "critical" | "high" | "nominal";
  action: () => void;
}

const NAV_ITEMS: { id: NavView; label: string; icon: React.ElementType; description: string }[] = [
  { id: "overview", label: "Overview Dashboard", icon: Activity, description: "Network operations overview" },
  { id: "shortages", label: "Shortage Alerts", icon: AlertTriangle, description: "Live shortage monitoring" },
  { id: "inventory", label: "Inventory View", icon: Package, description: "Facility-level stock analysis" },
  { id: "network", label: "Network Topology", icon: Share2, description: "Route and node analysis" },
  { id: "donors", label: "Donor Dispatch", icon: Users, description: "Donor mobilization campaigns" },
  { id: "optimization", label: "Optimization Engine", icon: Zap, description: "MILP solver results & explanations" },
  { id: "scenarios", label: "Scenario Planner", icon: Sliders, description: "What-if operational scenarios" },
  { id: "analytics", label: "Analytics & Reports", icon: BarChart3, description: "Performance analytics" },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  hospitals,
  bloodBanks,
  shortageAlerts,
  onSelectHospital,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items
  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];

    // Navigation items
    NAV_ITEMS.forEach((nav) => {
      items.push({
        id: `nav-${nav.id}`,
        type: "nav",
        title: nav.label,
        subtitle: nav.description,
        icon: nav.icon,
        action: () => { onNavigate(nav.id); onClose(); }
      });
    });

    // Hospital nodes
    hospitals.forEach((h) => {
      const isCrit = h.risk_level === "CRITICAL";
      const isHigh = h.risk_level === "HIGH";
      items.push({
        id: h.id,
        type: "hospital",
        title: h.name,
        subtitle: `${h.id} • ${h.hospital_type} • ${h.bed_capacity} beds • ${h.risk_level}`,
        icon: Building2,
        severity: isCrit ? "critical" : isHigh ? "high" : "nominal",
        action: () => { onSelectHospital(h.id); onClose(); }
      });
    });

    // Blood banks
    bloodBanks.forEach((b) => {
      items.push({
        id: b.id,
        type: "blood_bank",
        title: b.name,
        subtitle: `${b.id} • Capacity: ${b.storage_capacity} units • ${b.status}`,
        icon: Droplets,
        severity: b.status !== "Operational" ? "critical" : "nominal",
        action: () => { onClose(); }
      });
    });

    // Shortage alerts as searchable items
    shortageAlerts.slice(0, 15).forEach((a, idx) => {
      items.push({
        id: `alert-${a.hospital_id}-${a.blood_group}-${idx}`,
        type: "alert",
        title: `${a.hospital_name} — ${a.blood_group} ${a.component}`,
        subtitle: `${(a.shortage_probability * 100).toFixed(0)}% shortage probability • Stock: ${a.current_stock_units} units`,
        icon: AlertTriangle,
        severity: a.risk_level === "CRITICAL" ? "critical" : "high",
        action: () => { onSelectHospital(a.hospital_id); onClose(); }
      });
    });

    return items;
  }, [hospitals, bloodBanks, shortageAlerts, onSelectHospital, onNavigate, onClose]);

  // Filter based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups: { label: string; items: PaletteItem[] }[] = [];
    const navItems = filteredItems.filter((i) => i.type === "nav");
    const hospitalItems = filteredItems.filter((i) => i.type === "hospital");
    const bankItems = filteredItems.filter((i) => i.type === "blood_bank");
    const alertItems = filteredItems.filter((i) => i.type === "alert");

    if (navItems.length > 0) groups.push({ label: "Navigation", items: navItems });
    if (alertItems.length > 0) groups.push({ label: "Active Alerts", items: alertItems.slice(0, 5) });
    if (hospitalItems.length > 0) groups.push({ label: "Hospitals", items: hospitalItems.slice(0, 8) });
    if (bankItems.length > 0) groups.push({ label: "Blood Banks", items: bankItems.slice(0, 5) });

    return groups;
  }, [filteredItems]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(
    () => groupedItems.flatMap((g) => g.items),
    [groupedItems]
  );

  // Clamp selected index
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && flatItems[selectedIndex]) {
        e.preventDefault();
        flatItems[selectedIndex].action();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [flatItems, selectedIndex, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIdx = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-[620px] bg-white rounded-2xl border border-gray-200 shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-100">
            <Search className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search hospitals, blood banks, alerts, or navigate…"
              className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none font-sans"
            />
            <div className="flex items-center gap-1.5 ml-2">
              <kbd className="px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-mono text-gray-500 font-medium">
                ESC
              </kbd>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[380px] overflow-y-auto py-2">
            {groupedItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-gray-400 mt-1">Try a hospital name, ID, or blood group</p>
              </div>
            ) : (
              groupedItems.map((group) => (
                <div key={group.label} className="mb-1">
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    flatIdx++;
                    const isSelected = flatIdx === selectedIndex;
                    const Icon = item.icon;
                    const currentIdx = flatIdx;

                    return (
                      <button
                        key={item.id}
                        data-index={currentIdx}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentIdx)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left ${
                          isSelected ? "bg-crimson-50/60" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg flex-shrink-0 ${
                              item.severity === "critical"
                                ? "bg-rose-50 text-rose-600"
                                : item.severity === "high"
                                ? "bg-amber-50 text-amber-600"
                                : item.type === "nav"
                                ? "bg-violet-50 text-violet-600"
                                : item.type === "blood_bank"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <span className="text-[10px] text-crimson-600 font-medium">Open</span>
                            <CornerDownLeft className="w-3 h-3 text-crimson-500" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">esc</kbd>
                Close
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>K to toggle</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
