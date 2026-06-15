"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/client";
import { formatCurrency, formatCompact, CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/utils/cn";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, MoreHorizontal, Download, FileText, Sparkles, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "react-hot-toast";

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", amount: "", transaction_type: "debit", category_id: "10", transaction_date: new Date().toISOString().split("T")[0]
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
      toast.success("Transaction added!");
      setIsAddModalOpen(false);
      setFormData({ ...formData, name: "", amount: "" });
    },
    onError: () => toast.error("Failed to add transaction"),
  });

  const handleExport = () => {
    const csvContent = "Date,Transaction,Merchant,Category,Type,Amount\n" + 
      filteredTransactions.map((t: any) => {
        const cat = CATEGORY_NAMES[t.category_id] || "Uncategorized";
        const date = format(new Date(t.transaction_date), "yyyy-MM-dd");
        return `"${date}","${t.name}","${t.merchant_name || ''}","${cat}","${t.transaction_type}",${t.amount}`;
      }).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions_export.csv";
    link.click();
    toast.success("Export successful!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const promise = transactionsApi.upload(file);
    toast.promise(promise, { loading: 'Uploading...', success: 'Statement queued for processing!', error: 'Failed to upload' });
    try { await promise; queryClient.invalidateQueries({ queryKey: ["transactions"] }); queryClient.invalidateQueries({ queryKey: ["transactions-summary"] }); } catch {}
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return toast.error("Please fill required fields");
    createMutation.mutate({
      ...formData, amount: parseFloat(formData.amount), category_id: parseInt(formData.category_id),
      transaction_date: new Date(formData.transaction_date).toISOString(), currency: "INR",
    });
  };

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.list().then(res => res.data).catch(() => MOCK_TRANSACTIONS),
    initialData: MOCK_TRANSACTIONS,
  });

  const { data: summaryData } = useQuery({
    queryKey: ["transactions-summary"],
    queryFn: () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      return transactionsApi.summary({ start_date: startOfMonth, end_date: endOfMonth }).then(res => res.data).catch(() => null);
    },
  });

  const transactions = transactionsData || [];

  const filteredTransactions = transactions.filter((t: any) => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.merchant_name && t.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayIncome = summaryData ? summaryData.total_income : filteredTransactions.reduce((acc: number, t: any) => {
    return t.transaction_type === "credit" ? acc + t.amount : acc;
  }, 0);

  const displayExpenses = summaryData ? summaryData.total_expenses : filteredTransactions.reduce((acc: number, t: any) => {
    return t.transaction_type === "debit" ? acc + t.amount : acc;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your income and expenses</p>
        </div>
                <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-ghost flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.pdf" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Statement</span>
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-gradient flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Income (This Month)</div>
          <div className="text-2xl font-bold text-success-400 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            {formatCurrency(displayIncome)}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-sm text-slate-400 mb-1">Total Expenses (This Month)</div>
          <div className="text-2xl font-bold text-danger-400 flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5" />
            {formatCurrency(displayExpenses)}
          </div>
        </div>
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/10 rounded-full blur-xl group-hover:bg-brand-500/20 transition-all"></div>
          <div className="text-sm text-slate-400 mb-1">AI Categorization</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            98.5%
          </div>
          <div className="text-xs text-brand-400 mt-1">Accuracy this month</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-dark pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Category
          </button>
          <button className="btn-ghost flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Date Range
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/[0.06] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Category</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Date</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredTransactions.map((t: any) => {
                const isDebit = t.transaction_type === "debit";
                const catName = t.category_id ? CATEGORY_NAMES[t.category_id] : "Uncategorized";
                const catIcon = CATEGORY_ICONS[catName] || "📦";
                const catColor = CATEGORY_COLORS[catName] || "#64748b";

                return (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors shadow-sm">
                          <span className="text-lg">{catIcon}</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{t.name}</div>
                          {t.merchant_name && (
                            <div className="text-xs text-slate-500 mt-0.5">{t.merchant_name}</div>
                          )}
                          {t.is_subscription && (
                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/20 uppercase tracking-wider">
                              Subscription
                            </span>
                          )}
                          {t.is_anomalous && (
                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-warning-500/20 text-warning-400 border border-warning-500/20 uppercase tracking-wider ml-1">
                              Review
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                        <span className="text-slate-300">{catName}</span>
                        {t.ai_category_confidence && t.ai_category_confidence > 0.9 && (
                          <span title={`AI Categorized (${t.ai_category_confidence*100}%)`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 opacity-60" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-400">
                      {format(new Date(t.transaction_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${isDebit ? "text-white" : "text-success-400"}`}>
                        {isDebit ? "-" : "+"}{formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-white/10 p-6 rounded-2xl z-50 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold text-white">Add Transaction</Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name / Description</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-dark w-full" placeholder="e.g. Grocery Store" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
                  <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-dark w-full" placeholder="0.00" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                  <select value={formData.transaction_type} onChange={e => setFormData({...formData, transaction_type: e.target.value})} className="input-dark w-full">
                    <option value="debit">Expense</option>
                    <option value="credit">Income</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="input-dark w-full">
                    {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                  <input type="date" value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} className="input-dark w-full" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-gradient flex-1">
                  {createMutation.isPending ? "Adding..." : "Add Transaction"}
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
const CATEGORY_NAMES: Record<number, string> = {
  1: "Food", 2: "Shopping", 3: "Utilities", 4: "Healthcare", 5: "Transportation",
  6: "Entertainment", 7: "Travel", 8: "Education", 9: "Investments", 10: "Miscellaneous"
};

const MOCK_TRANSACTIONS = [
  {
    id: "t1", name: "Hotstar Premium", merchant_name: "Disney+ Hotstar",
    amount: 1499, transaction_type: "debit", transaction_date: new Date().toISOString(),
    category_id: 6, is_subscription: true, is_anomalous: false, ai_category_confidence: 0.98
  },
  {
    id: "t2", name: "BigBasket Groceries", merchant_name: "BigBasket",
    amount: 3240, transaction_type: "debit", transaction_date: new Date(Date.now() - 86400000).toISOString(),
    category_id: 1, is_subscription: false, is_anomalous: false, ai_category_confidence: 0.95
  },
  {
    id: "t3", name: "Salary Credit", merchant_name: "Infosys Ltd",
    amount: 85000, transaction_type: "credit", transaction_date: new Date(Date.now() - 172800000).toISOString(),
    category_id: 9, is_subscription: false, is_anomalous: false, ai_category_confidence: 0.99
  },
  {
    id: "t4", name: "Ola Ride", merchant_name: "Ola Cabs",
    amount: 320, transaction_type: "debit", transaction_date: new Date(Date.now() - 259200000).toISOString(),
    category_id: 5, is_subscription: false, is_anomalous: false, ai_category_confidence: 0.96
  },
  {
    id: "t5", name: "iPhone 15 Pro", merchant_name: "Apple India",
    amount: 134900, transaction_type: "debit", transaction_date: new Date(Date.now() - 400000000).toISOString(),
    category_id: 2, is_subscription: false, is_anomalous: true, ai_category_confidence: 0.85
  },
  {
    id: "t6", name: "Electricity Bill", merchant_name: "BESCOM",
    amount: 1850, transaction_type: "debit", transaction_date: new Date(Date.now() - 500000000).toISOString(),
    category_id: 3, is_subscription: true, is_anomalous: false, ai_category_confidence: 0.97
  },
  {
    id: "t7", name: "Cult.fit Membership", merchant_name: "Cult.fit",
    amount: 2499, transaction_type: "debit", transaction_date: new Date(Date.now() - 600000000).toISOString(),
    category_id: 4, is_subscription: true, is_anomalous: false, ai_category_confidence: 0.94
  },
  {
    id: "t8", name: "Swiggy Order", merchant_name: "Swiggy",
    amount: 485, transaction_type: "debit", transaction_date: new Date(Date.now() - 700000000).toISOString(),
    category_id: 1, is_subscription: false, is_anomalous: false, ai_category_confidence: 0.92
  },
  {
    id: "t9", name: "Zomato Order", merchant_name: "Zomato",
    amount: 620, transaction_type: "debit", transaction_date: new Date(Date.now() - 800000000).toISOString(),
    category_id: 1, is_subscription: false, is_anomalous: false, ai_category_confidence: 0.93
  },
  {
    id: "t10", name: "Meesho Shopping", merchant_name: "Meesho",
    amount: 1290, transaction_type: "debit", transaction_date: new Date(Date.now() - 900000000).toISOString(),
    category_id: 2, is_subscription: false, is_anomalous: false, ai_category_confidence: 0.91
  },
];

