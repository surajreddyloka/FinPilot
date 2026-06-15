"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/cn";
import { Plus, Target, TrendingUp, Calendar, Zap, Loader2 } from "lucide-react";
import { GoalModal } from "@/components/goals/goal-modal";
import { goalsApi } from "@/lib/api/client";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number | null;
  target_date: string | null;
  status: string;
  icon: string | null;
  progress_percentage: number;
  months_to_goal: number | null;
}

const COLORS = ["#22c55e", "#6366f1", "#d946ef", "#f59e0b", "#ef4444", "#06b6d4"];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const { data } = await goalsApi.list();
      setGoals(data);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const totalSaved = goals.reduce((acc, goal) => acc + goal.current_amount, 0);
  const totalTarget = goals.reduce((acc, goal) => acc + goal.target_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Savings Goals</h1>
          <p className="text-slate-400 text-sm mt-1">Track and achieve your financial milestones</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-gradient flex items-center gap-2 w-max"
        >
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
            <div className="text-3xl font-bold text-white mt-1">{formatCurrency(totalSaved)}</div>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div>
            <div className="text-sm text-slate-400 mb-1">Target Total</div>
            <div className="text-xl font-semibold text-white">{formatCurrency(totalTarget)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Overall Progress</div>
            <div className="text-xl font-semibold text-success-400">{overallProgress.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-12 text-center border-dashed border-white/20">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-white mb-2">No goals yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create your first savings goal to start tracking your progress towards financial freedom.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-gradient flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal, index) => {
            const color = COLORS[index % COLORS.length];
            const percent = goal.progress_percentage;
            
            const formattedDate = goal.target_date 
              ? new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "Ongoing";

            return (
              <div key={goal.id} className="glass-card p-6 group hover:border-white/15 transition-all relative overflow-hidden">
                {/* Background accent */}
                <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: color }} />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
                      {goal.icon || "🎯"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{goal.name}</h3>
                      <p className="text-sm text-slate-400 line-clamp-1">{goal.description || "Savings goal"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{formatCurrency(goal.current_amount)}</div>
                    <div className="text-xs text-slate-500">of {formatCurrency(goal.target_amount)}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium text-slate-300">{percent.toFixed(1)}%</span>
                    <span className="text-slate-500">{formatCurrency(goal.target_amount - goal.current_amount)} left</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 relative" 
                      style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
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
                      <span className="text-sm font-medium text-white">{goal.monthly_contribution ? formatCurrency(goal.monthly_contribution) : "—"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Target Date</span>
                      <span className="text-sm font-medium text-white">{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Placeholder */}
                <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex gap-3">
                  <Zap className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">AI Insight:</strong> Keep consistently saving towards your target to ensure you reach your goal on time.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Creation Modal */}
      <GoalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchGoals} 
      />
    </div>
  );
}
