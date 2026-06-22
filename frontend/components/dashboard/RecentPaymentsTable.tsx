'use client';
import Link from 'next/link';
import { formatCurrency, formatRelativeTime, getStatusColor, getStatusLabel, truncateId } from '@/lib/utils';
import type { Payment } from '@/types';

interface Props { payments: Payment[]; }

const MethodIcon = ({ method }: { method: string }) => {
  const map: Record<string, string> = { CARD: '💳', BANK_TRANSFER: '🏦', WALLET: '👛', CRYPTO: '₿' };
  return <span className="text-base">{map[method] || '💰'}</span>;
};

export const RecentPaymentsTable = ({ payments }: Props) => {
  if (!payments.length) {
    return (
      <div className="py-16 text-center text-dark-500">
        <p className="text-4xl mb-3">💳</p>
        <p className="font-medium">No payments yet</p>
        <p className="text-sm mt-1">Create your first payment to see it here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-800">
            {['Reference', 'Amount', 'Method', 'Status', 'Time'].map((h) => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-800/50">
          {payments.map((p) => (
            <Link key={p.id} href={`/payments/${p.id}`} className="contents">
              <tr className="table-row-hover">
                <td className="px-6 py-4 font-mono text-xs text-dark-300">{truncateId(p.id)}</td>
                <td className="px-6 py-4 font-semibold">{formatCurrency(p.amount, p.currency)}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2">
                    <MethodIcon method={p.paymentMethod} />
                    <span className="text-dark-400 text-xs">{p.paymentMethod.replace('_', ' ')}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`status-badge ${getStatusColor(p.status)}`}>
                    {getStatusLabel(p.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-dark-400 text-xs">{formatRelativeTime(p.createdAt)}</td>
              </tr>
            </Link>
          ))}
        </tbody>
      </table>
    </div>
  );
};
