export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'business_owner' | 'admin' | 'developer';
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  settings?: {
    currency: string;
    timezone: string;
    webhookUrl?: string;
  };
}

export interface AuthState {
  user: User | null;
  business: Business | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  type: 'one_time' | 'recurring';
  price: number;
  currency: string;
  interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  intervalCount?: number;
  trialDays?: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  type: 'one_time' | 'subscription';
  reference: string;
  customer: { firstName: string; lastName: string; email: string } | string;
  product: { name: string; type: string } | string;
  createdAt: string;
}

export interface Subscription {
  _id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  customer: Customer | string;
  product: Product | string;
  createdAt: string;
}

export interface PaymentLink {
  _id: string;
  title: string;
  description?: string;
  amount?: number;
  currency: string;
  isFixedAmount: boolean;
  slug: string;
  isActive: boolean;
  useCount: number;
  maxUses?: number;
  expiresAt?: string;
  createdAt: string;
}

export interface ApiToken {
  _id: string;
  name: string;
  token: string;
  type: 'live' | 'test';
  lastUsedAt?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  activeSubscriptions: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  failedPaymentsThisMonth: number;
  paymentSuccessRate: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  count: number;
}

export interface SubscriptionMetrics {
  byStatus: Record<string, number>;
  newThisMonth: number;
  cancelledThisMonth: number;
  churnRate: number;
  mrr: number;
  arr: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
