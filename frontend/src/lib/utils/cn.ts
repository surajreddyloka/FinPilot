import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatCompact(num: number): string {
  if (Math.abs(num) >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (Math.abs(num) >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-success-400";
  if (score >= 65) return "text-brand-400";
  if (score >= 50) return "text-warning-400";
  return "text-danger-400";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Work";
  return "Critical";
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Food": "#6366f1",
  "Shopping": "#d946ef",
  "Utilities": "#3b82f6",
  "Healthcare": "#10b981",
  "Transportation": "#f59e0b",
  "Entertainment": "#ec4899",
  "Travel": "#14b8a6",
  "Education": "#8b5cf6",
  "Investments": "#22c55e",
  "Miscellaneous": "#64748b",
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Food": "🍕",
  "Shopping": "🛍️",
  "Utilities": "⚡",
  "Healthcare": "🏥",
  "Transportation": "🚗",
  "Entertainment": "🎭",
  "Travel": "✈️",
  "Education": "📚",
  "Investments": "📈",
  "Miscellaneous": "📦",
};
