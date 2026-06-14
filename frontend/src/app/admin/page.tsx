"use client";

import { useState } from "react";
import { Users, Activity, ShieldAlert, Settings, Search, MoreVertical } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Admin Portal
            <span className="badge-danger text-xs px-2 py-0.5">Superadmin</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform overview and system health</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: "overview", label: "Overview" },
          { id: "users", label: "User Management" },
          { id: "audit", label: "Audit Logs" },
          { id: "system", label: "System Health" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400"><Users className="w-4 h-4" /></div>
                <div className="text-sm text-slate-400">Total Users</div>
              </div>
              <div className="text-3xl font-bold text-white">12,450</div>
              <div className="text-xs text-success-400 mt-2">+340 this week</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent-500/20 text-accent-400"><Activity className="w-4 h-4" /></div>
                <div className="text-sm text-slate-400">Active Subscriptions</div>
              </div>
              <div className="text-3xl font-bold text-white">4,820</div>
              <div className="text-xs text-success-400 mt-2">+12% MRR growth</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-success-500/20 text-success-400"><ShieldAlert className="w-4 h-4" /></div>
                <div className="text-sm text-slate-400">System Uptime</div>
              </div>
              <div className="text-3xl font-bold text-white">99.99%</div>
              <div className="text-xs text-slate-500 mt-2">All systems operational</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-warning-500/20 text-warning-400"><Settings className="w-4 h-4" /></div>
                <div className="text-sm text-slate-400">Pending Alerts</div>
              </div>
              <div className="text-3xl font-bold text-white">3</div>
              <div className="text-xs text-warning-400 mt-2">Requires review</div>
            </div>
          </div>

          {/* Recent Registrations Table */}
          <h2 className="text-lg font-semibold text-white mt-8 mb-4">Recent Registrations</h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-white/5 border-b border-white/[0.06] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {[
                  { name: "Sarah Connor", email: "sarah@example.com", date: new Date(), plan: "Premium" },
                  { name: "John Smith", email: "john@example.com", date: new Date(Date.now() - 86400000), plan: "Free" },
                  { name: "Emma Watson", email: "emma@example.com", date: new Date(Date.now() - 172800000), plan: "Premium" },
                ].map((user, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                    <td className="px-6 py-4 text-slate-400">{user.email}</td>
                    <td className="px-6 py-4 text-slate-400">{format(user.date, "MMM dd, yyyy")}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs border ${user.plan === "Premium" ? "bg-brand-500/20 text-brand-300 border-brand-500/30" : "bg-white/5 text-slate-300 border-white/10"}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-slate-500 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Placeholders for other tabs */}
      {activeTab !== "overview" && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Under Construction</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            This module is currently being built. Please check the overview tab for active metrics.
          </p>
        </div>
      )}
    </div>
  );
}
