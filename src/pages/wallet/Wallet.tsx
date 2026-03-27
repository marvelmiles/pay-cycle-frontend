import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Star,
  AlertTriangle,
  ChevronRight,
  Banknote,
  CreditCard,
  Repeat2,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { walletService } from "@/services/api";
import { Transaction, TransactionCustomer, TransactionProduct } from "@/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingSpinner,
  StatusBadge,
} from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { EditBankDetailsCard } from "../settings/SettingsPage";

// ─── Types ────────────────────────────────────────────────────────
interface WalletData {
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

interface PayoutAccount {
  _id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  reference: string;
  note?: string;
  processedAt?: string;
  failureReason?: string;
  payoutAccount:
    | { bankName: string; accountNumber: string; accountName: string }
    | string;
  createdAt: string;
}

// ─── NIGERIAN BANKS ───────────────────────────────────────────────
const NG_BANKS = [
  "Access Bank",
  "Citibank",
  "Ecobank",
  "Fidelity Bank",
  "First Bank",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTB)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint Microfinance Bank",
  "Opay",
  "Palmpay",
  "Polaris Bank",
  "Premium Trust Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered",
  "Sterling Bank",
  "SunTrust Bank",
  "Titan Trust Bank",
  "UBA",
  "Union Bank",
  "Unity Bank",
  "VFD Microfinance Bank",
  "Wema Bank",
  "Zenith Bank",
];

// ─── Status meta ──────────────────────────────────────────────────
const W_STATUS: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-yellow-700",
    bg: "bg-yellow-50",
  },
  processing: {
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  completed: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    color: "text-green-700",
    bg: "bg-green-50",
  },
  failed: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "text-red-700",
    bg: "bg-red-50",
  },
  cancelled: {
    icon: <X className="h-3.5 w-3.5" />,
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
};

// ─── Balance card ────────────────────────────────────────────────
const BalanceCard: React.FC<{
  label: string;
  amount: number;
  currency: string;
  icon: React.ReactNode;
  iconBg: string;
  hint?: string;
  highlight?: boolean;
}> = ({ label, amount, currency, icon, iconBg, hint, highlight }) => (
  <div
    className={cn(
      "rounded-2xl p-5 border",
      highlight
        ? "bg-blue-600 border-blue-500 text-white"
        : "bg-white border-gray-200 shadow-sm",
    )}
  >
    <div className="flex items-center justify-between mb-3">
      <p
        className={cn(
          "text-sm font-medium",
          highlight ? "text-blue-100" : "text-gray-500",
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          iconBg,
        )}
      >
        {icon}
      </div>
    </div>
    <p
      className={cn(
        "text-2xl font-bold",
        highlight ? "text-white" : "text-gray-900",
      )}
    >
      {formatCurrency(amount, currency)}
    </p>
    {hint && (
      <p
        className={cn(
          "text-xs mt-1",
          highlight ? "text-blue-200" : "text-gray-400",
        )}
      >
        {hint}
      </p>
    )}
  </div>
);

// ─── Payout account card ─────────────────────────────────────────
const AccountCard: React.FC<{
  account: PayoutAccount;
  onSetDefault: () => void;
  onDelete: () => void;
  deletingId: string | null;
}> = ({ account, onSetDefault, onDelete, deletingId }) => (
  <div
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors",
      account.isDefault
        ? "bg-blue-50 border-blue-200"
        : "bg-white border-gray-200 hover:border-gray-300",
    )}
  >
    <div
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold",
        account.isDefault
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-600",
      )}
    >
      {account.bankName[0]}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {account.bankName}
        </p>
        {account.isDefault && (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
            <Star className="h-2.5 w-2.5" /> Default
          </span>
        )}
        {account.isVerified && (
          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
            <CheckCircle className="h-2.5 w-2.5" /> Verified
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-0.5">
        {account.accountName} · ···{account.accountNumber.slice(-4)}
      </p>
    </div>

    <div className="flex items-center gap-1 flex-shrink-0">
      {!account.isDefault && (
        <button
          onClick={onSetDefault}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Set default
        </button>
      )}
      <button
        onClick={onDelete}
        disabled={deletingId === account._id}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
      >
        {deletingId === account._id ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  </div>
);

// ─── Schemas ─────────────────────────────────────────────────────
const accountSchema = z.object({
  bankName: z.string().min(1, "Select a bank"),
  accountNumber: z.string().regex(/^\d{10}$/, "Must be 10 digits"),
  accountName: z.string().min(2, "Enter account name"),
  isDefault: z.boolean().default(false),
});
type AccountForm = z.infer<typeof accountSchema>;

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(1000, "Minimum withdrawal is ₦1,000"),
  note: z.string().optional(),
});
type WithdrawalForm = z.infer<typeof withdrawalSchema>;

