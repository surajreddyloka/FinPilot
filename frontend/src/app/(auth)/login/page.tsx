"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, usersApi } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth-store";
import { Sparkles, Eye, EyeOff, Mail, Lock, ArrowRight, Globe, Code } from "lucide-react";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password, mfaToken || undefined);

      if (data.mfa_required) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      setTokens(data.access_token, data.refresh_token);

      // Fetch user profile
      const { data: user } = await usersApi.me();
      setUser(user);

      toast.success("Welcome back! 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Login failed. Please check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Demo login shortcut
  const demoLogin = async () => {
    setEmail("demo@finpilot.ai");
    setPassword("Demo@12345!");
    // Use mock user for demo
    setTokens("demo_token", "demo_refresh");
    setUser({
      id: "demo-user-1",
      email: "demo@finpilot.ai",
      full_name: "Alex Johnson",
      role: "user",
      is_active: true,
      is_verified: true,
      mfa_enabled: false,
      avatar_url: undefined,
      currency: "INR",
      theme: "dark",
    });
    toast.success("Welcome to the demo! 🚀");
    router.push("/dashboard");
  };

  const handleOAuth = (provider: string) => {
    toast.loading(`Redirecting to ${provider}...`, { duration: 1500 });
    setTimeout(() => {
      demoLogin();
    }, 1500);
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

      {/* Right Panel — Login Form */}
      <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center px-8 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white">FinPilot AI</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to your FinPilot account</p>

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
                    
                    // Fetch user profile
                    const { data: user } = await usersApi.me();
                    setUser(user);
                    
                    toast.success("Welcome back! 🎉");
                    router.push("/dashboard");
                  } catch (err: any) {
                    const msg = err?.response?.data?.detail || "Google login failed.";
                    toast.error(msg);
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  toast.error("Google Login Failed");
                }}
                theme="filled_black"
                shape="rectangular"
                text="signin_with"
              />
            </div>
            <button type="button" onClick={() => handleOAuth("GitHub")} className="btn-ghost flex items-center justify-center gap-2 h-10 rounded-xl">
              <Code className="w-5 h-5" />
              <span>GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-slate-600">or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
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
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-dark pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mfaRequired && (
              <div className="animate-slide-up">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">MFA Code</label>
                <input
                  id="login-mfa"
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  placeholder="6-digit code"
                  className="input-dark text-center tracking-widest text-lg"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-slate-500 mt-1">Enter the code from your authenticator app</p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-brand-400 hover:text-brand-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Login */}
          <button
            onClick={demoLogin}
            id="demo-login"
            className="w-full mt-3 py-3 rounded-xl border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/10 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Try Demo (No Account Required)
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
