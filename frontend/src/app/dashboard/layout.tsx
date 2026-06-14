"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bell, Search } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] bg-slate-950/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search transactions, goals..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/[0.08] rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 rounded-xl bg-white/5 border border-white/[0.08] text-slate-400 hover:text-white hover:border-brand-500/30 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
            </button>

            {/* Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success-500/10 border border-success-500/20">
              <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-success-400 font-medium">Live</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
