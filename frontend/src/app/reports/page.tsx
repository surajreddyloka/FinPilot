"use client";

import { useState } from "react";
import { Download, FileText, Calendar, Filter, FileJson, Mail, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function ReportsPage() {
  const [reports] = useState(MOCK_REPORTS);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Generate and download financial summaries</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-gradient flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Report Generator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: "Monthly Summary", desc: "Comprehensive overview of income, expenses, and savings for a specific month.", icon: Calendar, color: "text-brand-400" },
          { title: "Tax Preparation", desc: "Categorized expenses and income formatted for easy tax filing.", icon: FileText, color: "text-success-400" },
          { title: "Custom Data Export", desc: "Raw transaction data in CSV or JSON format for external analysis.", icon: FileJson, color: "text-accent-400" },
        ].map((type) => (
          <div key={type.title} className="glass-card p-6 group hover:border-white/20 transition-all cursor-pointer">
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
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-500" />
                      <span className="font-medium text-white">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {format(new Date(report.date), "MMM dd, yyyy • HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs border border-white/10 uppercase">
                      {report.format}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {report.status === "completed" ? (
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
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Email">
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_REPORTS = [
  { id: "r1", name: "May 2026 Financial Summary", date: "2026-06-01T10:30:00Z", format: "pdf", status: "completed" },
  { id: "r2", name: "Q1 2026 Tax Export", date: "2026-04-15T14:20:00Z", format: "csv", status: "completed" },
  { id: "r3", name: "April 2026 Financial Summary", date: "2026-05-01T09:15:00Z", format: "pdf", status: "completed" },
  { id: "r4", name: "Custom Range Export (Jan-Mar)", date: "2026-03-31T16:45:00Z", format: "json", status: "completed" },
];
