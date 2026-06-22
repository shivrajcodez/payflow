'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TableSkeleton } from '@/components/ui/skeletons';
import api from '@/lib/axios';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { Shield, AlertTriangle, Users, Eye } from 'lucide-react';
import type { User } from '@/types';

interface FraudFlag {
  id: string;
  riskLevel: string;
  riskScore: number;
  ipAddress?: string;
  reviewed: boolean;
  autoBlocked: boolean;
  createdAt: string;
  payment: { paymentReference: string; amount: number; currency: string };
}

interface PagedData<T> { content: T[]; totalElements: number; }

export default function AdminPage() {
  const [users, setUsers]           = useState<User[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [loadingUsers, setLoadingUsers]   = useState(true);
  const [loadingFraud, setLoadingFraud]   = useState(true);
  const [activeTab, setActiveTab]   = useState<'users' | 'fraud'>('users');

  useEffect(() => {
    api.get<{ data: PagedData<User> }>('/v1/admin/users', { params: { page: 0, size: 20 } })
      .then(({ data }) => setUsers(data.data.content))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
    api.get<{ data: PagedData<FraudFlag> }>('/v1/admin/fraud-flags', { params: { page: 0, size: 20 } })
      .then(({ data }) => setFraudFlags(data.data.content))
      .catch(() => {})
      .finally(() => setLoadingFraud(false));
  }, []);

  const reviewFlag = async (id: string) => {
    await api.put('/v1/admin/fraud-flags/' + id + '/review', null, { params: { notes: 'Reviewed by admin', approved: true } });
    setFraudFlags((prev) => prev.map((f) => f.id === id ? { ...f, reviewed: true } : f));
  };

  const riskColors: Record<string, string> = {
    LOW: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    MEDIUM: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    HIGH: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    CRITICAL: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-brand-red-light" />
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Panel</h1>
            <p className="text-dark-400 mt-0.5">Platform management and oversight.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-dark-800 pb-0">
          {[
            { key: 'users', label: 'Users', icon: Users, count: users.length },
            { key: 'fraud', label: 'Fraud Flags', icon: AlertTriangle, count: fraudFlags.filter(f => !f.reviewed).length },
          ].map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
              className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ' +
                (activeTab === key ? 'border-brand-red text-white' : 'border-transparent text-dark-400 hover:text-white')}>
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && <span className={'px-1.5 py-0.5 rounded-full text-xs font-bold ' + (key === 'fraud' ? 'bg-red-500 text-white' : 'bg-dark-700 text-dark-300')}>{count}</span>}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden">
            {loadingUsers ? <TableSkeleton rows={8} /> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-dark-800">
                  {['User', 'Role', 'Status', 'Last Login', 'Created'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-dark-800/40">
                  {users.map((u) => (
                    <tr key={u.id} className="table-row-hover">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-xs font-bold text-brand-red-light flex-shrink-0">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-dark-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={'status-badge text-xs ' + (u.role === 'ADMIN' ? 'text-brand-red-light bg-brand-red/10 border-brand-red/20' : 'text-dark-400 bg-dark-800 border-dark-700')}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={'status-badge text-xs ' + (u.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20')}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-dark-400 text-xs">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</td>
                      <td className="px-5 py-3.5 text-dark-400 text-xs">{formatDateTime(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Fraud Flags Tab */}
        {activeTab === 'fraud' && (
          <div className="glass-card overflow-hidden">
            {loadingFraud ? <TableSkeleton rows={8} /> : fraudFlags.length === 0 ? (
              <div className="py-16 text-center text-dark-500">
                <p className="text-4xl mb-3">🛡️</p>
                <p>No fraud flags detected.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-dark-800">
                  {['Payment', 'Risk Level', 'Score', 'IP', 'Auto Blocked', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-dark-800/40">
                  {fraudFlags.map((f) => (
                    <tr key={f.id} className="table-row-hover">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs text-dark-300">{f.payment?.paymentReference || '—'}</div>
                        {f.payment && <div className="text-xs text-dark-500">{formatCurrency(f.payment.amount, f.payment.currency as 'USD')}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={'status-badge text-xs ' + (riskColors[f.riskLevel] || '')}>{f.riskLevel}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-sm">{f.riskScore}</td>
                      <td className="px-5 py-3.5 text-dark-400 text-xs font-mono">{f.ipAddress || '—'}</td>
                      <td className="px-5 py-3.5">
                        {f.autoBlocked && <span className="status-badge text-xs text-red-400 bg-red-400/10 border-red-400/20">Blocked</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={'status-badge text-xs ' + (f.reviewed ? 'text-dark-400 bg-dark-800 border-dark-700' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20')}>
                          {f.reviewed ? 'Reviewed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-dark-400 text-xs">{formatDateTime(f.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        {!f.reviewed && (
                          <button onClick={() => reviewFlag(f.id)} className="btn-ghost text-xs py-1 px-3 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
