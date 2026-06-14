"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/cn";
import { BarChart3, TrendingUp, TrendingDown, PieChart as PieChartIcon, Calendar, ArrowUpRight, Download, Filter } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6M");

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Deep dive into your financial data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            {["1M", "3M", "6M", "1Y", "ALL"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-brand-500 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="btn-ghost flex items-center gap-2 px-3">
            <Filter className="w-4 h-4" />
          </button>
          <button className="btn-gradient flex items-center gap-2 px-3">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Net Worth</div>
          <div className="text-2xl font-bold text-white mb-2">₹67,40,000.00</div>
          <div className="flex items-center gap-1 text-xs text-success-400 bg-success-500/10 w-max px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" /> +12.5% vs last period
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Income</div>
          <div className="text-2xl font-bold text-white mb-2">₹36,00,000.00</div>
          <div className="flex items-center gap-1 text-xs text-success-400 bg-success-500/10 w-max px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" /> +5.2% vs last period
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-white mb-2">₹23,18,400.00</div>
          <div className="flex items-center gap-1 text-xs text-danger-400 bg-danger-500/10 w-max px-2 py-1 rounded-md">
            <TrendingDown className="w-3 h-3" /> -2.1% vs last period
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-brand-900/40 to-transparent border-brand-500/20">
          <div className="text-sm text-brand-300 mb-1">Savings Rate</div>
          <div className="text-2xl font-bold text-brand-400 mb-2">35.6%</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Top 15% of users
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-brand-400" />
            Cash Flow Analysis
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={MOCK_CASH_FLOW}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc" }}
              itemStyle={{ color: "#f8fafc" }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-accent-400" />
              Expense Distribution
            </h2>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_CATEGORIES}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {MOCK_CATEGORIES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              {MOCK_CATEGORIES.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-slate-300">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{formatCurrency(cat.value)}</div>
                    <div className="text-xs text-slate-500">{cat.percent}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Net Worth Projection (AI) */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="badge-brand">AI Forecast</span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Net Worth Projection
            </h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Based on your current savings rate and spending habits, here is your projected net worth over the next 12 months.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_PROJECTION}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(99, 102, 241, 0.3)", borderRadius: "8px" }}
              />
              <Line type="monotone" dataKey="actual" name="Actual Net Worth" stroke="#f8fafc" strokeWidth={3} dot={{ r: 4, fill: "#f8fafc" }} />
              <Line type="monotone" dataKey="projected" name="Projected Net Worth" stroke="#6366f1" strokeWidth={3} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_CASH_FLOW = [
  { month: "Jan", income: 7200, expenses: 4800 },
  { month: "Feb", income: 7200, expenses: 5100 },
  { month: "Mar", income: 7500, expenses: 4600 },
  { month: "Apr", income: 7500, expenses: 4900 },
  { month: "May", income: 7500, expenses: 4700 },
  { month: "Jun", income: 7500, expenses: 4830 },
];

const MOCK_CATEGORIES = [
  { name: "Housing", value: 8500, percent: 35, color: "#6366f1" },
  { name: "Food", value: 4200, percent: 18, color: "#22c55e" },
  { name: "Transport", value: 2800, percent: 12, color: "#f59e0b" },
  { name: "Shopping", value: 2100, percent: 9, color: "#d946ef" },
  { name: "Utilities", value: 1500, percent: 6, color: "#3b82f6" },
  { name: "Other", value: 4800, percent: 20, color: "#64748b" },
];

const MOCK_PROJECTION = [
  { month: "Jan", actual: 72000, projected: null },
  { month: "Feb", actual: 74500, projected: null },
  { month: "Mar", actual: 77200, projected: null },
  { month: "Apr", actual: 79800, projected: null },
  { month: "May", actual: 82100, projected: null },
  { month: "Jun", actual: 84250, projected: 84250 },
  { month: "Jul", actual: null, projected: 86800 },
  { month: "Aug", actual: null, projected: 89400 },
  { month: "Sep", actual: null, projected: 92100 },
  { month: "Oct", actual: null, projected: 94800 },
  { month: "Nov", actual: null, projected: 97500 },
  { month: "Dec", actual: null, projected: 100300 },
];
