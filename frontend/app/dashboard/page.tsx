'use client';
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, CreditCard, Users, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { PaymentStatusChart } from '@/components/charts/PaymentStatusChart';
import { RecentPaymentsTable } from '@/components/dashboard/RecentPaymentsTable';
import { MetricCardSkeleton, TableSkeleton } from '@/components/ui/skeletons';
import api from '@/lib/axios';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Analytics, PagedResponse, Payment } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const fetchData = useCallback(async () => {
    // Fetch recent payments (all users)
    api.get<{ data: PagedResponse<Payment> }>('/v1/payments', { params: { page: 0, size: 10, sortDir: 'desc' } })
      .then(({ data }) => setRecentPayments(data.data.content))
      .catch(() => {})
      .finally(() => setLoadingPayments(false));

    // Admin-only analytics
    if (isAdmin) {
      api.get<{ data: Analytics }>('/v1/analytics/overview')
        .then(({ data }) => setAnalytics(data.data))
        .catch(() => {})
        .finally(() => setLoadingAnalytics(false));
    } else {
      setLoadingAnalytics(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metrics = isAdmin && analytics ? [
    {
      label: 'Total Revenue',
      value: formatCurrency(analytics.totalRevenue),
      sub: `${analytics.revenueGrowthPercent >= 0 ? '+' : ''}${analytics.revenueGrowthPercent}% vs last month`,
      icon: TrendingUp,
      up: analytics.revenueGrowthPercent >= 0,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
    },
    {
      label: 'Total Payments',
      value: formatNumber(analytics.totalPayments),
      sub: `${formatNumber(analytics.paymentsThisMonth)} this month`,
      icon: CreditCard,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20',
    },
    {
      label: 'Success Rate',
      value: `${analytics.successRate.toFixed(1)}%`,
      sub: `${formatNumber(analytics.successfulPayments)} successful`,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
    },
    {
      label: 'Total Users',
      value: formatNumber(analytics.totalUsers),
      sub: `+${analytics.newUsersThisMonth} new this month`,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10 border-purple-400/20',
    },
    {
      label: 'Failed Payments',
      value: formatNumber(analytics.failedPayments),
      sub: 'Across all time',
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/20',
    },
    {
      label: 'Fraud Flags',
      value: formatNumber(analytics.fraudFlagsCount ?? 0),
      sub: `${analytics.unreviewedFraudFlags ?? 0} pending review`,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20',
    },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Good {getGreeting()},{' '}
            <span className="text-gradient-red">{user?.firstName}</span> 👋
          </h1>
          <p className="text-dark-400 mt-1">Here's what's happening with your payments.</p>
        </div>

        {/* Metrics Grid */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {loadingAnalytics
              ? Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)
              : metrics.map((m) => (
                <div key={m.label} className="metric-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-dark-400 font-medium">{m.label}</p>
                      <p className="text-2xl font-black tracking-tight mt-1">{m.value}</p>
                    </div>
                    <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center', m.bg)}>
                      <m.icon className={cn('w-5 h-5', m.color)} />
                    </div>
                  </div>
                  <p className="text-xs text-dark-400">{m.sub}</p>
                </div>
              ))
            }
          </div>
        )}

        {/* Charts row */}
        {isAdmin && analytics && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6">
              <h2 className="font-bold text-sm text-dark-300 uppercase tracking-widest mb-6">Revenue (7 days)</h2>
              <RevenueChart data={analytics.dailyRevenue} />
            </div>
            <div className="glass-card p-6">
              <h2 className="font-bold text-sm text-dark-300 uppercase tracking-widest mb-6">By Status</h2>
              <PaymentStatusChart data={analytics.paymentsByStatus} />
            </div>
          </div>
        )}

        {/* Recent Payments */}
        <div className="glass-card">
          <div className="flex items-center justify-between p-6 border-b border-dark-800">
            <h2 className="font-bold">Recent Payments</h2>
            <a href="/payments" className="text-xs text-brand-red-light hover:text-brand-red transition-colors font-medium">
              View all →
            </a>
          </div>
          {loadingPayments
            ? <TableSkeleton rows={5} />
            : <RecentPaymentsTable payments={recentPayments} />
          }
        </div>
      </div>
    </DashboardLayout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
