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

import {
  CommandCenterPayload,
  NetworkPayload,
  InventoryPayload,
  HospitalIntelligence
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

export default function CommandCenterPage() {
  const [currentView, setCurrentView] = useState<NavView>("overview");
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
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [hospitalDetail, setHospitalDetail] = useState<HospitalIntelligence | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Notification / Action Banner
  const [approvedNotification, setApprovedNotification] = useState<string | null>(null);

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

  // Open Hospital Intelligence Drawer
  const handleSelectHospital = async (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setIsDrawerOpen(true);
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
    setCurrentView("overview");
    setTimeout(() => {
      handleSelectHospital("HOSP_007");
    }, 400);
  };

  // Transfer approval simulation
  const handleApproveTransfer = (transfer: any) => {
    setApprovedNotification(
      `Transfer #${transfer.route_id} (${transfer.units} units ${transfer.recipient_blood_group} ${transfer.component} -> ${transfer.destination_name}) approved for dispatch.`
    );
    setTimeout(() => setApprovedNotification(null), 5000);
  };

  const criticalCount = commandCenter.shortage_alerts.filter(
    (a) => a.risk_level === "CRITICAL"
  ).length;

  return (
    <div className="flex h-screen bg-ops-bg text-ops-text overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        criticalAlertsCount={criticalCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
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
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 text-xs font-mono text-emerald-300 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <span>✓ DISPATCH CONFIRMED: {approvedNotification}</span>
            <button
              onClick={() => setApprovedNotification(null)}
              className="text-emerald-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentView === "overview" && (
            <OverviewView
              commandCenter={commandCenter}
              network={network}
              onSelectHospital={handleSelectHospital}
              onNavigate={setCurrentView}
              onApproveTransfer={handleApproveTransfer}
              selectedHospitalId={selectedHospitalId}
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

          {/* Mandatory Clinical Disclaimer Footer */}
          <footer className="pt-8 pb-4 border-t border-ops-border text-center text-[10px] text-ops-dim font-mono space-y-1">
            <p>
              AI BLOOD SUPPLY COMMAND CENTER — DECISION SUPPORT LOGISTICS PROTOTYPE
            </p>
            <p>
              Outputs are operational logistical recommendations only and require qualified human/blood-bank review before real-world action.
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
    </div>
  );
}
