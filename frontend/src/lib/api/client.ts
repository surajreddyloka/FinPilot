import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — auto-refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── API Methods ──────────────────────────────────────────────────────────────

// Auth
export const authApi = {
  login: (email: string, password: string, mfaToken?: string) =>
    api.post("/auth/login", { email, password, mfa_token: mfaToken }),
  googleLogin: (credential: string) => api.post("/auth/google", { credential }),
  register: (email: string, password: string, fullName: string) =>
    api.post("/auth/register", { email, password, full_name: fullName }),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refresh_token: refreshToken }),
  setupMfa: () => api.post("/auth/mfa/setup"),
  verifyMfa: (token: string, secret: string) =>
    api.post("/auth/mfa/verify", { token, secret }),
};

// Users
export const usersApi = {
  me: () => api.get("/users/me"),
  updateMe: (data: Record<string, unknown>) => api.patch("/users/me", data),
  list: (skip = 0, limit = 50) => api.get(`/users?skip=${skip}&limit=${limit}`),
};

// Accounts
export const accountsApi = {
  list: () => api.get("/accounts"),
  create: (data: Record<string, unknown>) => api.post("/accounts", data),
  totalBalance: () => api.get("/accounts/total-balance"),
};

// Transactions
export const transactionsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/transactions", { params }),
  create: (data: Record<string, unknown>) => api.post("/transactions", data),
  summary: (params?: Record<string, unknown>) =>
    api.get("/transactions/summary", { params }),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/transactions/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Budgets
export const budgetsApi = {
  list: () => api.get("/budgets"),
  create: (data: Record<string, unknown>) => api.post("/budgets", data),
};

// Goals
export const goalsApi = {
  list: () => api.get("/goals"),
  create: (data: Record<string, unknown>) => api.post("/goals", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/goals/${id}`, data),
};

// AI
export const aiApi = {
  chat: (message: string, conversationId?: string) =>
    api.post("/ai/chat", { message, conversation_id: conversationId }),
  conversations: () => api.get("/ai/conversations"),
  messages: (conversationId: string) =>
    api.get(`/ai/conversations/${conversationId}/messages`),
  healthScore: () => api.post("/ai/analyze/health-score"),
  budget: () => api.post("/ai/analyze/budget"),
  subscriptions: () => api.post("/ai/analyze/subscriptions"),
  anomalies: () => api.post("/ai/analyze/anomalies"),
  forecast: (months = 6) => api.post(`/ai/analyze/forecast?months=${months}`),
};

// Analytics
export const analyticsApi = {
  overview: () => api.get("/analytics/overview"),
  spendingTrend: (months = 6) =>
    api.get(`/analytics/spending-trend?months=${months}`),
  categoryBreakdown: (params?: Record<string, unknown>) =>
    api.get("/analytics/category-breakdown", { params }),
};

// Notifications
export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get(`/notifications?unread_only=${unreadOnly}`),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/mark-all-read"),
};

// Reports
export const reportsApi = {
  list: () => api.get("/reports"),
  generate: (type: string) =>
    api.post(`/reports/generate?report_type=${type}`),
};

// Admin
export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  auditLogs: (skip = 0, limit = 50) =>
    api.get(`/admin/audit-logs?skip=${skip}&limit=${limit}`),
};
