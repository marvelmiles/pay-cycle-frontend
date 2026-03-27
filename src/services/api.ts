import { ConfirmPaymentProps, DebitCard } from "@/types/payment";
import { Customer } from "@/types/user";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    const token = localStorage.getItem("accessToken");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post("/api/v1/auth/refresh", {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        // window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ==================== AUTH ====================
export const authService = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
  }) => api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
};

// ==================== PROFILE ====================
export const profileService = {
  getMe: () => api.get("/profile/me"),
  updateProfile: (data: FormData | Record<string, unknown>) =>
    api.put("/profile/me", data),
  updateBusiness: (id: string, data: FormData | Record<string, unknown>) =>
    api.put(`/profile/business/${id}`, data),
};

// ==================== PRODUCTS ====================
export const productService = {
  list: (params?: Record<string, unknown>) => api.get("/products", { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post("/products", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ==================== CUSTOMERS ====================
export const customerService = {
  list: (params?: Record<string, unknown>) => api.get("/customers", { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: Record<string, unknown>) => api.post("/customers", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/customers/${id}`, data),
};

// ==================== TRANSACTIONS ====================
export const transactionService = {
  list: (params?: Record<string, unknown>) =>
    api.get("/transactions", { params }),
  get: (id: string) => api.get(`/transactions/${id}`),
  initiate: (data: Record<string, unknown>) =>
    api.post("/transactions/initiate", data),
  verify: (reference: string) => api.get(`/transactions/verify/${reference}`),
};

// ==================== SUBSCRIPTIONS ====================
export const subscriptionService = {
  list: (params?: Record<string, unknown>) =>
    api.get("/subscriptions", { params }),
  get: (id: string) => api.get(`/subscriptions/${id}`),
  cancel: (id: string, data?: Record<string, unknown>) =>
    api.post(`/subscriptions/${id}/cancel`, data),
  pause: (id: string) => api.post(`/subscriptions/${id}/pause`),
  resume: (id: string) => api.post(`/subscriptions/${id}/resume`),
};

// ==================== ANALYTICS ====================
export const analyticsService = {
  dashboard: () => api.get("/analytics/dashboard"),
  revenue: (period?: string) =>
    api.get("/analytics/revenue", { params: { period } }),
};

// ==================== PAYMENT LINKS ====================
export const paymentLinkService = {
  list: (params?: Record<string, unknown>) =>
    api.get("/payment-links", { params }),
  get: (id: string) => api.get(`/payment-links/${id}`),
  create: (data: Record<string, unknown>) => api.post("/payment-links", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/payment-links/${id}`, data),
  delete: (id: string) => api.delete(`/payment-links/${id}`),
};

// ==================== API TOKENS ====================
export const apiTokenService = {
  list: () => api.get("/api-tokens"),
  create: (data: Record<string, unknown>) => api.post("/api-tokens", data),
  revoke: (id: string) => api.delete(`/api-tokens/${id}`),
};

// ==================== PAY (no auth) ====================
export const payService = {
  getLink: (slug: string) => api.get(`/payment-links/${slug}`),
  initiateCardPayment: (data: {
    cardDetails: DebitCard;
    amount: string | number;
    customerDetails: Customer;
    paymentType: "one_time";
    businessId: string;
    productId: string;
  }) => api.post(`/pay/card-payment`, data),
  verifyOtp: (data: {
    paymentId: string;
    otp: string;
    transaxtionId?: string;
  }) => api.post(`/pay/otp/verify`, data),
  confirmPayment: (payload: ConfirmPaymentProps) =>
    api.get("/pay/confirm-payment", {
      params: payload,
    }),
};

export const walletService = {
  get: (businessId: string) => api.get(`/wallet/${businessId}`),
  getWithdrawals: (businessId: string, params?: Record<string, unknown>) =>
    api.get(`/wallet/withdrawals/${businessId}`, { params }),
  requestWithdrawal: (businessId: string, data: Record<string, unknown>) =>
    api.post(`/wallet/withdraw/${businessId}`, data),
  cancelWithdrawal: (id: string, businessId: string) =>
    api.post(`/wallet/withdraw/${id}/${businessId}/cancel`),
};
