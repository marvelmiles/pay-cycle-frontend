import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, Users, Repeat2, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';
import { analyticsService } from '../services/api';
import { StatCard, Card, CardHeader, CardBody, LoadingSpinner } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuthStore } from '../stores/auth.store';
import type { RevenueDataPoint } from '../types';

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#6B7280'];

export const DashboardPage: React.FC = () => {
  const { user, business } = useAuthStore();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsService.dashboard().then((r) => r.data.data),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-chart', period],
    queryFn: () => analyticsService.revenue(period).then((r) => r.data.data),
  });

  const { data: subMetrics } = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: () => analyticsService.subscriptions().then((r) => r.data.data),
  });

  const stats = statsData;

  const pieData = subMetrics?.byStatus
    ? Object.entries(subMetrics.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with {business?.name} today.</p>
      </div>

      {/* Stats */}
      {statsLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={<DollarSign className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats?.monthlyRevenue || 0)}
            change={stats?.revenueGrowth}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-50"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats?.activeSubscriptions?.toLocaleString() || '0'}
            icon={<Repeat2 className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-50"
          />
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers?.toLocaleString() || '0'}
            icon={<Users className="h-5 w-5 text-orange-600" />}
            iconBg="bg-orange-50"
          />
        </div>
      )}

      {/* Secondary stats */}
      {!statsLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardBody className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-lg">
                <CreditCard className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Success Rate</p>
                <p className="text-xl font-bold text-gray-900">{stats?.paymentSuccessRate?.toFixed(1)}%</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Failed Payments (Month)</p>
                <p className="text-xl font-bold text-gray-900">{stats?.failedPaymentsThisMonth || 0}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 rounded-lg">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">New Customers (Month)</p>
                <p className="text-xl font-bold text-gray-900">{stats?.newCustomersThisMonth || 0}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Revenue Over Time</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['7d', '30d', '90d'] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === p ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {revenueLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueData as RevenueDataPoint[]}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDate(v).slice(0, 6)}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₦${(v / 100).toLocaleString()}`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => formatDate(l)} />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2}
                    fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Subscription status pie */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Subscriptions</h2>
          </CardHeader>
          <CardBody>
            {subMetrics && pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {pieData.map(({ name, value }, i) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-gray-600 capitalize">{name.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500">MRR</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(subMetrics.mrr * 100)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Churn</p>
                    <p className="text-sm font-bold text-gray-900">{subMetrics.churnRate}%</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">No subscription data yet</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
