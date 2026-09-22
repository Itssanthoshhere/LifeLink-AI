"use client";

import React, { useState } from "react";
import { Users, AlertCircle, Phone, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import { DonorRecommendation } from "@/types/commandCenter";

interface DonorsViewProps {
  donorRecommendations: DonorRecommendation[];
  onSelectHospital: (id: string) => void;
}

export const DonorsView: React.FC<DonorsViewProps> = ({
  donorRecommendations,
  onSelectHospital
}) => {
  const [selectedAlertIdx, setSelectedAlertIdx] = useState<number>(0);
  const activeAlert = donorRecommendations[selectedAlertIdx] || donorRecommendations[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Intelligent Donor Dispatch & Mobilization
        </h2>
        <p className="text-xs text-ops-dim">
          Model 3 Multi-Criteria Decision Analysis (MCDA) ranking for targeted donor outreach during predicted shortages
        </p>
      </div>

      {/* Top Section: Active Donor Mobilization Sessions */}
      <div className="bg-ops-card border border-ops-border rounded overflow-hidden">
        <div className="p-3 bg-ops-panel border-b border-ops-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Active Donor Mobilization Sessions ({donorRecommendations.length} shortage targets)
            </span>
          </div>
          <span className="text-[10px] font-mono text-ops-dim">
            Model 3 MCDA Scoring • ABO/Rh Compatibility
          </span>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-ops-card text-[10px] text-ops-dim uppercase border-b border-ops-border">
            <tr>
              <th className="p-3">Target Hospital</th>
              <th className="p-3">Required Product</th>
              <th className="p-3 text-center">Urgency Tier</th>
              <th className="p-3 text-right">Eligible Candidate Pool</th>
              <th className="p-3 text-right">Expected Top-5 Yield</th>
              <th className="p-3 text-right">Select Session</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-border">
            {donorRecommendations.map((d, idx) => {
              const isSelected = idx === selectedAlertIdx;
              const isCrit = d.priority_tier === "CRITICAL";
              return (
                <tr
                  key={idx}
                  onClick={() => setSelectedAlertIdx(idx)}
                  className={`cursor-pointer transition ${
                    isSelected ? "bg-purple-950/20 border-l-2 border-purple-500" : "hover:bg-ops-cardHover/60"
                  }`}
                >
                  <td className="p-3 font-sans font-bold text-white">
                    <div>{d.hospital_name}</div>
                    <div className="text-[10px] font-mono text-ops-dim">{d.hospital_id}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-ops-cyan">{d.blood_group}</span>{" "}
                    <span className="text-ops-muted">{d.component}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCrit
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {d.priority_tier}
                    </span>
                  </td>
                  <td className="p-3 text-right text-ops-text font-bold">
                    {d.candidate_pool_size} donors
                  </td>
                  <td className="p-3 text-right text-emerald-400 font-bold">
                    {d.expected_response_yield} units
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlertIdx(idx);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                        isSelected
                          ? "bg-purple-600 text-white"
                          : "bg-ops-panel hover:bg-ops-border text-ops-dim hover:text-white"
                      }`}
                    >
                      {isSelected ? "Active Pool" : "Inspect Pool"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Below Section: Ranked Top Donor Candidates for Selected Target */}
      {activeAlert && (
        <div className="bg-ops-card border border-ops-border rounded overflow-hidden">
          <div className="p-4 bg-ops-panel border-b border-ops-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Top Ranked Donor Candidates for {activeAlert.hospital_name}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Target: {activeAlert.blood_group} {activeAlert.component}
                </span>
              </div>
              <p className="text-[11px] text-ops-dim mt-1 font-mono">
                Candidate pool screened for &ge;90d interval, medical clearance, and shortest Haversine transit
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSelectHospital(activeAlert.hospital_id)}
                className="px-3 py-1.5 rounded bg-ops-card hover:bg-ops-border border border-ops-border text-xs font-mono text-ops-text transition"
              >
                Hospital Intelligence &rarr;
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-ops-card text-[10px] text-ops-dim uppercase border-b border-ops-border">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Synthetic Donor ID</th>
                <th className="p-3">Blood Group</th>
                <th className="p-3 text-right">Distance (km)</th>
                <th className="p-3 text-right">Days Since Last</th>
                <th className="p-3 text-right">MCDA Score</th>
                <th className="p-3 text-center">Priority Tier</th>
                <th className="p-3">Outreach Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ops-border">
              {activeAlert.top_candidates.map((c) => (
                <tr key={c.donor_id} className="hover:bg-ops-cardHover/60 transition">
                  <td className="p-3 font-bold text-white">#{c.rank}</td>
                  <td className="p-3 font-bold text-purple-400">{c.donor_id}</td>
                  <td className="p-3 text-ops-cyan font-bold">{c.blood_group}</td>
                  <td className="p-3 text-right text-ops-text">{c.distance_km} km</td>
                  <td className="p-3 text-right text-ops-dim">{c.days_since_last_donation} d</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">
                    {(c.composite_score * 100).toFixed(1)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {c.contact_priority}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-ops-muted text-[11px] max-w-sm">
                    {c.recommendation_reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
