import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search, Pause, Play, XCircle } from 'lucide-react';
import { customerService, transactionService, subscriptionService } from '../services/api';
import {
  Button, Card, CardHeader, CardBody, StatusBadge, Table, Pagination,
  Modal, Input, EmptyState, LoadingSpinner, Select,
} from '../components/ui';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import type { Customer, Transaction, Subscription } from '../types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// ===========================
// CUSTOMERS PAGE
// ===========================
const customerSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

export const CustomersPage: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customerService.list({ page, limit: 20, search: search || undefined }).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const createMutation = useMutation({
    mutationFn: (d: CustomerForm) => customerService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setModalOpen(false); reset(); },
  });

  const columns = [
    {
      key: 'name', header: 'Customer',
      render: (c: Customer) => (
        <div>
          <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
          <p className="text-xs text-gray-400">{c.email}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (c: Customer) => <span className="text-gray-500">{c.phone || '—'}</span> },
    {
      key: 'spent', header: 'Total Spent',
      render: (c: Customer) => <span className="font-semibold text-gray-900">{formatCurrency(c.totalSpent)}</span>,
    },
    { key: 'status', header: 'Status', render: (c: Customer) => <StatusBadge status={c.isActive ? 'active' : 'cancelled'} /> },
    { key: 'joined', header: 'Joined', render: (c: Customer) => <span className="text-gray-500">{formatDate(c.createdAt)}</span> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer base</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Customer</Button>
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
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <span className="text-sm text-gray-500">{data?.pagination?.total || 0} customers</span>
          </div>
        </CardHeader>
        {isLoading ? <LoadingSpinner /> : (
          data?.data?.length === 0 ? (
            <CardBody>
              <EmptyState title="No customers yet" description="Add your first customer or they'll appear here after a payment."
                icon={<Users className="h-12 w-12" />}
                action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Customer</Button>} />
            </CardBody>
          ) : (
            <>
              <Table columns={columns} data={data?.data || []} />
              <Pagination page={page} pages={data?.pagination?.pages || 1} total={data?.pagination?.total || 0} onPage={setPage} />
            </>
          )
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Customer">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone (optional)" type="tel" {...register('phone')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={isSubmitting || createMutation.isPending}>Add Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ===========================
// TRANSACTIONS PAGE
// ===========================
export const TransactionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, status],
    queryFn: () => transactionService.list({ page, limit: 20, status: status || undefined }).then((r) => r.data),
  });

  const columns = [
    {
      key: 'ref', header: 'Reference',
      render: (t: Transaction) => (
        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{t.reference}</span>
      ),
    },
    {
      key: 'customer', header: 'Customer',
      render: (t: Transaction) => {
        const c = typeof t.customer === 'object' ? t.customer : null;
        return c ? <div><p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p><p className="text-xs text-gray-400">{c.email}</p></div> : <span className="text-gray-400">—</span>;
      },
    },
    {
      key: 'product', header: 'Product',
      render: (t: Transaction) => {
        const p = typeof t.product === 'object' ? t.product : null;
        return p ? <span className="text-gray-700">{p.name}</span> : <span className="text-gray-400">—</span>;
      },
    },
    {
      key: 'amount', header: 'Amount',
      render: (t: Transaction) => <span className="font-semibold text-gray-900">{formatCurrency(t.amount, t.currency)}</span>,
    },
    { key: 'type', header: 'Type', render: (t: Transaction) => <span className="text-xs capitalize text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{t.type.replace('_', ' ')}</span> },
    { key: 'status', header: 'Status', render: (t: Transaction) => <StatusBadge status={t.status} /> },
    { key: 'date', header: 'Date', render: (t: Transaction) => <span className="text-gray-500 text-xs">{formatDateTime(t.createdAt)}</span> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">All payment activity for your business</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Select options={[
              { value: '', label: 'All statuses' },
              { value: 'successful', label: 'Successful' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
            ]} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44" />
            <span className="text-sm text-gray-500">{data?.pagination?.total || 0} transactions</span>
          </div>
        </CardHeader>
        {isLoading ? <LoadingSpinner /> : (
          data?.data?.length === 0 ? (
            <CardBody>
              <EmptyState title="No transactions yet" description="Transactions will appear here once payments are processed." icon={<XCircle className="h-12 w-12" />} />
            </CardBody>
          ) : (
            <>
              <Table columns={columns} data={data?.data || []} />
              <Pagination page={page} pages={data?.pagination?.pages || 1} total={data?.pagination?.total || 0} onPage={setPage} />
            </>
          )
        )}
      </Card>
    </div>
  );
};

// ===========================
// SUBSCRIPTIONS PAGE
// ===========================
export const SubscriptionsPage: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', page, status],
    queryFn: () => subscriptionService.list({ page, limit: 20, status: status || undefined }).then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.cancel(id, { cancelAtPeriodEnd: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
  const pauseMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.pause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
  const resumeMutation = useMutation({
    mutationFn: (id: string) => subscriptionService.resume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const columns = [
    {
      key: 'customer', header: 'Customer',
      render: (s: Subscription) => {
        const c = typeof s.customer === 'object' ? s.customer : null;
        return c ? <div><p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p><p className="text-xs text-gray-400">{c.email}</p></div> : <span>—</span>;
      },
    },
    {
      key: 'product', header: 'Plan',
      render: (s: Subscription) => {
        const p = typeof s.product === 'object' ? s.product : null;
        return p ? (
          <div>
            <p className="font-medium text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-400">{formatCurrency(p.price)}/{p.interval}</p>
          </div>
        ) : <span>—</span>;
      },
    },
    { key: 'status', header: 'Status', render: (s: Subscription) => <StatusBadge status={s.status} /> },
    { key: 'period', header: 'Period End', render: (s: Subscription) => <span className="text-gray-500">{formatDate(s.currentPeriodEnd)}</span> },
    {
      key: 'actions', header: '',
      render: (s: Subscription) => (
        <div className="flex gap-1">
          {s.status === 'active' && (
            <>
              <button onClick={() => pauseMutation.mutate(s._id)} title="Pause"
                className="p-1.5 rounded text-orange-500 hover:bg-orange-50">
                <Pause className="h-4 w-4" />
              </button>
              <button onClick={() => cancelMutation.mutate(s._id)} title="Cancel"
                className="p-1.5 rounded text-red-500 hover:bg-red-50">
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          {s.status === 'paused' && (
            <button onClick={() => resumeMutation.mutate(s._id)} title="Resume"
              className="p-1.5 rounded text-green-500 hover:bg-green-50">
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
        <p className="text-gray-500 mt-1">Track and manage recurring subscriptions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Select options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'trialing', label: 'Trialing' },
              { value: 'paused', label: 'Paused' },
              { value: 'past_due', label: 'Past Due' },
              { value: 'cancelled', label: 'Cancelled' },
            ]} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44" />
            <span className="text-sm text-gray-500">{data?.pagination?.total || 0} subscriptions</span>
          </div>
        </CardHeader>
        {isLoading ? <LoadingSpinner /> : (
          data?.data?.length === 0 ? (
            <CardBody>
              <EmptyState title="No subscriptions yet" description="Subscriptions are created when customers pay for recurring plans."
                icon={<Repeat2Icon />} />
            </CardBody>
          ) : (
            <>
              <Table columns={columns} data={data?.data || []} />
              <Pagination page={page} pages={data?.pagination?.pages || 1} total={data?.pagination?.total || 0} onPage={setPage} />
            </>
          )
        )}
      </Card>
    </div>
  );
};

const Repeat2Icon = () => (
  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
  </svg>
);
