"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, usersApi } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";
import { Sparkles, Eye, EyeOff, Mail, Lock, User, ArrowRight, Code } from "lucide-react";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Register the user
      await authApi.register(email, password, fullName);
      
      // 2. Automatically log them in after successful registration
      const { data } = await authApi.login(email, password);
      setTokens(data.access_token, data.refresh_token);

      // 3. Fetch user profile
      const { data: user } = await usersApi.me();
      setUser(user);

      toast.success("Account created successfully! 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-brand-950 to-slate-950 items-center justify-center p-12">
        {/* Background orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-brand mx-auto flex items-center justify-center shadow-glow-brand mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-display font-bold text-white mb-4">
            FinPilot <span className="gradient-text">AI</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Your enterprise-grade AI financial copilot. Track, optimize, and grow your wealth with intelligent automation.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              "🤖 AI Financial Copilot",
              "📊 Smart Analytics",
              "🎯 Goal Tracking",
              "⚡ Anomaly Detection",
              "📋 Subscription Intel",
              "🔮 Financial Forecasting",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/[0.06]">
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center px-8 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white">FinPilot AI</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-2">Create an account</h2>
          <p className="text-slate-400 text-sm mb-8">Start your journey to financial freedom</p>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6 items-center">
            <div className="overflow-hidden rounded-xl">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    setLoading(true);
                    if (!credentialResponse.credential) throw new Error("No credential");
                    const { data } = await authApi.googleLogin(credentialResponse.credential);
                    setTokens(data.access_token, data.refresh_token);
                    
                    const { data: user } = await usersApi.me();
                    setUser(user);
                    
                    toast.success("Welcome! 🎉");
                    router.push("/dashboard");
                  } catch (err: any) {
                    const msg = err?.response?.data?.detail || "Google signup failed.";
                    toast.error(msg);
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  toast.error("Google Signup Failed");
                }}
                theme="filled_black"
                shape="rectangular"
                text="signup_with"
              />
            </div>
            <button type="button" onClick={() => toast.success("GitHub OAuth coming soon!")} className="btn-ghost flex items-center justify-center gap-2 h-10 rounded-xl">
              <Code className="w-5 h-5" />
              <span>GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-slate-600">or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="input-dark pl-10"
                  required
                  autoComplete="name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-dark pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-dark pl-10 pr-10"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Must be at least 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="register-submit"
              className="btn-gradient w-full flex items-center justify-center gap-2 py-3 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
