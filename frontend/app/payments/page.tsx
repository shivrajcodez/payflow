'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CreatePaymentModal } from '@/components/payments/CreatePaymentModal';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { TableSkeleton } from '@/components/ui/skeletons';
import { usePayments } from '@/hooks/usePayments';
import { debounce } from '@/lib/utils';
import type { Payment, PaymentStatus } from '@/types';

const STATUS_OPTIONS: { value: PaymentStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function PaymentsPage() {
  const { getPayments, loading } = usePayments();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchPayments = useCallback(async (p = 0, s = status, q = query) => {
    const params: Record<string, unknown> = { page: p, size: 20, sortDir: 'desc' };
    if (s) params.status = s;
    if (q) params.query = q;
    const data = await getPayments(params);
    setPayments(data.content);
    setTotal(data.totalElements);
  }, [getPayments, status, query]);

  useEffect(() => { fetchPayments(); }, []);

  const debouncedSearch = useCallback(
    debounce((q: unknown) => {
      setPage(0);
      fetchPayments(0, status, q as string);
    }, 400),
    [fetchPayments, status]
  );

  const handleQueryChange = (q: string) => {
    setQuery(q);
    debouncedSearch(q);
  };

  const handleStatusChange = (s: PaymentStatus | '') => {
    setStatus(s);
    setPage(0);
    fetchPayments(0, s, query);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchPayments(p);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Payments</h1>
            <p className="text-dark-400 mt-1 text-sm">{total.toLocaleString()} total transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchPayments(page)}
              className="btn-ghost flex items-center gap-2 text-sm py-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Payment
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by reference, email, description…"
              className="input-dark pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-400" />
            <select value={status}
              onChange={(e) => handleStatusChange(e.target.value as PaymentStatus | '')}
              className="input-dark min-w-[150px] cursor-pointer">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading
            ? <TableSkeleton rows={10} />
            : (
              <PaymentsTable
                payments={payments}
                total={total}
                page={page}
                pageSize={20}
                onPageChange={handlePageChange}
                onRefresh={() => fetchPayments(page)}
              />
            )
          }
        </div>
      </div>

      {showCreate && (
        <CreatePaymentModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchPayments(0); }}
        />
      )}
    </DashboardLayout>
  );
}
