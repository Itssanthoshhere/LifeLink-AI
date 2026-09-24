"use client";

import React, { useState, useCallback } from "react";
import {
  FileDown,
  FileText,
  Printer,
  ClipboardCopy,
  Check,
  X,
  Shield,
  Truck,
  Clock,
  Building2,
  AlertTriangle
} from "lucide-react";
import { TransferRecommendation, CommandCenterPayload } from "@/types/commandCenter";

interface DispatchManifestProps {
  commandCenter: CommandCenterPayload;
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchManifest: React.FC<DispatchManifestProps> = ({
  commandCenter,
  isOpen,
  onClose
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "slip">("slip");
  const [selectedTransfers, setSelectedTransfers] = useState<Set<number>>(
    new Set(commandCenter.transfer_recommendations.map((_, i) => i))
  );

  const transfers = commandCenter.transfer_recommendations;
  const metrics = commandCenter.network_metrics;

  const toggleTransfer = (idx: number) => {
    setSelectedTransfers((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedTransfers(new Set(transfers.map((_, i) => i)));
  const selectNone = () => setSelectedTransfers(new Set());

  // Generate CSV export
  const generateCSV = useCallback(() => {
    const headers = [
      "Route ID", "Source ID", "Source Name", "Destination ID", "Destination Name",
      "Blood Group", "Component", "Units", "Distance (km)", "ETA (min)",
      "FEFO Priority", "Exact Match"
    ];
    const rows = transfers
      .filter((_, i) => selectedTransfers.has(i))
      .map((t) => [
        t.route_id, t.source, t.source_name, t.destination, t.destination_name,
        t.recipient_blood_group, t.component, t.units, t.distance_km,
        t.travel_time_minutes, t.is_fefo_priority ? "Yes" : "No",
        t.is_exact_match ? "Yes" : "No"
      ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return csv;
  }, [transfers, selectedTransfers]);

  // Generate JSON export
  const generateJSON = useCallback(() => {
    const selected = transfers.filter((_, i) => selectedTransfers.has(i));
    return JSON.stringify({
      manifest: {
        generated_at: new Date().toISOString(),
        date: commandCenter.date,
        horizon_hours: commandCenter.horizon,
        scenario: commandCenter.scenario,
        optimization_status: commandCenter.optimization_status,
        solve_time_seconds: commandCenter.solve_time_seconds,
        total_selected: selected.length
      },
      network_metrics: metrics,
      transfers: selected
    }, null, 2);
  }, [transfers, selectedTransfers, commandCenter, metrics]);

  // Generate Chain-of-Custody Slip text
  const generateSlip = useCallback((transfer: TransferRecommendation, idx: number) => {
    const now = new Date();
    return `
╔══════════════════════════════════════════════════════════╗
║           CHAIN-OF-CUSTODY TRANSPORT SLIP               ║
║              LifeLink AI Blood Supply                   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Slip #: ${transfer.route_id.padEnd(46)}║
║  Generated: ${now.toISOString().padEnd(43)}║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  ORIGIN                                                  ║
║  Facility: ${transfer.source_name.padEnd(44)}║
║  ID: ${transfer.source.padEnd(50)}║
║                                                          ║
║  DESTINATION                                             ║
║  Facility: ${transfer.destination_name.padEnd(44)}║
║  ID: ${transfer.destination.padEnd(50)}║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  PRODUCT DETAILS                                         ║
║  Blood Group: ${transfer.recipient_blood_group.padEnd(41)}║
║  Component: ${transfer.component.padEnd(43)}║
║  Units: ${String(transfer.units).padEnd(47)}║
║  Match Type: ${(transfer.is_exact_match ? "Exact ABO/Rh" : "Compatible").padEnd(42)}║
║  FEFO Priority: ${(transfer.is_fefo_priority ? "YES" : "No").padEnd(38)}║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  LOGISTICS                                               ║
║  Distance: ${(transfer.distance_km + " km").padEnd(44)}║
║  ETA: ${(transfer.travel_time_minutes + " minutes").padEnd(49)}║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  AUTHORIZATION                                           ║
║                                                          ║
║  Dispatched by: ____________________________             ║
║  Date/Time:     ____________________________             ║
║                                                          ║
║  Received by:   ____________________________             ║
║  Date/Time:     ____________________________             ║
║                                                          ║
║  Temperature verified:  □ Yes  □ No                      ║
║  Seal intact:           □ Yes  □ No                      ║
║  Units verified:        □ Yes  □ No                      ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  ⚠ CLINICAL DISCLAIMER                                   ║
║  This is a decision-support recommendation only.         ║
║  All transfers require authorized blood bank              ║
║  personnel verification before dispatch execution.       ║
╚══════════════════════════════════════════════════════════╝
`.trim();
  }, []);

  // Download file
  const handleDownload = useCallback(() => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === "csv") {
      content = generateCSV();
      filename = `lifelink_dispatch_manifest_${commandCenter.date}.csv`;
      mimeType = "text/csv";
    } else if (exportFormat === "json") {
      content = generateJSON();
      filename = `lifelink_dispatch_manifest_${commandCenter.date}.json`;
      mimeType = "application/json";
    } else {
      // Generate all slips for selected transfers
      const slips = transfers
        .filter((_, i) => selectedTransfers.has(i))
        .map((t, i) => generateSlip(t, i))
        .join("\n\n" + "═".repeat(58) + "\n\n");
      content = slips;
      filename = `lifelink_custody_slips_${commandCenter.date}.txt`;
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportFormat, generateCSV, generateJSON, generateSlip, transfers, selectedTransfers, commandCenter]);

  // Copy to clipboard
  const handleCopySlip = useCallback(async (transfer: TransferRecommendation, idx: number) => {
    const slip = generateSlip(transfer, idx);
    await navigator.clipboard.writeText(slip);
    setCopiedId(transfer.route_id);
    setTimeout(() => setCopiedId(null), 2000);
  }, [generateSlip]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-crimson-50 text-crimson-700 border border-crimson-200/60">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-sans">
                  Dispatch Manifest & Chain-of-Custody Export
                </h3>
                <p className="text-xs text-gray-500">
                  {commandCenter.date} • {commandCenter.horizon}h horizon • {commandCenter.scenario}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls Bar */}
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Format Toggle */}
              <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200/80 p-0.5">
                {([
                  { id: "slip" as const, label: "Custody Slips", icon: FileText },
                  { id: "csv" as const, label: "CSV", icon: FileDown },
                  { id: "json" as const, label: "JSON", icon: FileDown },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setExportFormat(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      exportFormat === id
                        ? "bg-white text-crimson-700 shadow-xs border border-gray-200/80"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Select all / none */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={selectAll}
                  className="px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={selectNone}
                  className="px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors font-medium"
                >
                  None
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 font-medium">
                {selectedTransfers.size} of {transfers.length} selected
              </span>
              <button
                onClick={handleDownload}
                disabled={selectedTransfers.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>

          {/* Transfer List */}
          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
            {transfers.map((t, idx) => {
              const isChecked = selectedTransfers.has(idx);
              const isCopied = copiedId === t.route_id;

              return (
                <div
                  key={t.route_id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isChecked
                      ? "bg-crimson-50/30 border-crimson-200/60"
                      : "bg-gray-50/50 border-gray-200/60 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTransfer(idx)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-crimson-600 border-crimson-600"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </button>

                      {/* Transfer info */}
                      <div>
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                          <span>{t.source_name}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="text-blue-700">{t.destination_name}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-gray-400">{t.route_id}</span>
                          <span className="font-semibold text-emerald-700">
                            {t.units} units {t.recipient_blood_group} {t.component}
                          </span>
                          <span>•</span>
                          <span>{t.distance_km} km • {t.travel_time_minutes} min</span>
                          {t.is_fefo_priority && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              FEFO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopySlip(t, idx)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          isCopied
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-white hover:bg-gray-100 border border-gray-200 text-gray-600"
                        }`}
                        title="Copy chain-of-custody slip to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="w-3 h-3" />
                            Copy Slip
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer disclaimer */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
            <Shield className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              All manifests and custody slips are decision-support documents only. Transfers require authorized blood bank personnel verification and cold-chain compliance before execution.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
