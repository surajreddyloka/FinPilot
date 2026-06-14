"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  PiggyBank,
  Target,
  Bot,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuthStore, useUIStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/goals", label: "Savings Goals", icon: Target },
  { href: "/ai-copilot", label: "AI Copilot", icon: Bot, badge: "AI" },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-slate-950/80 backdrop-blur-xl border-r border-white/[0.06] transition-all duration-300 ease-in-out flex-shrink-0",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in">
            <span className="font-display font-bold text-white text-lg leading-none">FinPilot</span>
            <span className="block text-[10px] text-brand-400 font-medium tracking-widest uppercase">AI</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-brand-500/50 transition-all duration-200 z-10"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link group",
                isActive && "active",
                !sidebarOpen && "justify-center px-2"
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300")} />
              {sidebarOpen && (
                <span className="flex-1 animate-fade-in">{item.label}</span>
              )}
              {sidebarOpen && item.badge && (
                <span className="badge-brand text-[9px] animate-fade-in">{item.badge}</span>
              )}
            </Link>
          );
        })}

        {/* AI Insights promo */}
        {sidebarOpen && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-500/10 border border-brand-500/20 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold text-brand-300">AI Insight</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your spending is 12% lower than last month. Keep it up! 🎉
            </p>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link group", isActive && "active", !sidebarOpen && "justify-center px-2")}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
              {sidebarOpen && <span className="animate-fade-in">{item.label}</span>}
            </Link>
          );
        })}

        {/* User Avatar */}
        <button
          onClick={handleLogout}
          className={cn(
            "sidebar-link w-full group mt-2 hover:bg-danger-500/10 hover:text-danger-400 hover:border-danger-500/20",
            !sidebarOpen && "justify-center px-2"
          )}
          title={!sidebarOpen ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="animate-fade-in">Logout</span>}
        </button>

        {sidebarOpen && user && (
          <div className="mt-3 px-2 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
              {user.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
