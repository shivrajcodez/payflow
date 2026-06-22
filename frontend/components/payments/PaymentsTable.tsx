'use client';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel, getRiskColor } from '@/lib/utils';
import type { Payment } from '@/types';

interface Props {
  payments: Payment[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export const PaymentsTable = ({ payments, total, page, pageSize, onPageChange }: Props) => {
  const totalPages = Math.ceil(total / pageSize);
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  if (!payments.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-5xl mb-4">💳</p>
        <p className="text-lg font-semibold">No payments found</p>
        <p className="text-dark-500 text-sm mt-1">Try adjusting your filters or create a new payment.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-800">
              {['Reference', 'Customer', 'Amount', 'Method', 'Status', 'Risk', 'Date'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800/40">
            {payments.map((p) => (
              <tr key={p.id} className="table-row-hover group">
                <td className="px-5 py-3.5">
                  <Link href={`/payments/${p.id}`} className="font-mono text-xs text-brand-red-light hover:text-brand-red transition-colors">
                    {p.paymentReference}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-sm font-medium truncate max-w-[140px]">{p.customerName || '—'}</div>
                  <div className="text-xs text-dark-400 truncate max-w-[140px]">{p.customerEmail || '—'}</div>
                </td>
                <td className="px-5 py-3.5 font-semibold whitespace-nowrap">
                  {formatCurrency(p.amount, p.currency)}
                  {p.processingFee && (
                    <div className="text-xs text-dark-500">fee: {formatCurrency(p.processingFee, p.currency)}</div>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-dark-400 bg-dark-800 border border-dark-700 rounded px-2 py-0.5">
                    {p.paymentMethod}
                    {p.cardLastFour && ` ••••${p.cardLastFour}`}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`status-badge ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {p.riskScore !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-current transition-all"
                          style={{ width: `${p.riskScore}%`, color: p.riskScore >= 50 ? '#ef4444' : p.riskScore >= 25 ? '#f59e0b' : '#10b981' }} />
                      </div>
                      <span className={`text-xs font-mono ${getRiskColor(p.riskScore)}`}>{p.riskScore}</span>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-dark-400 text-xs whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-dark-800">
        <p className="text-sm text-dark-400">
          Showing <span className="font-medium text-white">{start}–{end}</span> of{' '}
          <span className="font-medium text-white">{total.toLocaleString()}</span>
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
            className="btn-ghost p-2 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium px-3">
            Page {page + 1} / {totalPages}
          </span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}
            className="btn-ghost p-2 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
