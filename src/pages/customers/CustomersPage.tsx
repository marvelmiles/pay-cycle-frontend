import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Search } from "lucide-react";
import { customerService } from "../../services/api";
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
  EmptyState,
  LoadingSpinner,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/utils";
import type { Customer } from "../../types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const customerSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

export const CustomersPage: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: () =>
      customerService
        .list({ page, limit: 20, search: search || undefined })
        .then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const createMutation = useMutation({
    mutationFn: (d: CustomerForm) => customerService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setModalOpen(false);
      reset();
    },
  });

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (c: Customer) => (
        <div>
          <p className="font-medium text-gray-900">
            {c.firstName} {c.lastName}
          </p>
          <p className="text-xs text-gray-400">{c.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (c: Customer) => (
        <span className="text-gray-500">{c.phone || "—"}</span>
      ),
    },
    {
      key: "spent",
      header: "Total Spent",
      render: (c: Customer) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(c.totalSpent)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c: Customer) => (
        <StatusBadge status={c.isActive ? "active" : "cancelled"} />
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (c: Customer) => (
        <span className="text-gray-500">{formatDate(c.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer base</p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setModalOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <span className="text-sm text-gray-500">
              {data?.pagination?.total || 0} customers
            </span>
          </div>
        </CardHeader>
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.data?.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No customers yet"
              description="Add your first customer or they'll appear here after a payment."
              icon={<Users className="h-12 w-12" />}
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setModalOpen(true)}
                >
                  Add Customer
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
        title="Add Customer"
      >
        <form
          onSubmit={handleSubmit((d) => createMutation.mutate(d))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input label="Phone (optional)" type="tel" {...register("phone")} />
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
              Add Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
