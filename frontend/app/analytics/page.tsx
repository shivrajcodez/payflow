'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { PaymentStatusChart } from '@/components/charts/PaymentStatusChart';
import { MetricCardSkeleton } from '@/components/ui/skeletons';
import api from '@/lib/axios';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { TrendingUp, TrendingDown, CreditCard, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Analytics } from '@/types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Analytics }>('/v1/analytics/overview')
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Analytics</h1>
          <p className="text-dark-400 mt-1">Platform-wide revenue and transaction insights.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)}
          </div>
        ) : analytics ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[
                { label: 'Total Revenue', value: formatCurrency(analytics.totalRevenue), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', sub: `${analytics.revenueGrowthPercent >= 0 ? '+' : ''}${analytics.revenueGrowthPercent.toFixed(1)}% growth` },
                { label: 'This Month', value: formatCurrency(analytics.revenueThisMonth), icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', sub: `vs ${formatCurrency(analytics.revenueLastMonth)} last month` },
                { label: 'Success Rate', value: `${analytics.successRate.toFixed(1)}%`, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', sub: `${formatNumber(analytics.successfulPayments)} successful payments` },
                { label: 'Total Users', value: formatNumber(analytics.totalUsers), icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', sub: `+${analytics.newUsersThisMonth} new this month` },
                { label: 'Failed Payments', value: formatNumber(analytics.failedPayments), icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', sub: 'Requires attention' },
                { label: 'Fraud Flags', value: formatNumber(analytics.fraudFlagsCount ?? 0), icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', sub: `${analytics.unreviewedFraudFlags ?? 0} unreviewed` },
              ].map((m) => (
                <div key={m.label} className="metric-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-dark-400 font-medium">{m.label}</p>
                      <p className="text-2xl font-black tracking-tight mt-1">{m.value}</p>
                    </div>
                    <div className={'w-10 h-10 rounded-lg border flex items-center justify-center ' + m.bg}>
                      <m.icon className={'w-5 h-5 ' + m.color} />
                    </div>
                  </div>
                  <p className="text-xs text-dark-400">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6">
                <h2 className="font-bold text-sm text-dark-300 uppercase tracking-widest mb-6">Daily Revenue (7 days)</h2>
                {analytics.dailyRevenue.length > 0
                  ? <RevenueChart data={analytics.dailyRevenue} />
                  : <div className="h-[220px] flex items-center justify-center text-dark-500 text-sm">No revenue data available</div>
                }
              </div>
              <div className="glass-card p-6">
                <h2 className="font-bold text-sm text-dark-300 uppercase tracking-widest mb-6">Payment Status</h2>
                <PaymentStatusChart data={analytics.paymentsByStatus} />
              </div>
            </div>

            {/* Status Breakdown Table */}
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-dark-800">
                <h2 className="font-bold text-sm">Status Breakdown</h2>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-dark-800">
                  {['Status', 'Count', '% of Total'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-dark-800/40">
                  {Object.entries(analytics.paymentsByStatus).map(([status, count]) => {
                    const pct = analytics.totalPayments > 0 ? ((count / analytics.totalPayments) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={status} className="table-row-hover">
                        <td className="px-6 py-3.5 font-medium">{status}</td>
                        <td className="px-6 py-3.5 text-dark-300">{formatNumber(count)}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden max-w-[100px]">
                              <div className="h-full bg-brand-red rounded-full" style={{ width: pct + '%' }} />
                            </div>
                            <span className="text-dark-400 text-xs w-10">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="glass-card p-12 text-center text-dark-500">
            <p className="text-4xl mb-3">📊</p>
            <p>No analytics data available yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
