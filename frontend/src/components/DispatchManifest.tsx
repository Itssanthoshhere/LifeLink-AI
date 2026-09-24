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
  AlertTriangle,
  ArrowRight
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
  const [exportFormat, setExportFormat] = useState<"slip" | "pdf" | "csv" | "json">("slip");
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

  // Generate PDF Print / Download Window
  const handlePrintPDF = useCallback(() => {
    const selectedList = transfers.filter((_, i) => selectedTransfers.has(i));
    const now = new Date();

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LifeLink AI - Dispatch Manifest (${commandCenter.date})</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; margin: 0; padding: 24px; font-size: 11pt; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #a4161a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 18pt; font-weight: 800; color: #a4161a; margin: 0; letter-spacing: -0.5px; }
            .subtitle { font-size: 9.5pt; color: #4b5563; margin-top: 4px; font-weight: 500; }
            .meta-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; font-size: 9pt; }
            .meta-item strong { display: block; color: #64748b; text-transform: uppercase; font-size: 7.5pt; font-weight: 700; margin-bottom: 2px; }
            .meta-value { font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 9.5pt; }
            th { background: #f1f5f9; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; color: #334155; font-size: 8.5pt; text-transform: uppercase; font-weight: 700; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
            tr:nth-child(even) { background: #f8fafc; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 8.5pt; }
            .badge-blood { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
            .badge-fefo { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
            .signature-box { margin-top: 32px; display: grid; grid-template-cols: 1fr 1fr; gap: 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; page-break-inside: avoid; background: #fafafa; }
            .sig-title { font-weight: 800; font-size: 10pt; color: #0f172a; margin-bottom: 12px; display: block; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            .sig-line { margin-top: 30px; border-bottom: 1.5px dashed #94a3b8; }
            .disclaimer { margin-top: 30px; font-size: 8pt; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">LifeLink AI — Dispatch Manifest</div>
              <div class="subtitle">Official Chain-of-Custody & Blood Supply Transshipment Order</div>
            </div>
            <div style="text-align: right; font-size: 9pt; color: #475569;">
              <strong>Date:</strong> ${commandCenter.date}<br/>
              <strong>Planning Horizon:</strong> ${commandCenter.horizon} Hours<br/>
              <strong>Scenario:</strong> ${commandCenter.scenario}
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><strong>Transshipment Orders</strong><div class="meta-value">${selectedList.length} Orders</div></div>
            <div class="meta-item"><strong>Total Volume</strong><div class="meta-value">${selectedList.reduce((acc, t) => acc + t.units, 0)} Units</div></div>
            <div class="meta-item"><strong>Optimization Status</strong><div class="meta-value" style="color:#059669">${commandCenter.optimization_status}</div></div>
            <div class="meta-item"><strong>Generated Timestamp</strong><div class="meta-value">${now.toLocaleString()}</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Origin Facility</th>
                <th>Destination Facility</th>
                <th>Blood Product</th>
                <th>Units</th>
                <th>Distance & ETA</th>
                <th>Priority Tier</th>
              </tr>
            </thead>
            <tbody>
              ${selectedList.map(t => `
                <tr>
                  <td><code style="font-size:8.5pt">${t.route_id}</code></td>
                  <td><strong>${t.source_name}</strong><br/><span style="font-size:8pt;color:#64748b">${t.source}</span></td>
                  <td><strong style="color:#1d4ed8">${t.destination_name}</strong><br/><span style="font-size:8pt;color:#64748b">${t.destination}</span></td>
                  <td><span class="badge badge-blood">${t.recipient_blood_group}</span> ${t.component}</td>
                  <td><strong style="color:#059669;font-size:10.5pt">${t.units} U</strong></td>
                  <td>${t.travel_time_minutes} min (${t.distance_km} km)</td>
                  <td>${t.is_fefo_priority ? '<span class="badge badge-fefo">FEFO RESCUE</span>' : '<span style="color:#64748b">Routine</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signature-box">
            <div>
              <span class="sig-title">ORIGIN DISPATCH AUTHORIZATION</span>
              <div style="font-size: 9pt; color: #334155;">
                Authorized Officer: __________________________<br/><br/>
                Dispatch Time: __________________ Temp: ____ °C<br/>
                <div class="sig-line"></div>
                <span style="font-size:7.5pt;color:#94a3b8">Officer Signature & Stamp</span>
              </div>
            </div>
            <div>
              <span class="sig-title">DESTINATION RECEIVING ACCEPTANCE</span>
              <div style="font-size: 9pt; color: #334155;">
                Receiving Clinician: __________________________<br/><br/>
                Arrival Time: ____________________ Seal Intact: [ ]<br/>
                <div class="sig-line"></div>
                <span style="font-size:7.5pt;color:#94a3b8">Clinician Acceptance Signature</span>
              </div>
            </div>
          </div>

          <div class="disclaimer">
            CONFIDENTIAL CLINICAL DECISION SUPPORT MANIFEST — LifeLink AI Logistics Intelligence.
            Qualified healthcare & blood-bank professional verification required prior to dispatch execution.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [commandCenter, transfers, selectedTransfers]);

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

  // Download file or trigger PDF Print
  const handleDownload = useCallback(() => {
    if (exportFormat === "pdf") {
      handlePrintPDF();
      return;
    }

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
  }, [exportFormat, handlePrintPDF, generateCSV, generateJSON, generateSlip, transfers, selectedTransfers, commandCenter]);

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
                  { id: "pdf" as const, label: "PDF Manifest", icon: Printer },
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
                {exportFormat === "pdf" ? <Printer className="w-3.5 h-3.5" /> : <FileDown className="w-3.5 h-3.5" />}
                {exportFormat === "pdf" ? "Print / Save PDF" : `Download ${exportFormat.toUpperCase()}`}
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
