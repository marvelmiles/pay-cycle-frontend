import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Link2,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  paymentLinkService,
  apiTokenService,
  productService,
} from "../services/api";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  StatusBadge,
  Table,
  Modal,
  Input,
  Textarea,
  Select,
  EmptyState,
  LoadingSpinner,
} from "../components/ui";
import { formatCurrency, formatDate, formatDateTime } from "../lib/utils";
import type { PaymentLink, ApiToken, Product } from "../types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ===========================
// SHARED: COPY BUTTON
// ===========================
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

// ===========================
// PAYMENT LINKS PAGE
// ===========================
const linkSchema = z.object({
  title: z.string().min(1, "Required"),
  productId: z.string().min(1, "A product is required"),
  description: z.string().optional(),
  redirectUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  maxUses: z.coerce.number().optional(),
});
type LinkForm = z.infer<typeof linkSchema>;

export const PaymentLinksPage: React.FC = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["payment-links"],
    queryFn: () => paymentLinkService.list().then((r) => r.data),
  });

  // Load products for the dropdown
  const { data: productsData } = useQuery({
    queryKey: ["products", 1],
    queryFn: () =>
      productService.list({ limit: 100, isActive: true }).then((r) => r.data),
  });

  const products: Product[] = productsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
  });

  const selectedProductId = watch("productId");
  const selectedProduct = products.find((p) => p._id === selectedProductId);

  const createMutation = useMutation({
    mutationFn: (d: LinkForm) => paymentLinkService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-links"] });
      setModalOpen(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentLinkService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-links"] }),
  });

  const baseUrl = window.location.origin;

  const columns = [
    {
      key: "title",
      header: "Link",
      render: (l: PaymentLink) => {
        const prod =
          typeof l.product === "object" ? (l.product as Product) : null;
        return (
          <div>
            <p className="font-medium text-gray-900">{l.title}</p>
            {prod && (
              <p className="text-xs text-gray-400 mt-0.5">{prod.name}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "url",
      header: "Payment URL",
      render: (l: PaymentLink) => (
        <div className="flex items-center gap-1">
          <span className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded truncate max-w-[180px]">
            /pay/{l._id}
          </span>
          <CopyButton text={`${baseUrl}/pay/${l._id}`} />
          <a
            href={`/pay/${l._id}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (l: PaymentLink) => {
        const prod =
          typeof l.product === "object" ? (l.product as Product) : null;
        return prod ? (
          <span className="font-semibold text-gray-900">
            {formatCurrency(prod.price, prod.currency)}
            {prod.interval && (
              <span className="text-xs text-gray-400 font-normal ml-1">
                /{prod.interval}
              </span>
            )}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: "uses",
      header: "Uses",
      render: (l: PaymentLink) => (
        <span className="text-gray-600">
          {l.useCount}
          {l.maxUses ? ` / ${l.maxUses}` : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (l: PaymentLink) => (
        <StatusBadge status={l.isActive ? "active" : "cancelled"} />
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (l: PaymentLink) => (
        <span className="text-gray-500 text-xs">{formatDate(l.createdAt)}</span>
      ),
    },
    {
      key: "del",
      header: "",
      render: (l: PaymentLink) => (
        <button
          onClick={() => deleteMutation.mutate(l._id)}
          className="p-1.5 rounded text-red-400 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Links</h1>
          <p className="text-gray-500 mt-1">
            Share links to collect payments — no code needed
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            reset();
            setModalOpen(true);
          }}
        >
          Create Link
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.data?.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No payment links yet"
              description="Create a shareable link tied to a product to start collecting payments instantly."
              icon={<Link2 className="h-12 w-12" />}
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setModalOpen(true)}
                >
                  Create Link
                </Button>
              }
            />
          </CardBody>
        ) : (
          <Table columns={columns} data={data?.data || []} />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Payment Link"
      >
        <form
          onSubmit={handleSubmit((d) => createMutation.mutate(d))}
          className="space-y-4"
        >
          {/* Product selector — REQUIRED */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              {...register("productId")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select a product —</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} · {formatCurrency(p.price, p.currency)}
                  {p.interval ? `/${p.interval}` : ""}
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="text-xs text-red-500">{errors.productId.message}</p>
            )}
          </div>

          {/* Product preview */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">
                  {selectedProduct.name}
                </span>
                <span className="font-bold text-blue-700">
                  {formatCurrency(
                    selectedProduct.price,
                    selectedProduct.currency,
                  )}
                  {selectedProduct.interval && (
                    <span className="font-normal text-blue-500 ml-1">
                      /{selectedProduct.interval}
                    </span>
                  )}
                </span>
              </div>
              <p className="text-blue-600 text-xs mt-0.5 capitalize">
                {selectedProduct.type.replace("_", " ")} payment
                {selectedProduct.trialDays
                  ? ` · ${selectedProduct.trialDays}-day trial`
                  : ""}
              </p>
            </div>
          )}

          <Input
            label="Link title"
            placeholder="e.g. Pro Plan Checkout"
            error={errors.title?.message}
            {...register("title")}
          />
          <Textarea
            label="Description (optional)"
            placeholder="What is this payment for?"
            {...register("description")}
          />
          <Input
            label="Redirect URL after payment (optional)"
            type="url"
            placeholder="https://yoursite.com/thank-you"
            error={errors.redirectUrl?.message}
            {...register("redirectUrl")}
          />
          <Input
            label="Max uses (optional)"
            type="number"
            placeholder="Unlimited"
            {...register("maxUses")}
          />

          {products.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              ⚠️ You need to create a product first before creating a payment
              link.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || createMutation.isPending}
            >
              Create Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ===========================
// API TOKENS PAGE
// ===========================
const tokenSchema = z.object({
  name: z.string().min(1, "Required"),
  type: z.enum(["live", "test"]),
});
type TokenForm = z.infer<typeof tokenSchema>;

export const ApiTokensPage: React.FC = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["api-tokens"],
    queryFn: () => apiTokenService.list().then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TokenForm>({
    resolver: zodResolver(tokenSchema),
    defaultValues: { type: "test" },
  });

  const createMutation = useMutation({
    mutationFn: (d: TokenForm) => apiTokenService.create(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["api-tokens"] });
      setNewToken(res.data.data.token);
      setModalOpen(false);
      reset();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiTokenService.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-tokens"] }),
  });

  const maskToken = (t: string) =>
    `${t?.slice(0, 8)}${"•".repeat(20)}${t?.slice(-4)}`;

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (t: ApiToken) => (
        <span className="font-medium text-gray-900">{t.name}</span>
      ),
    },
    {
      key: "type",
      header: "Environment",
      render: (t: ApiToken) => (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${t.type === "live" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
        >
          {t.type}
        </span>
      ),
    },
    {
      key: "token",
      header: "Token",
      render: (t: ApiToken) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-gray-600">
            {showTokens[t._id] ? t.token : maskToken(t.token)}
          </span>
          <button
            onClick={() => setShowTokens((p) => ({ ...p, [t._id]: !p[t._id] }))}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {showTokens[t._id] ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
          <CopyButton text={t.token} />
        </div>
      ),
    },
    {
      key: "lastUsed",
      header: "Last Used",
      render: (t: ApiToken) => (
        <span className="text-gray-500 text-xs">
          {t.lastUsedAt ? formatDateTime(t.lastUsedAt) : "Never"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t: ApiToken) => (
        <StatusBadge status={t.isActive ? "active" : "cancelled"} />
      ),
    },
    {
      key: "revoke",
      header: "",
      render: (t: ApiToken) =>
        t.isActive ? (
          <button
            onClick={() => revokeMutation.mutate(t._id)}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Revoke
          </button>
        ) : null,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Tokens</h1>
          <p className="text-gray-500 mt-1">
            Manage access tokens for SDK and API integration
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setModalOpen(true)}
        >
          Generate Token
        </Button>
      </div>

      {newToken && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-1">
            🎉 Token created — copy it now, it won't be shown again
          </p>
          <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
            <span className="font-mono text-sm text-gray-800 flex-1 truncate">
              {newToken}
            </span>
            <CopyButton text={newToken} />
          </div>
          <button
            onClick={() => setNewToken(null)}
            className="mt-2 text-xs text-green-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <Card>
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.data?.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No API tokens"
              description="Generate a token to integrate BillFlow SDK into your application."
              icon={<Key className="h-12 w-12" />}
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setModalOpen(true)}
                >
                  Generate Token
                </Button>
              }
            />
          </CardBody>
        ) : (
          <Table columns={columns} data={data?.data || []} />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate API Token"
      >
        <form
          onSubmit={handleSubmit((d) => createMutation.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Token name"
            placeholder="e.g. Production Server"
            error={errors.name?.message}
            {...register("name")}
          />
          <Select
            label="Environment"
            options={[
              { value: "test", label: "Test" },
              { value: "live", label: "Live" },
            ]}
            error={errors.type?.message}
            {...register("type")}
          />
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            ⚠️ Live tokens process real payments. Use test tokens during
            development.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || createMutation.isPending}
            >
              Generate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
