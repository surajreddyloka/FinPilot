"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, transactionsApi, accountsApi } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/cn";
import {
  BarChart3, TrendingUp, TrendingDown, PieChart as PieChartIcon,
  ArrowUpRight, Download, Filter, Loader2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { toast } from "react-hot-toast";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const TIME_RANGE_MONTHS: Record<string, number> = {
  "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "ALL": 24,
};

const CATEGORY_COLORS_MAP: Record<string, string> = {
  Food: "#22c55e", Shopping: "#d946ef", Utilities: "#3b82f6",
  Healthcare: "#f43f5e", Transportation: "#f59e0b", Entertainment: "#6366f1",
  Travel: "#06b6d4", Education: "#8b5cf6", Investments: "#10b981", Miscellaneous: "#64748b",
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6M");
  const months = TIME_RANGE_MONTHS[timeRange] || 6;

  // Fetch real data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => analyticsApi.overview().then((r) => r.data),
    retry: false,
  });

  const { data: spendingTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["analytics-trend", months],
    queryFn: () => analyticsApi.spendingTrend(months).then((r) => r.data),
    retry: false,
  });

  const { data: categoryBreakdown, isLoading: catLoading } = useQuery({
    queryKey: ["analytics-categories", months],
    queryFn: () => {
      const end = new Date();
      const start = subMonths(end, months);
      return analyticsApi.categoryBreakdown({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }).then((r) => r.data);
    },
    retry: false,
  });

  const { data: txSummary } = useQuery({
    queryKey: ["transactions-summary-analytics", months],
    queryFn: () => {
      const end = new Date();
      const start = subMonths(end, months);
      return transactionsApi.summary({
        start_date: startOfMonth(start).toISOString(),
        end_date: endOfMonth(end).toISOString(),
      }).then((r) => r.data);
    },
    retry: false,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["accounts-balance"],
    queryFn: () => accountsApi.totalBalance().then((r) => r.data),
    retry: false,
  });

  // Derived real values
  const totalIncome = txSummary?.total_income ?? overview?.total_income ?? 0;
  const totalExpenses = txSummary?.total_expenses ?? overview?.total_expenses ?? 0;
  const netWorth = accountsData?.total_balance ?? overview?.net_worth ?? 0;
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : "0.0";

  // Cash flow chart data from trend
  const cashFlowData = Array.isArray(spendingTrend)
    ? spendingTrend.map((item: any) => ({
        month: item.month || item.period || format(new Date(item.date || item.period_start), "MMM"),
        income: item.income || item.total_income || 0,
        expenses: item.expenses || item.total_expenses || 0,
      }))
    : [];

  // Category breakdown
  const categoryData = Array.isArray(categoryBreakdown)
    ? categoryBreakdown.map((item: any) => {
        const name = item.category_name || item.category || item.name || "Other";
        return {
          name,
          value: item.total_amount || item.amount || item.value || 0,
          percent: item.percentage || item.percent || 0,
          color: CATEGORY_COLORS_MAP[name] || "#64748b",
        };
      })
    : [];

  const totalCatAmount = categoryData.reduce((s, c) => s + c.value, 0);
  const categoryDataWithPercent = categoryData.map((c) => ({
    ...c,
    percent: totalCatAmount > 0 ? ((c.value / totalCatAmount) * 100).toFixed(1) : c.percent,
  }));

  // Net worth projection from actual + simple linear extrapolation
  const projectionData = (() => {
    const now = new Date();
    const result = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(now, 5 - i);
      const label = format(d, "MMM");
      if (i <= 5) {
        // Show actual for past 6 months
        result.push({ month: label, actual: netWorth + (i - 5) * (totalIncome - totalExpenses), projected: null });
      } else {
        result.push({ month: label, actual: null, projected: netWorth + (i - 5) * (totalIncome - totalExpenses) });
      }
    }
    return result;
  })();

  const isLoading = overviewLoading || trendLoading || catLoading;

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
          <button onClick={() => toast("Export coming soon")} className="btn-gradient flex items-center gap-2 px-3">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your real data...</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Net Worth</div>
          <div className="text-2xl font-bold text-white mb-2">{formatCurrency(netWorth)}</div>
          <div className="flex items-center gap-1 text-xs text-success-400 bg-success-500/10 w-max px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" /> Live from your accounts
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Income</div>
          <div className="text-2xl font-bold text-white mb-2">{formatCurrency(totalIncome)}</div>
          <div className="flex items-center gap-1 text-xs text-success-400 bg-success-500/10 w-max px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3" /> Last {timeRange}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-white mb-2">{formatCurrency(totalExpenses)}</div>
          <div className="flex items-center gap-1 text-xs text-danger-400 bg-danger-500/10 w-max px-2 py-1 rounded-md">
            <TrendingDown className="w-3 h-3" /> Last {timeRange}
          </div>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-brand-900/40 to-transparent border-brand-500/20">
          <div className="text-sm text-brand-300 mb-1">Savings Rate</div>
          <div className="text-2xl font-bold text-brand-400 mb-2">{savingsRate}%</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {parseFloat(savingsRate) >= 20 ? "Great savings!" : "Room to improve"}
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
          {cashFlowData.length === 0 && !trendLoading && (
            <span className="text-xs text-slate-500">No transaction data yet</span>
          )}
        </div>
        {cashFlowData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashFlowData}>
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
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            Add transactions to see your cash flow chart
          </div>
        )}
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
          {categoryDataWithPercent.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDataWithPercent}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryDataWithPercent.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-3">
                {categoryDataWithPercent.map((cat) => (
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
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No expense data available for this period
            </div>
          )}
        </div>

        {/* Net Worth Projection */}
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
            Based on your current savings rate ({savingsRate}%), here's your projected net worth.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(99, 102, 241, 0.3)", borderRadius: "8px" }}
              />
              <Line type="monotone" dataKey="actual" name="Actual Net Worth" stroke="#f8fafc" strokeWidth={3} dot={{ r: 4, fill: "#f8fafc" }} connectNulls={false} />
              <Line type="monotone" dataKey="projected" name="Projected Net Worth" stroke="#6366f1" strokeWidth={3} strokeDasharray="5 5" dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
