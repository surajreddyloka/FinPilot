"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi, aiApi } from "@/lib/api/client";
import { formatCurrency, formatPercent, getScoreColor, getScoreLabel, CATEGORY_COLORS } from "@/lib/utils/cn";
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank, Target,
  Zap, AlertTriangle, CreditCard, BarChart3, Bot, ArrowRight,
  Wallet, ShieldCheck,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import Link from "next/link";

// ── Mock data for demo (shown when no backend is connected) ──────────────────
const MOCK_OVERVIEW = {
  total_balance: 24850.75,
  monthly_income: 7500,
  monthly_expenses: 4830.20,
  monthly_savings: 2669.80,
  savings_rate: 35.6,
  income_change_pct: 5.2,
  expense_change_pct: -3.1,
};

const MOCK_TREND = {
  trend: [
    { month: "Jan", income: 7200, expenses: 5100, savings: 2100 },
    { month: "Feb", income: 7200, expenses: 4800, savings: 2400 },
    { month: "Mar", income: 7500, expenses: 5200, savings: 2300 },
    { month: "Apr", income: 7500, expenses: 4950, savings: 2550 },
    { month: "May", income: 7500, expenses: 5000, savings: 2500 },
    { month: "Jun", income: 7500, expenses: 4830, savings: 2670 },
  ],
};

const MOCK_CATEGORIES = {
  categories: [
    { name: "Food", total: 1200 },
    { name: "Shopping", total: 950 },
    { name: "Utilities", total: 680 },
    { name: "Transportation", total: 520 },
    { name: "Entertainment", total: 380 },
    { name: "Healthcare", total: 290 },
    { name: "Education", total: 180 },
    { name: "Miscellaneous", total: 130 },
  ],
};

const MOCK_SCORE = {
  score: 78,
  grade: "B",
  breakdown: {
    savings_rate: { score: 85, weight: "30%" },
    expense_ratio: { score: 72, weight: "20%" },
    budget_adherence: { score: 68, weight: "20%" },
    goal_completion: { score: 80, weight: "15%" },
    financial_consistency: { score: 74, weight: "15%" },
  },
  suggestions: [
    "Increase monthly savings by $300 to hit 20% savings rate",
    "Set category budgets and track spending weekly",
    "Cancel 2 unused subscriptions (~$45/month)",
  ],
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  title, value, change, icon: Icon, gradient, prefix = "$",
}: {
  title: string; value: number | string; change?: number; icon: React.ElementType;
  gradient: string; prefix?: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="glass-card-hover p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${isPositive ? "bg-success-500/15 text-success-400" : "bg-danger-500/15 text-danger-400"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">
          {typeof value === "number" ? formatCurrency(value) : value}
        </p>
      </div>
    </div>
  );
}

