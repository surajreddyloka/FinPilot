import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { GoogleAuthProvider } from "@/components/providers/google-auth-provider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FinPilot AI — AI-Powered Personal Finance",
    template: "%s | FinPilot AI",
  },
  description:
    "FinPilot AI is your enterprise-grade AI-powered personal finance assistant. Track spending, optimize budgets, detect anomalies, and get personalized financial coaching.",
  keywords: ["personal finance", "AI finance", "budget tracker", "financial health", "money management"],
  authors: [{ name: "FinPilot AI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://finpilot.ai",
    siteName: "FinPilot AI",
    title: "FinPilot AI — AI-Powered Personal Finance",
    description: "Your intelligent finance copilot. Track, analyze, and optimize your finances with AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinPilot AI",
    description: "AI-Powered Personal Finance Assistant",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <GoogleAuthProvider>
              {children}
              <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "rgba(15,23,42,0.95)",
                  color: "#f1f5f9",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "12px",
                  backdropFilter: "blur(16px)",
                },
                success: { iconTheme: { primary: "#22c55e", secondary: "#0f172a" } },
                error: { iconTheme: { primary: "#ef4444", secondary: "#0f172a" } },
              }}
            />
            </GoogleAuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
