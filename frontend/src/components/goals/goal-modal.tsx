import { useState } from "react";
import { goalsApi } from "@/lib/api/client";
import { X, Target, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GoalModal({ isOpen, onClose, onSuccess }: GoalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: "",
    monthly_contribution: "",
    target_date: "",
    icon: "🎯",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await goalsApi.create({
        name: formData.name,
        description: formData.description || null,
        target_amount: parseFloat(formData.target_amount),
        monthly_contribution: formData.monthly_contribution ? parseFloat(formData.monthly_contribution) : null,
        target_date: formData.target_date ? new Date(formData.target_date).toISOString() : null,
        icon: formData.icon,
      });
      toast.success("Goal created successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card w-full max-w-lg p-6 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create New Goal</h2>
            <p className="text-sm text-slate-400">Set a new financial milestone</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Goal Name *</label>
            <input
              required
              type="text"
              placeholder="e.g., Emergency Fund"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g., 6 months of living expenses"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="10000"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Monthly Contribution</label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="500"
                  value={formData.monthly_contribution}
                  onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value })}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Date</label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Icon Emoji</label>
              <input
                type="text"
                maxLength={2}
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gradient px-6 py-2.5 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              <span>Create Goal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
