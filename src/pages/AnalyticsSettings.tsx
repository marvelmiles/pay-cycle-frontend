import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { analyticsService } from '../services/api';
import { Card, CardHeader, CardBody, LoadingSpinner, StatCard } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';
import { TrendingUp, Repeat2, Users, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import type { RevenueDataPoint } from '../types';

// ===========================
// ANALYTICS PAGE
// ===========================
export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: stats } = useQuery({
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Deep insights into your revenue and growth</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue || 0)}
          change={stats?.revenueGrowth} icon={<TrendingUp className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="MRR" value={formatCurrency((subMetrics?.mrr || 0) * 100)}
          icon={<Repeat2 className="h-5 w-5 text-purple-600" />} iconBg="bg-purple-50" />
        <StatCard title="ARR" value={formatCurrency((subMetrics?.arr || 0) * 100)}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />} iconBg="bg-green-50" />
        <StatCard title="Churn Rate" value={`${subMetrics?.churnRate || 0}%`}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Revenue Trend</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === p ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {revenueLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData as RevenueDataPoint[]}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDate(v).slice(0, 6)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 100).toLocaleString()}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => formatDate(l)} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Volume bar chart */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Transaction Volume</h2></CardHeader>
        <CardBody>
          {revenueLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData as RevenueDataPoint[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDate(v).slice(0, 6)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(l) => formatDate(l)} />
                <Bar dataKey="count" name="Transactions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Subscription metrics row */}
      {subMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'New This Month', value: subMetrics.newThisMonth, icon: <Users className="h-4 w-4 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Cancelled This Month', value: subMetrics.cancelledThisMonth, icon: <AlertTriangle className="h-4 w-4 text-red-500" />, bg: 'bg-red-50' },
            { label: 'Payment Success Rate', value: `${stats?.paymentSuccessRate || 0}%`, icon: <TrendingUp className="h-4 w-4 text-green-600" />, bg: 'bg-green-50' },
          ].map(({ label, value, icon, bg }) => (
            <Card key={label}>
              <CardBody className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${bg}`}>{icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================
// SETTINGS PAGE
// ===========================
export const SettingsPage: React.FC = () => {
  const { user, business } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and business settings</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Profile</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">First Name</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">{user?.firstName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">{user?.lastName}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </CardBody>
      </Card>

      {/* Business */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Business</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Business Name</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">{business?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Slug</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-500 font-mono">{business?.slug}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Currency</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">{business?.settings?.currency || 'NGN'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Timezone</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">{business?.settings?.timezone || 'Africa/Lagos'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Webhooks</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-gray-500">
            BillFlow will send POST requests to your webhook URL for events like payment success, subscription renewal, and failures.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700">Webhook URL</label>
            <input className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourapp.com/webhooks/billflow"
              defaultValue={business?.settings?.webhookUrl || ''} />
          </div>
          <button onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            {saved ? '✓ Saved' : 'Save Webhook URL'}
          </button>
        </CardBody>
      </Card>

      {/* Interswitch */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Payment Gateway</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">IS</div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Interswitch</p>
              <p className="text-xs text-blue-600">Connected — Test Mode</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Configure your Interswitch credentials in your environment variables. See .env.example for details.</p>
        </CardBody>
      </Card>
    </div>
  );
};
