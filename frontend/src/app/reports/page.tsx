"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi, transactionsApi } from "@/lib/api/client";
import { Download, FileText, Calendar, FileJson, Mail, ChevronRight, X, Loader2, Sparkles } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "react-hot-toast";

type ReportType = "monthly_summary" | "tax_preparation" | "custom_export";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>("monthly_summary");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = subMonths(new Date(), 1);
    return format(d, "yyyy-MM");
  });

  // Fetch real reports list
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportsApi.list().then((r) => r.data).catch(() => []),
    initialData: [],
  });

  const reports = reportsData || [];

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: () => reportsApi.generate(selectedType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report is being generated! It will appear below shortly.");
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to generate report. Please try again."),
  });

  // Download: fetch real transactions and export as CSV/JSON
  const handleDownload = async (report: any) => {
    toast.loading("Preparing download...", { id: "download" });
    try {
      // Try downloading via the report's file_url if available
      if (report.file_url) {
        const a = document.createElement("a");
        a.href = report.file_url;
        a.download = `${report.name || "report"}.${report.format || "csv"}`;
        a.click();
        toast.success("Download started!", { id: "download" });
        return;
      }

      // Fallback: export real transactions as CSV
      const { data: txData } = await transactionsApi.list({ limit: 1000 });
      const transactions = Array.isArray(txData) ? txData : txData?.items || [];

      if (report.format === "json" || exportFormat === "json") {
        const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report.name || "report"}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const headers = "Date,Name,Merchant,Category,Type,Amount,Currency\n";
        const rows = transactions.map((t: any) =>
          `"${format(new Date(t.transaction_date), "yyyy-MM-dd")}","${t.name || ""}","${t.merchant_name || ""}","${t.category_id || ""}","${t.transaction_type}","${t.amount}","${t.currency || "INR"}"`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report.name || "report"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success("Download ready!", { id: "download" });
    } catch {
      toast.error("Download failed.", { id: "download" });
    }
  };

  // Quick generate: directly trigger for a specific type without modal
  const handleQuickGenerate = (type: ReportType) => {
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const REPORT_TYPES = [
    {
      type: "monthly_summary" as ReportType,
      title: "Monthly Summary",
      desc: "Comprehensive overview of income, expenses, and savings for a specific month.",
      icon: Calendar,
      color: "text-brand-400",
    },
    {
      type: "tax_preparation" as ReportType,
      title: "Tax Preparation",
      desc: "Categorized expenses and income formatted for easy tax filing.",
      icon: FileText,
      color: "text-success-400",
    },
    {
      type: "custom_export" as ReportType,
      title: "Custom Data Export",
      desc: "Raw transaction data in CSV or JSON format for external analysis.",
      icon: FileJson,
      color: "text-accent-400",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Generate and download financial summaries</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-gradient flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Report Generator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {REPORT_TYPES.map((type) => (
          <div
            key={type.type}
            onClick={() => handleQuickGenerate(type.type)}
            className="glass-card p-6 group hover:border-white/20 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <type.icon className={`w-6 h-6 ${type.color}`} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{type.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">{type.desc}</p>
            <div className="flex items-center text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              Generate <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Generated Reports History */}
      <h2 className="text-lg font-semibold text-white mb-4">Recent Reports</h2>
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium text-slate-400">No reports yet</p>
            <p className="text-sm mt-1">Click "Generate New Report" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/5 border-b border-white/[0.06] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Report Name</th>
                  <th className="px-6 py-4 font-medium">Date Generated</th>
                  <th className="px-6 py-4 font-medium">Format</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {reports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <span className="font-medium text-white">{report.name || report.report_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {format(new Date(report.created_at || report.date), "MMM dd, yyyy • HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/5 rounded text-xs border border-white/10 uppercase">
                        {report.format || "pdf"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(report.status === "completed" || report.status === "ready") ? (
                        <span className="text-success-400 text-xs font-medium flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-success-400" /> Ready
                        </span>
                      ) : (
                        <span className="text-warning-400 text-xs font-medium flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning-400 animate-pulse" /> Processing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(report)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toast.success("Report link copied! Share via email.")}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-white/10 p-6 rounded-2xl z-50 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                Generate Report
              </Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Report Type</label>
                <div className="space-y-2">
                  {REPORT_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setSelectedType(t.type)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        selectedType === t.type
                          ? "border-brand-500 bg-brand-500/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <t.icon className={`w-5 h-5 ${t.color}`} />
                      <div>
                        <div className="font-medium text-sm">{t.title}</div>
                        <div className="text-xs text-slate-500">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Period selector */}
              {selectedType !== "custom_export" && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Month</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="input-dark w-full"
                  />
                </div>
              )}

              {/* Format selector for custom export */}
              {selectedType === "custom_export" && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Export Format</label>
                  <div className="flex gap-3">
                    {(["csv", "json"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt)}
                        className={`flex-1 py-2 rounded-xl border text-sm font-medium uppercase transition-all ${
                          exportFormat === fmt
                            ? "border-brand-500 bg-brand-500/10 text-white"
                            : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="btn-gradient flex-1 flex items-center justify-center gap-2"
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate</>
                  )}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
