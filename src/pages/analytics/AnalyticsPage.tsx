import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { analyticsService } from "../../services/api";
import {
  Card,
  CardHeader,
  CardBody,
  LoadingSpinner,
  StatCard,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/utils";
import { TrendingUp } from "lucide-react";
import type { RevenueDataPoint } from "../../types";

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => analyticsService.dashboard().then((r) => r.data.data),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-chart", period],
    queryFn: () => analyticsService.revenue(period).then((r) => r.data.data),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">
          Deep insights into your revenue and growth
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthRevenue || 0)}
          change={stats?.revenueGrowth}
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Revenue Trend</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === p ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {revenueLoading ? (
            <LoadingSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData as RevenueDataPoint[]}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatDate(v).slice(0, 6)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₦${(v / 100).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(l) => formatDate(l)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
