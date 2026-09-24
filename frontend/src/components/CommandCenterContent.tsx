"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavView } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { HospitalDrawer } from "@/components/HospitalDrawer";
import { OverviewView } from "@/components/views/OverviewView";
import { ShortagesView } from "@/components/views/ShortagesView";
import { InventoryView } from "@/components/views/InventoryView";
import { NetworkView } from "@/components/views/NetworkView";
import { DonorsView } from "@/components/views/DonorsView";
import { OptimizationView } from "@/components/views/OptimizationView";
import { ScenariosView } from "@/components/views/ScenariosView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { CommandPalette } from "@/components/CommandPalette";
import { DispatchManifest } from "@/components/DispatchManifest";
import { DecisionExplainerModal } from "@/components/DecisionExplainerModal";

import {
  CommandCenterPayload,
  NetworkPayload,
  InventoryPayload,
  HospitalIntelligence,
  TransferRecommendation
} from "@/types/commandCenter";
import {
  fetchCommandCenter,
  fetchNetwork,
  fetchInventory,
  fetchHospitalIntelligence
} from "@/lib/apiClient";
import {
  MOCK_COMMAND_CENTER,
  MOCK_NETWORK,
  MOCK_INVENTORY,
  MOCK_HOSPITAL_INTELLIGENCE
} from "@/lib/mockData";
import { CheckCircle2, ShieldCheck, X, FileDown } from "lucide-react";

export interface CommandCenterPageProps {
  initialView?: NavView;
  initialFacilityId?: string;
  initialOpenManifest?: boolean;
}

