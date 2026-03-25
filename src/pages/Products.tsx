import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { productService } from "../services/api";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  StatusBadge,
  Table,
  Pagination,
  Modal,
  Input,
  Select,
  Textarea,
  EmptyState,
  LoadingSpinner,
} from "../components/ui";
import { formatCurrency, formatDate } from "../lib/utils";
import type { Product } from "../types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  type: z.enum(["one_time", "recurring"]),
  price: z.coerce.number().min(1, "Price must be > 0"),
  currency: z.string().default("NGN"),
  interval: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  trialDays: z.coerce.number().min(0).optional(),
  features: z.string().optional(),
});
type ProductForm = z.infer<typeof schema>;

export const ProductsPage: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["products", page],
    queryFn: () => productService.list({ page, limit: 20 }).then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(schema),
    defaultValues: { type: "one_time", currency: "NGN" },
  });

  const type = watch("type");

  const openCreate = () => {
    setEditing(null);
    reset({ type: "one_time", currency: "NGN" });
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    reset({
      name: p.name,
      description: p.description,
      type: p.type,
      price: p.price / 100,
      currency: p.currency,
      interval: p.interval,
      trialDays: p.trialDays,
      features: p.features.join("\n"),
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: ProductForm) => {
      const payload = {
        ...data,
        price: Math.round(data.price * 100),
        features: data.features
          ? data.features.split("\n").filter(Boolean)
          : [],
      };
      return editing
        ? productService.update(editing._id, payload)
        : productService.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const columns = [
    {
      key: "name",
      header: "Product",
      render: (p: Product) => (
        <div>
          <p className="font-medium text-gray-900">{p.name}</p>
          {p.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {p.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (p: Product) => (
        <span className="capitalize text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
          {p.type.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (p: Product) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(p.price)}{" "}
          {p.interval && (
            <span className="text-xs text-gray-400 font-normal">
              /{p.interval}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p: Product) => (
        <StatusBadge status={p.isActive ? "active" : "cancelled"} />
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (p: Product) => (
        <span className="text-gray-500">{formatDate(p.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (p: Product) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(menuOpen === p._id ? null : p._id);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen === p._id && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 w-36">
              <button
                onClick={() => {
                  openEdit(p);
                  setMenuOpen(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(p._id);
                  setMenuOpen(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Deactivate
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">
            Manage your billing plans and products
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          New Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">
            {data?.pagination?.total || 0} products
          </p>
        </CardHeader>
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.data?.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No products yet"
              description="Create your first billing plan or one-time product."
              icon={<Package className="h-12 w-12" />}
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={openCreate}
                >
                  Create Product
                </Button>
              }
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Product" : "Create Product"}
      >
        <form
          onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Product name"
            placeholder="e.g. Pro Plan"
            error={errors.name?.message}
            {...register("name")}
          />
          <Textarea
            label="Description (optional)"
            placeholder="What does this product include?"
            {...register("description")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              options={[
                { value: "one_time", label: "One-time" },
                { value: "recurring", label: "Recurring" },
              ]}
              error={errors.type?.message}
              {...register("type")}
            />
            <Input
              label={`Price (${watch("currency") || "NGN"})`}
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.price?.message}
              {...register("price")}
            />
          </div>
          {type === "recurring" && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Billing interval"
                options={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
                {...register("interval")}
              />
              <Input
                label="Trial days"
                type="number"
                placeholder="0"
                {...register("trialDays")}
              />
            </div>
          )}
          <Textarea
            label="Features (one per line)"
            placeholder={"Unlimited projects\nPriority support\nCustom domain"}
            {...register("features")}
          />
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
              loading={isSubmitting || saveMutation.isPending}
            >
              {editing ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
