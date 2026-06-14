"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/cn";
import { Plus, Target, TrendingUp, Calendar, Zap } from "lucide-react";

export default function GoalsPage() {
  const [goals] = useState(MOCK_GOALS);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Savings Goals</h1>
          <p className="text-slate-400 text-sm mt-1">Track and achieve your financial milestones</p>
        </div>
        <button className="btn-gradient flex items-center gap-2 w-max">
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Summary */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6 justify-between bg-gradient-to-r from-brand-900/40 to-transparent border-brand-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Target className="w-7 h-7 text-brand-400" />
          </div>
          <div>
            <h2 className="text-slate-300 text-sm font-medium">Total Saved Across Goals</h2>
            <div className="text-3xl font-bold text-white mt-1">₹17,96,000</div>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div>
            <div className="text-sm text-slate-400 mb-1">Target Total</div>
            <div className="text-xl font-semibold text-white">₹36,00,000</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Overall Progress</div>
            <div className="text-xl font-semibold text-success-400">49.8%</div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const percent = (goal.current / goal.target) * 100;
          return (
            <div key={goal.id} className="glass-card p-6 group hover:border-white/15 transition-all relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: goal.color }} />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: `${goal.color}20`, border: `1px solid ${goal.color}40` }}>
                    {goal.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{goal.name}</h3>
                    <p className="text-sm text-slate-400">{goal.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{formatCurrency(goal.current)}</div>
                  <div className="text-xs text-slate-500">of {formatCurrency(goal.target)}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-slate-300">{percent.toFixed(1)}%</span>
                  <span className="text-slate-500">{formatCurrency(goal.target - goal.current)} left</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 relative" 
                    style={{ width: `${percent}%`, backgroundColor: goal.color }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Monthly</span>
                    <span className="text-sm font-medium text-white">{formatCurrency(goal.monthly)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Target Date</span>
                    <span className="text-sm font-medium text-white">{goal.date}</span>
                  </div>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex gap-3">
                <Zap className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">AI Insight:</strong> {goal.ai_insight}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_GOALS = [
  { 
    id: "g1", name: "Emergency Fund", description: "6 months of living expenses",
    icon: "🛡️", color: "#22c55e", current: 15000, target: 18000, monthly: 500, date: "Dec 2026",
    ai_insight: "You're ahead of schedule! Consider shifting ₹16,000/mo to your investment goal once you hit ₹12.8L."
  },
  { 
    id: "g2", name: "House Downpayment", description: "First home in Austin",
    icon: "🏡", color: "#6366f1", current: 6000, target: 20000, monthly: 800, date: "Jun 2027",
    ai_insight: "Cutting your dining out budget by 15% could help you reach this goal 2 months faster."
  },
  { 
    id: "g3", name: "New Laptop", description: "MacBook Pro M4",
    icon: "💻", color: "#d946ef", current: 1450, target: 2500, monthly: 200, date: "Nov 2026",
    ai_insight: "On track! A high-yield savings account could earn you an extra $20 while you save."
  },
  { 
    id: "g4", name: "Japan Trip", description: "2 week vacation",
    icon: "🗼", color: "#f59e0b", current: 0, target: 4500, monthly: 300, date: "Sep 2027",
    ai_insight: "Just started! Automating a $150 bi-weekly transfer aligns well with your paycheck schedule."
  },
];
