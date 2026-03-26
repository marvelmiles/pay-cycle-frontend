import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, XCircle } from "lucide-react";
import { subscriptionService } from "../../services/api";
import {
  Card,
  CardHeader,
  CardBody,
  StatusBadge,
  Table,
  Pagination,
  LoadingSpinner,
  Select,
  EmptyState,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/utils";
import type { Subscription } from "../../types";

export const SubscriptionsPage: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", page, status],
    queryFn: () =>
      subscriptionService
        .list({ page, limit: 20, status: status || undefined })
        .then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      subscriptionService.cancel(id, { cancelAtPeriodEnd: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
  const pauseMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.pause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
  const resumeMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.resume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (s: Subscription) => {
        const c = typeof s.customer === "object" ? s.customer : null;
        return c ? (
          <div>
            <p className="font-medium text-gray-900">
              {c.firstName} {c.lastName}
            </p>
            <p className="text-xs text-gray-400">{c.email}</p>
          </div>
        ) : (
          <span>—</span>
        );
      },
    },
    {
      key: "product",
      header: "Plan",
      render: (s: Subscription) => {
        const p = typeof s.product === "object" ? s.product : null;
        return p ? (
          <div>
            <p className="font-medium text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-400">
              {formatCurrency(p.price)}/{p.interval}
            </p>
          </div>
        ) : (
          <span>—</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (s: Subscription) => <StatusBadge status={s.status} />,
    },
    {
      key: "period",
      header: "Period End",
      render: (s: Subscription) => (
        <span className="text-gray-500">{formatDate(s.currentPeriodEnd)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (s: Subscription) => (
        <div className="flex gap-1">
          {s.status === "active" && (
            <>
              <button
                onClick={() => pauseMutation.mutate(s._id)}
                title="Pause"
                className="p-1.5 rounded text-orange-500 hover:bg-orange-50"
              >
                <Pause className="h-4 w-4" />
              </button>
              <button
                onClick={() => cancelMutation.mutate(s._id)}
                title="Cancel"
                className="p-1.5 rounded text-red-500 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          {s.status === "paused" && (
            <button
              onClick={() => resumeMutation.mutate(s._id)}
              title="Resume"
              className="p-1.5 rounded text-green-500 hover:bg-green-50"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-500 mt-1">
          Track and manage recurring subscriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: "", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "trialing", label: "Trialing" },
                { value: "paused", label: "Paused" },
                { value: "past_due", label: "Past Due" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-44"
            />
            <span className="text-sm text-gray-500">
              {data?.pagination?.total || 0} subscriptions
            </span>
          </div>
        </CardHeader>
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.data?.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No subscriptions yet"
              description="Subscriptions are created when customers pay for recurring plans."
              icon={<Repeat2Icon />}
            />
          </CardBody>
        ) : (
          <>
            <Table columns={columns} data={data?.data || []} />
            <Pagination
              page={page}
              pages={data?.pagination?.pages || 1}
              total={data?.pagination?.total || 0}
              onPage={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
};

const Repeat2Icon = () => (
  <svg
    className="h-12 w-12 text-gray-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"
    />
  </svg>
);