// ── Circular Score ─────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const colorClass = getScoreColor(score);

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={radius} strokeWidth="10" className="stroke-white/5" fill="none" />
        <circle
          cx="72" cy="72" r={radius} strokeWidth="10" fill="none"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          stroke={score >= 80 ? "#22c55e" : score >= 65 ? "#6366f1" : score >= 50 ? "#f59e0b" : "#ef4444"}
        />
      </svg>
      <div className="text-center">
        <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
        <p className="text-xs text-slate-500 mt-0.5">{getScoreLabel(score)}</p>
      </div>
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: overviewData } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => analyticsApi.overview().then((r) => r.data).catch(() => MOCK_OVERVIEW),
    initialData: MOCK_OVERVIEW,
  });

  const { data: trendData } = useQuery({
    queryKey: ["spending-trend"],
    queryFn: () => analyticsApi.spendingTrend(6).then((r) => r.data).catch(() => MOCK_TREND),
    initialData: MOCK_TREND,
  });

  const { data: categoryData } = useQuery({
    queryKey: ["category-breakdown"],
    queryFn: () => analyticsApi.categoryBreakdown().then((r) => r.data).catch(() => MOCK_CATEGORIES),
    initialData: MOCK_CATEGORIES,
  });

  const overview = overviewData || MOCK_OVERVIEW;
  const trend = (trendData?.trend || MOCK_TREND.trend);
  const categories = (categoryData?.categories || MOCK_CATEGORIES.categories).slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good morning! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Here&apos;s your financial overview for <span className="text-brand-400 font-medium">June 2026</span>
          </p>
        </div>
        <Link
          href="/ai-copilot"
          className="btn-gradient flex items-center gap-2 text-sm"
        >
          <Bot className="w-4 h-4" />
          Ask AI Copilot
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={overview.total_balance}
          icon={Wallet}
          gradient="bg-gradient-to-br from-brand-500 to-brand-700"
        />
        <StatCard
          title="Monthly Income"
          value={overview.monthly_income}
          change={overview.income_change_pct}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-success-500 to-success-600"
        />
        <StatCard
          title="Monthly Expenses"
          value={overview.monthly_expenses}
          change={overview.expense_change_pct}
          icon={CreditCard}
          gradient="bg-gradient-to-br from-warning-500 to-warning-600"
        />
        <StatCard
          title="Monthly Savings"
          value={overview.monthly_savings}
          icon={PiggyBank}
          gradient="bg-gradient-to-br from-accent-500 to-accent-700"
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Spending Trend Chart — 2 cols */}
        <div className="lg:col-span-2 chart-container">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Income vs Expenses</h2>
              <p className="text-xs text-slate-500 mt-0.5">6-month trend</p>
            </div>
            <Link href="/analytics" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              Full Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#6366f1" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Health Score */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Health Score</h2>
              <p className="text-xs text-slate-500">AI-powered rating</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-brand-400" />
          </div>

          <div className="flex justify-center mb-4">
            <ScoreRing score={MOCK_SCORE.score} />
          </div>

          <div className="space-y-2">
            {Object.entries(MOCK_SCORE.breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500 capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-xs font-medium text-white">{val.score}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-700"
                      style={{ width: `${val.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/ai-copilot" className="mt-4 btn-ghost text-xs flex items-center justify-center gap-2 w-full">
            <Zap className="w-3.5 h-3.5" />
            Improve Score
          </Link>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="chart-container">
          <h2 className="text-base font-semibold text-white mb-4">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={0}
              >
                {categories.map((entry: any, i: number) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.name] || "#6366f1"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {categories.slice(0, 4).map((cat: any) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[cat.name] || "#6366f1" }} />
                  <span className="text-xs text-slate-400">{cat.name}</span>
                </div>
                <span className="text-xs font-medium text-white">{formatCurrency(cat.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Insights</h2>
              <p className="text-xs text-slate-500">Personalized recommendations</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: TrendingDown, color: "text-success-400", bg: "bg-success-500/10", text: "Your food spending dropped 8% — great discipline this month!" },
              { icon: AlertTriangle, color: "text-warning-400", bg: "bg-warning-500/10", text: "3 subscriptions detected: Netflix, Spotify, Adobe. Save $45/mo by auditing." },
              { icon: Target, color: "text-brand-400", bg: "bg-brand-500/10", text: "At current savings rate, you'll reach your $10K goal in 4 months." },
            ].map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-xl ${insight.bg} border border-white/5`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${insight.color}`} />
                  <p className="text-xs text-slate-300 leading-relaxed">{insight.text}</p>
                </div>
              );
            })}
          </div>

          <Link href="/ai-copilot" className="mt-4 btn-gradient text-xs flex items-center justify-center gap-2 w-full">
            <Bot className="w-4 h-4" />
            Chat with AI Copilot
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/transactions", icon: CreditCard, label: "Add Transaction", gradient: "from-brand-500 to-brand-600" },
              { href: "/goals", icon: Target, label: "Set Goal", gradient: "from-success-500 to-success-600" },
              { href: "/budgets", icon: BarChart3, label: "Create Budget", gradient: "from-warning-500 to-warning-600" },
              { href: "/reports", icon: BarChart3, label: "Get Report", gradient: "from-accent-500 to-accent-600" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-brand-500/30 transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 group-hover:text-white text-center transition-colors">{action.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Savings Rate */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-brand-500/10 to-accent-500/5 border border-brand-500/15">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">Savings Rate</span>
              <span className="text-sm font-bold text-success-400">{overview.savings_rate?.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-success-400 rounded-full"
                style={{ width: `${Math.min(overview.savings_rate || 0, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">Target: 20% · You&apos;re crushing it! 🚀</p>
          </div>
        </div>
      </div>
    </div>
  );
}
