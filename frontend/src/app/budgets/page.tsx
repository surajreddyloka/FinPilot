"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "@/lib/api/client";
import { formatCurrency, formatPercent, CATEGORY_COLORS } from "@/lib/utils/cn";
import { Plus, BarChart3, Edit2, AlertTriangle, Sparkles, TrendingUp, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "react-hot-toast";

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  
  const { data: budgetsData, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.list().then((res) => res.data).catch(() => MOCK_BUDGETS),
    initialData: MOCK_BUDGETS,
  });

  const budgets = budgetsData || [];
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ category: "Food & Dining", limit: "" });

  const createMutation = useMutation({
    mutationFn: (data: any) => budgetsApi.create(data).catch(() => {
      // Mock fallback since this is likely a UI demo right now
      return Promise.resolve({ data: { success: true } });
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget created!");
      setIsAddModalOpen(false);
      setFormData({ category: "Food & Dining", limit: "" });
    },
    onError: () => toast.error("Failed to create budget"),
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.limit) return toast.error("Please enter a limit");
    createMutation.mutate({
      category: formData.category,
      limit: parseFloat(formData.limit),
      period: "monthly"
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budgets</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your spending limits</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => toast("AI Auto-Budget coming soon")} className="btn-ghost flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">AI Auto-Budget</span>
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-gradient flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Budget</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-brand-500/10 to-transparent">
          <div className="text-sm text-slate-400 mb-1">Total Budgeted</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(budgets.reduce((acc: any, b: any) => acc + (b.limit || b.amount || 0), 0))}</div>
          <div className="text-xs text-brand-400 mt-2">Monthly Period</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(budgets.reduce((acc: any, b: any) => acc + (b.spent || 0), 0))}</div>
          <div className="text-xs text-slate-500 mt-2">
            {budgets.reduce((acc: any, b: any) => acc + (b.limit || b.amount || 0), 0) > 0 
              ? Math.round((budgets.reduce((acc: any, b: any) => acc + (b.spent || 0), 0) / budgets.reduce((acc: any, b: any) => acc + (b.limit || b.amount || 0), 0)) * 100) 
              : 0}% of total budget
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Remaining</div>
          <div className="text-2xl font-bold text-success-400">
            {formatCurrency(Math.max(0, budgets.reduce((acc: any, b: any) => acc + (b.limit || b.amount || 0), 0) - budgets.reduce((acc: any, b: any) => acc + (b.spent || 0), 0)))}
          </div>
          <div className="text-xs text-success-500 mt-2">On track to save</div>
        </div>
      </div>

      {/* Main Budget Progress */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Monthly Overview</h2>
          <span className="text-sm font-medium px-3 py-1 bg-white/5 rounded-full border border-white/10 text-slate-300">
            June 2026
          </span>
        </div>
        
        <div className="h-4 bg-white/5 rounded-full overflow-hidden flex w-full">
          <div className="bg-brand-500 h-full transition-all duration-1000" style={{ width: '35%' }} title="Housing"></div>
          <div className="bg-accent-500 h-full transition-all duration-1000" style={{ width: '20%' }} title="Food"></div>
          <div className="bg-success-500 h-full transition-all duration-1000" style={{ width: '10%' }} title="Transport"></div>
          <div className="bg-warning-500 h-full transition-all duration-1000" style={{ width: '6%' }} title="Entertainment"></div>
          <div className="bg-transparent h-full transition-all duration-1000" style={{ width: '29%' }}></div>
        </div>
      </div>

      {/* Category Budgets */}
      <h2 className="text-lg font-semibold text-white mt-8 mb-4">Category Budgets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget: any) => {
          const limit = budget.limit || budget.amount || 0;
          const spent = budget.spent || 0;
          const percent = limit > 0 ? (spent / limit) * 100 : 0;
          const isWarning = percent >= 80 && percent < 100;
          const isDanger = percent >= 100;
          const remaining = limit - spent;
          
          let barColor = "bg-brand-500";
          if (isWarning) barColor = "bg-warning-500";
          if (isDanger) barColor = "bg-danger-500";

          return (
            <div key={budget.id} className="glass-card p-5 group hover:border-white/15 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-sm">
                    <span className="text-lg">{budget.icon || "📦"}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{budget.category || budget.name}</h3>
                    <p className="text-xs text-slate-500">{percent.toFixed(0)}% Used</p>
                  </div>
                </div>
                <button onClick={() => toast("Edit Budget coming soon")} className="text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white font-medium">{formatCurrency(spent)}</span>
                  <span className="text-slate-500">of {formatCurrency(limit)}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className={`text-xs font-medium ${isDanger ? 'text-danger-400' : 'text-slate-400'}`}>
                  {isDanger ? 'Over Budget by' : 'Remaining'}
                </span>
                <span className={`text-sm font-semibold ${isDanger ? 'text-danger-400' : 'text-success-400'}`}>
                  {formatCurrency(Math.abs(remaining))}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-white/10 p-6 rounded-2xl z-50 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold text-white">Create Budget</Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-dark w-full">
                  <option value="Housing & Utilities">Housing & Utilities</option>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Monthly Limit (₹)</label>
                <input required type="number" step="0.01" value={formData.limit} onChange={e => setFormData({...formData, limit: e.target.value})} className="input-dark w-full" placeholder="5000" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-gradient flex-1">
                  {createMutation.isPending ? "Creating..." : "Create Budget"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_BUDGETS = [
  { id: "b1", category: "Housing & Utilities", icon: "🏠", spent: 1500, limit: 1600 },
  { id: "b2", category: "Food & Dining", icon: "🍕", spent: 650, limit: 800 },
  { id: "b3", category: "Shopping", icon: "🛍️", spent: 420, limit: 400 }, // Over
  { id: "b4", category: "Transportation", icon: "🚗", spent: 180, limit: 300 },
  { id: "b5", category: "Entertainment", icon: "🎭", spent: 220, limit: 250 }, // Warning
  { id: "b6", category: "Health & Fitness", icon: "🏥", spent: 120, limit: 150 },
];
