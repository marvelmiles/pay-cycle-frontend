import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { XCircle, ArrowRight } from "lucide-react";
import { transactionService } from "../../services/api";
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
import { formatCurrency, formatDateTime } from "../../lib/utils";
import type { Transaction } from "../../types";
import { useNavigate } from "react-router-dom";

export const TransactionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, status],
    queryFn: () =>
      transactionService
        .list({ page, limit: 20, status: status || undefined })
        .then((r) => r.data),
  });

  const navigate = useNavigate();

  const columns = [
    {
      key: "ref",
      header: "Reference",
      render: (t: Transaction) => (
        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {t.reference}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (t: Transaction) => {
        const c = typeof t.customer === "object" ? t.customer : null;
        return c ? (
          <div>
            <p className="font-medium text-gray-900">
              {c.firstName} {c.lastName}
            </p>
            <p className="text-xs text-gray-400">{c.email}</p>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: "product",
      header: "Product",
      render: (t: Transaction) => {
        const p = typeof t.product === "object" ? t.product : null;
        return p ? (
          <span className="text-gray-700">{p.name}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      render: (t: Transaction) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(t.amount, t.currency)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (t: Transaction) => (
        <span className="text-xs capitalize text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {t.type.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t: Transaction) => <StatusBadge status={t.status} />,
    },
    {
      key: "date",
      header: "Date",
      render: (t: Transaction) => (
        <span className="text-gray-500 text-xs">
          {formatDateTime(t.createdAt)}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (t: Transaction) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dashboard/transactions/${t._id}`);
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="View details"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">
          All payment activity for your business
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: "", label: "All statuses" },
                { value: "successful", label: "Successful" },
                { value: "pending", label: "Pending" },
                { value: "failed", label: "Failed" },
                { value: "refunded", label: "Refunded" },
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-44"
            />
            <span className="text-sm text-gray-500">
              {data?.pagination?.total || 0} transactions
            </span>
          </div>
        </CardHeader>
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.data?.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No transactions yet"
              description="Transactions will appear here once payments are processed."
              icon={<XCircle className="h-12 w-12" />}
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