// ─── MAIN WALLET PAGE ────────────────────────────────────────────
export const WalletPage: React.FC = () => {
  const qc = useQueryClient();
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawalTab, setWithdrawalTab] = useState<string>("all");

  const { business, updateBusiness } = useAuthStore();

  // ── Data fetching ─────────────────────────────────────────────
  const { data: walletData, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () =>
      walletService.get(business?.id || "").then((r) => r.data.data),
  });

  const { data: withdrawalsData } = useQuery({
    queryKey: ["withdrawals", withdrawalTab],
    queryFn: () =>
      walletService
        .getWithdrawals(
          business?.id || "",
          withdrawalTab !== "all" ? { status: withdrawalTab } : {},
        )
        .then((r) => r.data),
  });

  // ── Mutations ─────────────────────────────────────────────────
  const requestMutation = useMutation({
    mutationFn: (d: WithdrawalForm) =>
      walletService.requestWithdrawal(business?.id || "", {
        ...d,
        amount: Math.round(d.amount * 100),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });

      setWithdrawModal(false);
      wForm.reset();

      updateBusiness({
        ...business,
        ...res.data?.data?.business,
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      walletService.cancelWithdrawal(id, business?.id || ""),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
      updateBusiness({
        ...business,
        ...res.data?.business,
      });
    },
  });

  // ── Forms ─────────────────────────────────────────────────────
  const wForm = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
  });
  const aForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { isDefault: false },
  });

  const watchedAmount = wForm.watch("amount");
  const FEE_PERCENT = 1.5;
  const fee = watchedAmount
    ? Math.round(watchedAmount * 100 * (FEE_PERCENT / 100))
    : 0;
  const netAmt = watchedAmount ? Math.round(watchedAmount * 100) - fee : 0;

  if (isLoading)
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );

  const allWithdrawals: Withdrawal[] = withdrawalsData?.data ?? [];
  const currency = business?.settings?.currency || "NGN";

  const hasPayoutAccount = !!(
    business?.bank?.name &&
    business?.bank?.accountNumber &&
    business?.bank?.accountName
  );

  // value is in kobo = minimum of 1k
  const canWithdraw = (business?.availableBalance || 0) >= 100000;

  return (
    <div className="p-6 space-y-6 max-w-6xl animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-500 mt-1">
            Track your balance, earnings and payouts
          </p>
        </div>
        <Button
          size="md"
          disabled={!canWithdraw || !hasPayoutAccount}
          onClick={() => setWithdrawModal(true)}
          title={
            !hasPayoutAccount
              ? "Add a payout account first"
              : !canWithdraw
                ? "Minimum ₦1,000 required"
                : undefined
          }
        >
          Request Withdrawal
        </Button>
      </div>

      {/* ── No payout account warning ── */}
      {!hasPayoutAccount && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              No payout account linked
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Add a bank account before requesting withdrawals.
            </p>
          </div>
        </div>
      )}

      {/* ── Balance cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BalanceCard
          label="Available Balance"
          amount={business?.availableBalance || 0}
          currency={currency}
          icon={<Wallet className="h-5 w-5 text-white" />}
          iconBg="bg-blue-500"
          hint="Ready to withdraw"
          highlight
        />
        <BalanceCard
          label="Pending Payouts"
          amount={walletData.pendingBalance}
          currency={currency}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          iconBg="bg-yellow-100"
          hint="Awaiting processing"
        />
        <BalanceCard
          label="Total Earned"
          amount={walletData.totalEarned}
          currency={currency}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-100"
          hint="All time revenue"
        />
        <BalanceCard
          label="Total Withdrawn"
          amount={walletData.totalWithdrawn}
          currency={currency}
          icon={<TrendingDown className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
          hint="Successfully paid out"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── LEFT: Transaction history + Withdrawals ── */}
        <div className="xl:col-span-2 space-y-5">
          {/* Withdrawal history */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-gray-900">
                  Withdrawal History
                </h2>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {(
                    ["all", "pending", "paid", "rejected", "cancelled"] as const
                  ).map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setWithdrawalTab(
                          {
                            paid: "successful",
                          }[t as string] || t,
                        )
                      }
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                        withdrawalTab === t
                          ? "bg-white shadow text-gray-900"
                          : "text-gray-500",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            {allWithdrawals.length === 0 ? (
              <CardBody>
                <EmptyState
                  title="No History yet"
                  description="Withdrawal history will appear here."
                  icon={<Banknote className="h-10 w-10" />}
                />
              </CardBody>
            ) : (
              <div className="divide-y divide-gray-50">
                {allWithdrawals.map((w) => {
                  const meta = W_STATUS[w.status] ?? W_STATUS.pending;
                  const account =
                    typeof w.payoutAccount === "object"
                      ? w.payoutAccount
                      : null;
                  return (
                    <div
                      key={w._id}
                      className="flex items-center gap-3 px-5 py-4"
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                          meta.bg,
                        )}
                      >
                        <span className={meta.color}>{meta.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(w.amount, w.currency)}
                          </p>
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                              meta.bg,
                              meta.color,
                            )}
                          >
                            {w.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {account
                            ? `${account.bankName} ···${account.accountNumber.slice(-4)}`
                            : "Bank account"}
                          {" · "}
                          {formatDateTime(w.createdAt)}
                        </p>
                        {w.note && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">
                            "{w.note}"
                          </p>
                        )}
                        {w.failureReason && (
                          <p className="text-xs text-red-500 mt-0.5">
                            {w.failureReason}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className="text-xs text-gray-400 font-mono">
                          {w.reference}
                        </p>
                        {w.status === "pending" && (
                          <button
                            onClick={() => cancelMutation.mutate(w._id)}
                            disabled={cancelMutation.isPending}
                            className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        )}
                        {w.processedAt && (
                          <p className="text-xs text-gray-400">
                            Processed {formatDate(w.processedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── RIGHT: Payout accounts ── */}
        <EditBankDetailsCard />
      </div>

      {/* ── WITHDRAWAL MODAL ── */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setWithdrawModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Request Withdrawal
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Available:{" "}
                  <strong>
                    {formatCurrency(business?.availableBalance || 0, currency)}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setWithdrawModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={wForm.handleSubmit((d) => requestMutation.mutate(d))}
              className="px-6 py-5 space-y-4"
            >
              {requestMutation.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {(
                    requestMutation.error as {
                      response?: { data?: { message?: string } };
                    }
                  )?.response?.data?.message || "Request failed"}
                </div>
              )}

              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Amount (₦) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                    ₦
                  </span>
                  <input
                    {...wForm.register("amount")}
                    type="number"
                    min="1000"
                    step="100"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {wForm.formState.errors.amount && (
                  <p className="text-xs text-red-500">
                    {wForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              {/* Fee preview */}
              {watchedAmount > 0 && (
                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Withdrawal amount</span>
                    <span className="font-medium">
                      {formatCurrency(
                        Math.round(watchedAmount * 100),
                        currency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Platform fee (1.5%)</span>
                    <span>−{formatCurrency(fee, currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold">
                    <span className="text-gray-900">You will receive</span>
                    <span className="text-green-700">
                      {formatCurrency(netAmt, currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Optional note */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Note (optional)
                </label>
                <input
                  {...wForm.register("note")}
                  placeholder="e.g. October earnings"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setWithdrawModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={requestMutation.isPending}
                  loadingText="Submitting..."
                >
                  Request Withdrawal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
