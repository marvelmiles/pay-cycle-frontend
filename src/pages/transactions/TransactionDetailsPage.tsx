import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  CreditCard,
  User,
  Package,
  Building2,
  Hash,
  Calendar,
  Repeat2,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { transactionService } from "../../services/api";
import { useAuthStore } from "../../stores/auth.store";
import { formatCurrency, formatDateTime, formatDate, cn } from "../../lib/utils";
import { LoadingSpinner, StatusBadge } from "../../components/ui";
import type {
  Transaction,
  TransactionCustomer,
  TransactionProduct,
} from "../../types";
import routes from "@/constants/routes";

// ─── Copy-to-clipboard ───────────────────────────────
const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="ml-1.5 p-1 rounded text-gray-400 hover:text-blue-600 transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

// ─── Status config ────────────────────────────────────────────────
const STATUS_META: Record<
  string,
  {
    icon: React.ReactNode;
    bg: string;
    ring: string;
    text: string;
    label: string;
    description: string;
  }
> = {
  successful: {
    icon: <CheckCircle className="h-7 w-7 text-green-500" />,
    bg: "bg-green-50",
    ring: "ring-green-200",
    text: "text-green-700",
    label: "Successful",
    description: "Payment was processed successfully.",
  },
  pending: {
    icon: <Clock className="h-7 w-7 text-yellow-500" />,
    bg: "bg-yellow-50",
    ring: "ring-yellow-200",
    text: "text-yellow-700",
    label: "Pending",
    description: "Payment is awaiting confirmation.",
  },
  failed: {
    icon: <XCircle className="h-7 w-7 text-red-500" />,
    bg: "bg-red-50",
    ring: "ring-red-200",
    text: "text-red-700",
    label: "Failed",
    description: "Payment could not be processed.",
  },
  refunded: {
    icon: <RefreshCw className="h-7 w-7 text-purple-500" />,
    bg: "bg-purple-50",
    ring: "ring-purple-200",
    text: "text-purple-700",
    label: "Refunded",
    description: "Payment has been refunded to the customer.",
  },
};

// ─── Section card wrapper ────────────────────────────────────────
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, title, children, action }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <span className="text-gray-400">{icon}</span>
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      {action}
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

// ─── Row inside a section ────────────────────────────────────────
const Row: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyValue?: string;
}> = ({ label, value, mono, copyValue }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-4">
    <span className="text-sm text-gray-500 flex-shrink-0 w-36">{label}</span>
    <span
      className={cn(
        "text-sm text-gray-900 text-right flex items-center gap-1",
        mono && "font-mono",
      )}
    >
      {value}
      {copyValue && <CopyBtn text={copyValue} />}
    </span>
  </div>
);

