import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { PaymentStatus, Currency } from '@/types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (amount: number, currency: Currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr: string): string =>
  format(new Date(dateStr), 'MMM d, yyyy');

export const formatDateTime = (dateStr: string): string =>
  format(new Date(dateStr), 'MMM d, yyyy HH:mm');

export const formatRelativeTime = (dateStr: string): string =>
  formatDistanceToNow(new Date(dateStr), { addSuffix: true });

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);

export const truncateId = (id: string): string =>
  `${id.substring(0, 8)}...`;

export const getStatusColor = (status: PaymentStatus): string => {
  const map: Record<PaymentStatus, string> = {
    PENDING:            'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    PROCESSING:         'text-blue-400 bg-blue-400/10 border-blue-400/20',
    COMPLETED:          'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    FAILED:             'text-red-400 bg-red-400/10 border-red-400/20',
    REFUNDED:           'text-purple-400 bg-purple-400/10 border-purple-400/20',
    PARTIALLY_REFUNDED: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    CANCELLED:          'text-gray-400 bg-gray-400/10 border-gray-400/20',
  };
  return map[status] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20';
};

export const getStatusLabel = (status: PaymentStatus): string => {
  const map: Record<PaymentStatus, string> = {
    PENDING:            'Pending',
    PROCESSING:         'Processing',
    COMPLETED:          'Completed',
    FAILED:             'Failed',
    REFUNDED:           'Refunded',
    PARTIALLY_REFUNDED: 'Partially Refunded',
    CANCELLED:          'Cancelled',
  };
  return map[status] ?? status;
};

export const getRiskColor = (score: number): string => {
  if (score >= 75) return 'text-red-400';
  if (score >= 50) return 'text-orange-400';
  if (score >= 25) return 'text-yellow-400';
  return 'text-emerald-400';
};

export const generateIdempotencyKey = (): string =>
  `idem_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

export const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
