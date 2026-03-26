import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Link2,
  Copy,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  paymentLinkService,
  productService,
} from "../../services/api";
import {
  Button,
  Card,
  CardBody,
  StatusBadge,
  Table,
  Modal,
  Input,
  Textarea,
  EmptyState,
  LoadingSpinner,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/utils";
import type { PaymentLink, Product } from "../../types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ===========================
// SHARED: COPY BUTTON
// ===========================
export function CopyButton({ text }: { text: string }) {
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
