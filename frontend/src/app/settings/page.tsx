"use client";

import { useState } from "react";
import { User, Bell, Shield, Key, CreditCard, Banknote, HelpCircle, Save } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile Details", icon: User },
    { id: "security", label: "Security & MFA", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "connections", label: "Bank Connections", icon: Banknote },
    { id: "billing", label: "Subscription", icon: CreditCard },
  ];

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
                <button className="text-xs text-brand-400 hover:text-brand-300 font-medium">Contact Support &rarr;</button>
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
                  AJ
                </div>
                <div>
                  <button className="btn-ghost text-sm mb-2">Change Avatar</button>
                  <p className="text-xs text-slate-500">JPG, GIF or PNG. Max size of 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                  <input type="text" defaultValue="Alex Johnson" className="input-dark" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                  <input type="email" defaultValue="alex@example.com" className="input-dark" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Preferred Currency</label>
                  <select className="input-dark appearance-none">
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Timezone</label>
                  <select className="input-dark appearance-none">
                    <option value="Asia/Kolkata">Indian Standard Time (IST)</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button className="btn-gradient flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
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
                  <p className="text-sm text-slate-400">Add an extra layer of security to your account.</p>
                </div>
                <button className="btn-gradient px-4 py-2 text-sm">Enable MFA</button>
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
                <button className="btn-ghost mt-2">Update Password</button>
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
                <button className="btn-gradient text-sm px-4 py-2">Add Account</button>
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
                      <button className="text-xs text-danger-400 hover:text-danger-300 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}
