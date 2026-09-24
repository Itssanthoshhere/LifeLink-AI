"use client";

import React, { useState } from "react";
import { Users, AlertCircle, Phone, CheckCircle, Clock, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
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
      {/* Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">
            Targeted Donor Dispatch & Mobilization
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Model 3 Multi-Criteria Decision Analysis (MCDA) ranking for proactive donor outreach during predicted shortages
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
            {donorRecommendations.length} Active Mobilization Targets
          </span>
        </div>
      </div>

      {/* Top Section: Active Donor Mobilization Sessions */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-gray-50/80 border-b border-gray-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 font-sans">
                Active Donor Mobilization Sessions
              </span>
              <p className="text-xs text-gray-500">
                Screened against 90-day donation intervals & ABO/Rh compatibility
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            Model 3 MCDA Scoring • Proximity Weighted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
              <tr>
                <th className="p-3.5">Target Facility</th>
                <th className="p-3.5">Required Product</th>
                <th className="p-3.5 text-center">Urgency Tier</th>
                <th className="p-3.5 text-right">Eligible Candidates</th>
                <th className="p-3.5 text-right">Expected Top-5 Yield</th>
                <th className="p-3.5 text-right">Select Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donorRecommendations.map((d, idx) => {
                const isSelected = idx === selectedAlertIdx;
                const isCrit = d.priority_tier === "CRITICAL";
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedAlertIdx(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-purple-50/60 border-l-4 border-purple-600" : "hover:bg-gray-50/70"
                    }`}
                  >
                    <td className="p-3.5 font-bold text-gray-900">
                      <div>{d.hospital_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{d.hospital_id}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-crimson-700 bg-crimson-50 px-2 py-0.5 rounded-md border border-crimson-200">
                        {d.blood_group}
                      </span>{" "}
                      <span className="text-gray-600 font-medium ml-1">{d.component}</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCrit
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {d.priority_tier}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-gray-800 font-bold">
                      {d.candidate_pool_size} donors
                    </td>
                    <td className="p-3.5 text-right text-emerald-700 font-bold">
                      {d.expected_response_yield} units
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlertIdx(idx);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                          isSelected
                            ? "bg-purple-700 text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {isSelected ? "Active Target" : "Inspect Pool"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Below Section: Ranked Top Donor Candidates for Selected Target */}
      {activeAlert && (
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-gray-50/80 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900 font-sans">
                  Top Ranked Donor Candidates for {activeAlert.hospital_name}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Target: {activeAlert.blood_group} {activeAlert.component}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Candidate pool screened for &ge;90d interval, medical clearance, and shortest transit corridor
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSelectHospital(activeAlert.hospital_id)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition shadow-2xs"
              >
                Inspect Facility &rarr;
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-gray-50/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200/80">
                <tr>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Donor ID</th>
                  <th className="p-3.5">Blood Group</th>
                  <th className="p-3.5 text-right">Distance</th>
                  <th className="p-3.5 text-right">Composite Score</th>
                  <th className="p-3.5">Outreach Priority</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeAlert.top_candidates.map((c) => (
                  <tr key={c.donor_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-3.5 text-gray-400 font-bold">#{c.rank}</td>
                    <td className="p-3.5 font-bold text-purple-700 font-mono">{c.donor_id}</td>
                    <td className="p-3.5 font-semibold text-gray-800">{c.blood_group}</td>
                    <td className="p-3.5 text-right text-gray-500">{c.distance_km} km</td>
                    <td className="p-3.5 text-right text-emerald-700 font-bold">
                      {(c.composite_score * 100).toFixed(1)}
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {c.contact_priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors shadow-2xs">
                        Dispatch Callout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