// ─── Timeline item ───────────────────────────────────────────────
const TimelineItem: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  time?: string;
  isLast?: boolean;
}> = ({ icon, iconBg, title, description, time, isLast }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          iconBg,
        )}
      >
        {icon}
      </div>
      {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
    </div>
    <div className="pb-5 flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      {time && <p className="text-xs text-gray-400 mt-1">{time}</p>}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────
export const TransactionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { business } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["transaction", id],
    queryFn: () =>
      transactionService.get(id!).then((r) => r.data.data as Transaction),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-sm mx-auto">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="mt-3 font-semibold text-gray-900">
            Transaction not found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            This transaction may have been removed or you don't have access.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-sm text-blue-600 hover:underline font-medium"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const txn = data;
  const status = STATUS_META[txn.status] ?? STATUS_META.pending;
  const customer =
    typeof txn.customer === "object"
      ? (txn.customer as TransactionCustomer)
      : null;
  const product =
    typeof txn.product === "object"
      ? (txn.product as TransactionProduct)
      : null;

  // Build timeline events
  const timeline: Array<{
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    time?: string;
  }> = [
    {
      icon: <Receipt className="h-4 w-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      title: "Transaction created",
      description: "Payment was initiated",
      time: formatDateTime(txn.createdAt),
    },
  ];

  if (txn.status === "successful") {
    timeline.push({
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      iconBg: "bg-green-100",
      title: "Payment successful",
      description: txn.interswitchRef
        ? `Interswitch ref: ${txn.interswitchRef}`
        : "Confirmed by payment gateway",
      time: txn.updatedAt ? formatDateTime(txn.updatedAt) : undefined,
    });
  } else if (txn.status === "failed") {
    timeline.push({
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      iconBg: "bg-red-100",
      title: "Payment failed",
      description:
        txn.failureReason || "Payment was declined or could not be processed",
      time: txn.updatedAt ? formatDateTime(txn.updatedAt) : undefined,
    });
  } else if (txn.status === "refunded") {
    timeline.push({
      icon: <RefreshCw className="h-4 w-4 text-purple-500" />,
      iconBg: "bg-purple-100",
      title: "Payment refunded",
      description: "Amount returned to the customer",
      time: txn.updatedAt ? formatDateTime(txn.updatedAt) : undefined,
    });
  } else if (txn.status === "pending") {
    timeline.push({
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      iconBg: "bg-yellow-100",
      title: "Awaiting confirmation",
      description: "Waiting for payment gateway response",
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* ── Back + breadcrumb ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(routes.transactions())}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Transactions
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-medium font-mono">
          {txn.reference}
        </span>
      </div>

      {/* ── Hero status banner ── */}
      <div
        className={cn(
          "rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          status.bg,
          status.ring,
          "ring-1",
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              "bg-white/70",
            )}
          >
            {status.icon}
          </div>
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-widest",
                status.text,
              )}
            >
              {status.label}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">
              {formatCurrency(txn.amount, txn.currency)}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{status.description}</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Date</p>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {formatDateTime(txn.createdAt)}
          </p>
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                txn.type === "recurring"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700",
              )}
            >
              {txn.type === "recurring" ? (
                <Repeat2 className="h-3 w-3" />
              ) : (
                <CreditCard className="h-3 w-3" />
              )}
              {txn.type.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main grid: left col (details) + right col (timeline) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — 2/3 width */}
        <div className="lg:col-span-2 space-y-5">
          {/* Transaction details */}
          <Section
            icon={<Receipt className="h-4 w-4" />}
            title="Transaction Details"
          >
            <Row
              label="Reference"
              value={txn.reference}
              mono
              copyValue={txn.reference}
            />
            {txn.interswitchRef && (
              <Row
                label="Gateway Ref"
                value={txn.interswitchRef}
                mono
                copyValue={txn.interswitchRef}
              />
            )}
            <Row label="Status" value={<StatusBadge status={txn.status} />} />
            <Row
              label="Amount"
              value={
                <span className="font-bold text-gray-900">
                  {formatCurrency(txn.amount, txn.currency)}
                </span>
              }
            />
            <Row label="Currency" value={txn.currency} />
            <Row
              label="Type"
              value={
                <span className="capitalize text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {txn.type.replace("_", " ")}
                </span>
              }
            />
            {txn.paymentMethod && (
              <Row label="Payment method" value={txn.paymentMethod} />
            )}
            {txn.failureReason && (
              <Row
                label="Failure reason"
                value={
                  <span className="text-red-600 text-xs">
                    {txn.failureReason}
                  </span>
                }
              />
            )}
            <Row label="Created" value={formatDateTime(txn.createdAt)} />
            {txn.updatedAt && txn.updatedAt !== txn.createdAt && (
              <Row label="Last updated" value={formatDateTime(txn.updatedAt)} />
            )}
          </Section>

          {/* Customer */}
          <Section
            icon={<User className="h-4 w-4" />}
            title="Customer"
            action={
              customer?._id && (
                <Link
                  to={`/dashboard/customers/${customer._id}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  View profile <ExternalLink className="h-3 w-3" />
                </Link>
              )
            }
          >
            {customer ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {customer.firstName[0]}
                    {customer.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <Row
                  label="Email"
                  value={customer.email}
                  copyValue={customer.email}
                />
                {customer.phone && <Row label="Phone" value={customer.phone} />}
                {customer.totalSpent !== undefined && (
                  <Row
                    label="Lifetime value"
                    value={
                      <span className="font-semibold text-green-700">
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    }
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Customer details not available
              </p>
            )}
          </Section>

          {/* Product */}
          <Section icon={<Package className="h-4 w-4" />} title="Product">
            {product ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      product.type === "recurring"
                        ? "bg-purple-100"
                        : "bg-blue-100",
                    )}
                  >
                    {product.type === "recurring" ? (
                      <Repeat2 className="h-5 w-5 text-purple-600" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
                <Row label="Name" value={product.name} />
                <Row
                  label="Type"
                  value={
                    <span className="capitalize text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {product.type.replace("_", " ")}
                    </span>
                  }
                />
                {product.price !== undefined && (
                  <Row
                    label="Price"
                    value={formatCurrency(
                      product.price,
                      product.currency || txn.currency,
                    )}
                  />
                )}
                {product.interval && (
                  <Row
                    label="Billing interval"
                    value={
                      <span className="capitalize">{product.interval}</span>
                    }
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Product details not available
              </p>
            )}
          </Section>

          {/* Business */}
          <Section icon={<Building2 className="h-4 w-4" />} title="Business">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(business?.name || "B")[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {business?.name || "—"}
                </p>
                <p className="text-xs text-gray-400">
                  {business?.settings?.currency || "NGN"} ·{" "}
                  {business?.settings?.timezone || "Africa/Lagos"}
                </p>
              </div>
            </div>
            <Row label="Business name" value={business?.name || "—"} />
            <Row
              label="Currency"
              value={business?.settings?.currency || "NGN"}
            />
            <Row
              label="Timezone"
              value={business?.settings?.timezone || "Africa/Lagos"}
            />
          </Section>

          {/* Metadata (if any) */}
          {txn.metadata && Object.keys(txn.metadata).length > 0 && (
            <Section icon={<Hash className="h-4 w-4" />} title="Metadata">
              {Object.entries(txn.metadata).map(([k, v]) => (
                <Row
                  key={k}
                  label={k}
                  value={
                    <span className="font-mono text-xs break-all">
                      {String(v)}
                    </span>
                  }
                  copyValue={String(v)}
                />
              ))}
            </Section>
          )}
        </div>

        {/* RIGHT — 1/3 width: timeline + quick info */}
        <div className="space-y-5">
          {/* Quick info card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Transaction date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(txn.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount charged</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(txn.amount, txn.currency)}
                  </p>
                </div>
              </div>
              {customer && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Customer</p>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </p>
                  </div>
                </div>
              )}
              {product && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Product</p>
                    <p className="text-sm font-medium text-gray-900">
                      {product.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-5">
              Timeline
            </h3>
            <div>
              {timeline.map((item, i) => (
                <TimelineItem
                  key={i}
                  icon={item.icon}
                  iconBg={item.iconBg}
                  title={item.title}
                  description={item.description}
                  time={item.time}
                  isLast={i === timeline.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Reference panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              References
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Transaction ref</p>
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-mono text-xs text-gray-700 flex-1 truncate">
                    {txn.reference}
                  </span>
                  <CopyBtn text={txn.reference} />
                </div>
              </div>
              {txn.interswitchRef && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Gateway ref</p>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-mono text-xs text-gray-700 flex-1 truncate">
                      {txn.interswitchRef}
                    </span>
                    <CopyBtn text={txn.interswitchRef} />
                  </div>
                </div>
              )}
              {txn._id && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-mono text-xs text-gray-700 flex-1 truncate">
                      {txn._id}
                    </span>
                    <CopyBtn text={txn._id} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
