import re

with open('frontend/src/app/transactions/page.tsx', 'r') as f:
    content = f.read()

# 1. Imports
imports = """import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/client";
import { formatCurrency, formatCompact, CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/utils/cn";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, MoreHorizontal, Download, FileText, Sparkles, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "react-hot-toast";"""

content = re.sub(r'import \{ useState \}.*?import \* as Dialog from "@radix-ui/react-dialog";', imports, content, flags=re.DOTALL)

# 2. Handlers
handlers = """export default function TransactionsPage() {
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
      toast.success("Transaction added!");
      setIsAddModalOpen(false);
      setFormData({ ...formData, name: "", amount: "" });
    },
    onError: () => toast.error("Failed to add transaction"),
  });

  const handleExport = () => {
    const csvContent = "Date,Transaction,Merchant,Category,Type,Amount\\n" + 
      filteredTransactions.map((t: any) => {
        const cat = CATEGORY_NAMES[t.category_id] || "Uncategorized";
        const date = format(new Date(t.transaction_date), "yyyy-MM-dd");
        return `"${date}","${t.name}","${t.merchant_name || ''}","${cat}","${t.transaction_type}",${t.amount}`;
      }).join("\\n");
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
    try { await promise; queryClient.invalidateQueries({ queryKey: ["transactions"] }); } catch {}
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

  const { data: transactionsData, isLoading } ="""

content = re.sub(r'export default function TransactionsPage\(\) \{.*?(?=const \{ data: transactionsData, isLoading \} =)', handlers, content, flags=re.DOTALL)

# 3. Buttons
buttons = """        <div className="flex items-center gap-3">
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
          >"""

content = re.sub(r'<div className="flex items-center gap-3">.*?className="btn-gradient flex items-center gap-2"\s*>', buttons, content, flags=re.DOTALL)

# 4. Modal
modal = """      </div>

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
}"""

content = re.sub(r'      </div>\s*</div>\s*\);\s*\}', modal, content)

with open('frontend/src/app/transactions/page.tsx', 'w') as f:
    f.write(content)
