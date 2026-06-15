"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi } from "@/lib/api/client";
import { Bot, Send, User, Sparkles, TrendingUp, PiggyBank, AlertTriangle, BarChart3, Zap, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils/cn";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { Sidebar } from "@/components/layout/sidebar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  chart_data?: {
    type: "pie" | "bar" | "line";
    title: string;
    data: any[];
  };
  suggestions?: string[];
  created_at: string;
}

const CHART_COLORS = ["#6366f1", "#d946ef", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#8b5cf6"];

function ChartWidget({ chart }: { chart: Message["chart_data"] }) {
  if (!chart) return null;
  return (
    <div className="mt-3 p-4 rounded-xl bg-slate-900/60 border border-white/[0.06]">
      <p className="text-xs font-semibold text-slate-400 mb-3">{chart.title}</p>
      <ResponsiveContainer width="100%" height={200}>
        {chart.type === "pie" ? (
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={0}>
              {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: any) => formatCurrency(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
          </PieChart>
        ) : chart.type === "bar" ? (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="category" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
            <Tooltip formatter={(v: any) => formatCurrency(v)} />
            <Bar dataKey="recommended" fill="#6366f1" radius={[4, 4, 0, 0]} name="Recommended" />
            <Bar dataKey="current" fill="#d946ef" radius={[4, 4, 0, 0]} name="Current" />
          </BarChart>
        ) : (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="savings" stroke="#d946ef" strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-slide-up`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isUser ? "bg-brand-500" : "bg-gradient-to-br from-brand-500 to-accent-500"}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div className={`px-4 py-3 rounded-2xl ${isUser ? "bg-brand-500 text-white rounded-tr-md" : "bg-white/[0.05] border border-white/[0.08] text-slate-200 rounded-tl-md"}`}>
          <div className="text-sm leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
        </div>
        {!isUser && message.chart_data && <ChartWidget chart={message.chart_data} />}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.suggestions.map((s, i) => (
              <button key={i} className="text-xs px-3 py-1.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/25 hover:bg-brand-500/25 transition-all">
                {s}
              </button>
            ))}
          </div>
        )}
        <span className="text-[10px] text-slate-600">{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

const STARTER_PROMPTS = [
  { icon: TrendingUp, text: "Where did I spend the most this month?" },
  { icon: PiggyBank, text: "How much can I save in 6 months?" },
  { icon: AlertTriangle, text: "What subscriptions should I cancel?" },
  { icon: BarChart3, text: "Generate my AI budget for next month" },
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `👋 **Welcome to FinPilot AI Copilot!**

I'm your intelligent financial assistant powered by AI. I have access to your real financial data and can help you:

• 📊 **Analyze spending** — where your money is going
• 💰 **Savings advice** — personalized recommendations  
• 🎯 **Goal tracking** — progress toward your goals
• 🔮 **Forecasting** — predict future finances
• 📋 **Subscriptions** — find savings opportunities
• 🏆 **Health scoring** — improve your financial score

**Try one of the suggestions below, or ask me anything!**`,
  suggestions: STARTER_PROMPTS.map((p) => p.text),
  created_at: new Date().toISOString(),
};

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => aiApi.chat(message, conversationId).then((r) => r.data),
    onMutate: (message) => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
    },
    onSuccess: (data) => {
      if (data.conversation_id) setConversationId(data.conversation_id);
      const aiMsg: Message = {
        id: data.message_id || Date.now().toString(),
        role: "assistant",
        content: data.response,
        chart_data: data.chart_data,
        suggestions: data.suggestions,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    },
    onError: () => {
      const errMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "⚠️ I couldn't connect to the AI service right now. Please ensure the backend is running and your OpenAI API key is configured.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    },
  });

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate(msg);
    inputRef.current?.focus();
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    setTimeout(() => {
      setInput("");
      sendMutation.mutate(text);
    }, 100);
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-slate-950/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow-brand">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white flex items-center gap-2">
                FinPilot AI Copilot
                <span className="badge-brand text-[9px]">GPT-4o</span>
              </h1>
              <p className="text-xs text-slate-500">Your intelligent financial assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-500/10 border border-success-500/20">
              <span className="w-1.5 h-1.5 bg-success-400 rounded-full animate-pulse" />
              <span className="text-xs text-success-400 font-medium">Online</span>
            </div>
            <button
              onClick={() => { setMessages([WELCOME_MESSAGE]); setConversationId(undefined); }}
              className="p-2 rounded-xl bg-white/5 border border-white/[0.08] text-slate-400 hover:text-white transition-all"
              title="New conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Loading indicator */}
          {sendMutation.isPending && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.08]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Starter Prompts */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3 flex gap-2 flex-wrap">
            {STARTER_PROMPTS.map((prompt, i) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSuggestion(prompt.text)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 hover:bg-brand-500/15 hover:border-brand-500/30 hover:text-brand-300 transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {prompt.text}
                </button>
              );
            })}
          </div>
        )}

        {/* Input */}
        <div className="px-6 pb-6 pt-2 flex-shrink-0">
          <div className="flex gap-3 p-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask about your finances... (e.g., 'Where did I spend the most?')"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white disabled:opacity-30 hover:opacity-90 transition-all flex-shrink-0"
            >
              {sendMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2">
            FinPilot AI uses your financial data to provide personalized insights. Responses may not be financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