export function CommandCenterContent({
  initialView = "overview",
  initialFacilityId,
  initialOpenManifest = false
}: CommandCenterPageProps) {
  const [currentView, setCurrentView] = useState<NavView>(initialView);
  const [selectedDate, setSelectedDate] = useState<string>("2025-12-01");
  const [horizon, setHorizon] = useState<number>(72);
  const [scenario, setScenario] = useState<string>("normal");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  // Core Data States initialized with reliable schema
  const [commandCenter, setCommandCenter] = useState<CommandCenterPayload>(MOCK_COMMAND_CENTER);
  const [network, setNetwork] = useState<NetworkPayload>(MOCK_NETWORK);
  const [inventory, setInventory] = useState<InventoryPayload>(MOCK_INVENTORY);

  // Hospital Drawer State
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(initialFacilityId || null);
  const [hospitalDetail, setHospitalDetail] = useState<HospitalIntelligence | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(!!initialFacilityId);

  // Notification / Action Banner
  const [approvedNotification, setApprovedNotification] = useState<string | null>(null);

  // Command Palette State (⌘K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Dispatch Manifest Modal State
  const [isManifestOpen, setIsManifestOpen] = useState(initialOpenManifest);

  // Decision Explainer Modal State
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [explainerTransfer, setExplainerTransfer] = useState<TransferRecommendation | null>(null);

  const handleOpenExplainer = useCallback((transfer: TransferRecommendation) => {
    setExplainerTransfer(transfer);
    setIsExplainerOpen(true);
  }, []);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Master Data Refresh Function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ccRes, netRes, invRes] = await Promise.all([
        fetchCommandCenter(selectedDate, horizon, scenario),
        fetchNetwork(scenario),
        fetchInventory(horizon, scenario)
      ]);

      setCommandCenter(ccRes.data);
      setNetwork(netRes.data);
      setInventory(invRes.data);
      setIsLiveBackend(ccRes.isLive);
    } catch (err) {
      console.warn("Using fallback data due to fetch error:", err);
      setIsLiveBackend(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, horizon, scenario]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectView = useCallback((view: NavView) => {
    setCurrentView(view);
    if (typeof window !== "undefined" && window.history) {
      window.history.pushState({}, "", `/${view}`);
    }
  }, []);

  // Open Hospital Intelligence Drawer
  const handleSelectHospital = async (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setIsDrawerOpen(true);
    if (typeof window !== "undefined" && window.history) {
      window.history.pushState({}, "", `/facility/${hospitalId}`);
    }
    try {
      const res = await fetchHospitalIntelligence(hospitalId, selectedDate, horizon, scenario);
      setHospitalDetail(res.data);
    } catch {
      setHospitalDetail({ ...MOCK_HOSPITAL_INTELLIGENCE, hospital_id: hospitalId });
    }
  };

  // One-Click DEMO MODE
  const handleLaunchDemo = () => {
    setScenario("mass_casualty");
    setHorizon(72);
    handleSelectView("overview");
    setTimeout(() => {
      handleSelectHospital("HOSP_007");
    }, 400);
  };

  // Transfer approval simulation
  const handleApproveTransfer = (transfer: any) => {
    setApprovedNotification(
      `Transfer #${transfer.route_id} (${transfer.units} units ${transfer.recipient_blood_group} ${transfer.component} → ${transfer.destination_name}) approved for immediate dispatch.`
    );
    setTimeout(() => setApprovedNotification(null), 5000);
  };

  const criticalCount = commandCenter.shortage_alerts.filter(
    (a) => a.risk_level === "CRITICAL"
  ).length;

  return (
    <div className="flex h-screen bg-[#faf9f7] text-gray-900 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        criticalAlertsCount={criticalCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#faf9f7]">
        {/* Top Header */}
        <Header
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          horizon={horizon}
          onHorizonChange={setHorizon}
          selectedScenario={scenario}
          onScenarioChange={setScenario}
          onRefresh={loadData}
          onLaunchDemo={handleLaunchDemo}
          isLoading={isLoading}
          isLiveBackend={isLiveBackend}
        />

        {/* Action / Notification Banner */}
        {approvedNotification && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold text-emerald-950">Dispatch Confirmed:</span>
              <span className="text-emerald-800">{approvedNotification}</span>
            </div>
            <button
              onClick={() => setApprovedNotification(null)}
              className="text-emerald-600 hover:text-emerald-900 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View Switcher Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentView === "overview" && (
            <OverviewView
              commandCenter={commandCenter}
              network={network}
              onSelectHospital={handleSelectHospital}
              onNavigate={handleSelectView}
              onApproveTransfer={handleApproveTransfer}
              onOpenManifest={() => setIsManifestOpen(true)}
            />
          )}

          {currentView === "shortages" && (
            <ShortagesView
              alerts={commandCenter.shortage_alerts}
              onSelectHospital={handleSelectHospital}
            />
          )}

          {currentView === "inventory" && <InventoryView inventory={inventory} />}

          {currentView === "network" && <NetworkView network={network} />}

          {currentView === "donors" && (
            <DonorsView
              donorRecommendations={commandCenter.donor_recommendations}
              onSelectHospital={handleSelectHospital}
            />
          )}

          {currentView === "optimization" && (
            <OptimizationView
              commandCenter={commandCenter}
              onSelectHospital={handleSelectHospital}
              onOpenExplainer={handleOpenExplainer}
            />
          )}

          {currentView === "scenarios" && (
            <ScenariosView
              currentScenario={scenario}
              onSelectScenario={(s) => {
                setScenario(s);
              }}
              isLoading={isLoading}
            />
          )}

          {currentView === "analytics" && <AnalyticsView />}

          {/* Clinical Disclaimer Footer */}
          <footer className="pt-8 pb-4 border-t border-gray-200/80 text-center text-xs text-gray-400 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-gray-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-crimson-600" />
              <span>LifeLink AI — Clinical Decision Support & Logistics Intelligence</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Outputs are operational logistical recommendations and require qualified healthcare and blood-bank professional verification prior to execution.
            </p>
          </footer>
        </main>
      </div>

      {/* Hospital Intelligence Detail Slide-over Drawer */}
      <HospitalDrawer
        hospital={hospitalDetail}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        hospitals={network.nodes.hospitals}
        bloodBanks={network.nodes.blood_banks}
        shortageAlerts={commandCenter.shortage_alerts}
        onSelectHospital={handleSelectHospital}
        onNavigate={handleSelectView}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Dispatch Manifest Export Modal */}
      <DispatchManifest
        commandCenter={commandCenter}
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
      />

      {/* AI Decision Explainer & MILP Audit Modal */}
      <DecisionExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        transfer={explainerTransfer}
        commandCenter={commandCenter}
        onSelectHospital={handleSelectHospital}
      />
    </div>
  );
}
