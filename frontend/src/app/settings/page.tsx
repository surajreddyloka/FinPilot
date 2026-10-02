"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, Key, CreditCard, Banknote, HelpCircle, Save, X, QrCode } from "lucide-react";
import { toast } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, authApi } from "@/lib/api/client";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const queryClient = useQueryClient();

  // Profile Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
  });

  // MFA State
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaToken, setMfaToken] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => usersApi.me().then(res => res.data),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        currency: user.currency || "INR",
        timezone: user.timezone || "Asia/Kolkata",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => usersApi.updateMe(data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const setupMfaMutation = useMutation({
    mutationFn: () => authApi.setupMfa().then(res => res.data),
    onSuccess: (data) => {
      setMfaSecret(data.secret);
      setMfaQrCode(data.qr_code_base64);
      setIsMfaModalOpen(true);
    },
    onError: () => {
      toast.error("Failed to initiate MFA setup");
    }
  });

  const verifyMfaMutation = useMutation({
    mutationFn: () => authApi.verifyMfa(mfaToken, mfaSecret).then(res => res.data),
    onSuccess: () => {
      toast.success("MFA enabled successfully");
      setIsMfaModalOpen(false);
      setMfaToken("");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: () => {
      toast.error("Invalid MFA token");
    }
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate({
      full_name: formData.full_name,
      currency: formData.currency,
      timezone: formData.timezone,
    });
  };

  const tabs = [
    { id: "profile", label: "Profile Details", icon: User },
    { id: "security", label: "Security & MFA", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "connections", label: "Bank Connections", icon: Banknote },
    { id: "billing", label: "Subscription", icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences and security</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-3 flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-500/15 text-brand-300 border border-brand-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 glass-card p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Need help?</h3>
                <p className="text-xs text-slate-400 mb-3">Our support team is available 24/7 to assist you.</p>
                <button onClick={() => toast("Contact Support coming soon")} className="text-xs text-brand-400 hover:text-brand-300 font-medium">Contact Support &rarr;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card p-6 md:p-8">
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Profile Details</h2>
                <p className="text-sm text-slate-400">Update your personal information and preferences.</p>
              </div>

              <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white shadow-glow-brand">
                  {formData.full_name ? formData.full_name.substring(0, 2).toUpperCase() : "U"}
                </div>
                <div>
                  <button onClick={() => toast("Change Avatar coming soon")} className="btn-ghost text-sm mb-2">Change Avatar</button>
                  <p className="text-xs text-slate-500">JPG, GIF or PNG. Max size of 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.full_name} 
                    onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))} 
                    className="input-dark" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    disabled 
                    className="input-dark opacity-70 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Preferred Currency</label>
                  <select 
                    value={formData.currency} 
                    onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))} 
                    className="input-dark appearance-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Timezone</label>
                  <select 
                    value={formData.timezone} 
                    onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))} 
                    className="input-dark appearance-none"
                  >
                    <option value="Asia/Kolkata">Indian Standard Time (IST)</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button 
                  onClick={handleProfileSave} 
                  disabled={updateProfileMutation.isPending}
                  className="btn-gradient flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Security & MFA</h2>
                <p className="text-sm text-slate-400">Keep your financial data secure.</p>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium mb-1">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-400">
                    {user?.mfa_enabled 
                      ? "MFA is currently enabled for your account." 
                      : "Add an extra layer of security to your account."}
                  </p>
                </div>
                <button 
                  onClick={() => user?.mfa_enabled ? toast("MFA is already enabled.") : setupMfaMutation.mutate()} 
                  disabled={user?.mfa_enabled || setupMfaMutation.isPending}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                    user?.mfa_enabled 
                      ? "bg-success-500/10 text-success-400 border border-success-500/20" 
                      : "btn-gradient disabled:opacity-50"
                  }`}
                >
                  {setupMfaMutation.isPending ? "Processing..." : user?.mfa_enabled ? "Enabled" : "Enable MFA"}
                </button>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <h3 className="text-white font-medium">Change Password</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Current Password</label>
                  <input type="password" placeholder="••••••••" className="input-dark max-w-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">New Password</label>
                  <input type="password" placeholder="••••••••" className="input-dark max-w-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="input-dark max-w-md" />
                </div>
                <button onClick={() => toast("Update Password coming soon")} className="btn-ghost mt-2">Update Password</button>
              </div>
            </div>
          )}

          {activeTab === "connections" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Bank Connections</h2>
                  <p className="text-sm text-slate-400">Manage your linked financial institutions via Plaid.</p>
                </div>
                <button onClick={() => toast("Add Account coming soon")} className="btn-gradient text-sm px-4 py-2">Add Account</button>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Chase Sapphire Reserve", type: "Credit Card", status: "Connected", sync: "2 hours ago" },
                  { name: "Bank of America Checking", type: "Checking", status: "Connected", sync: "5 hours ago" },
                ].map((bank, i) => (
                  <div key={i} className="p-5 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center">
                        <Banknote className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{bank.name}</h3>
                        <p className="text-xs text-slate-500">{bank.type} • Last synced {bank.sync}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-success-400 bg-success-500/10 px-2 py-1 rounded-md">
                        {bank.status}
                      </span>
                      <button onClick={() => toast("Disconnect coming soon")} className="text-xs text-danger-400 hover:text-danger-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Placeholders for Notifications and Billing tabs */}
          {(activeTab === "notifications" || activeTab === "billing") && (
            <div className="animate-fade-in text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Coming Soon</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                We are actively working on bringing this feature to you. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MFA Setup Modal */}
      {isMfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <button 
              onClick={() => setIsMfaModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-brand-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Setup Two-Factor Authentication</h2>
              <p className="text-sm text-slate-400 mb-6">
                Scan this QR code with your authenticator app (like Google Authenticator or Authy).
              </p>
              
              <div className="flex justify-center mb-6 bg-white p-4 rounded-xl">
                {mfaQrCode ? (
                  <img src={`data:image/png;base64,${mfaQrCode}`} alt="MFA QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-lg"></div>
                )}
              </div>
              
              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-1 font-medium text-center">Can't scan the QR code? Use this setup key:</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center text-sm font-mono text-white tracking-widest break-all">
                  {mfaSecret}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Enter 6-digit code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                  className="input-dark text-center text-lg tracking-[0.5em] font-mono mb-4" 
                />
                <button 
                  onClick={() => verifyMfaMutation.mutate()}
                  disabled={mfaToken.length !== 6 || verifyMfaMutation.isPending}
                  className="w-full btn-gradient py-2.5 disabled:opacity-50"
                >
                  {verifyMfaMutation.isPending ? "Verifying..." : "Verify and Enable"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
