'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, ExternalLink, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PaymentDetailSkeleton } from '@/components/ui/skeletons';
import { usePayments } from '@/hooks/usePayments';
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel, getRiskColor, cn } from '@/lib/utils';
import type { Payment, Refund } from '@/types';
import api from '@/lib/axios';

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getPayment, refundPayment, loading } = usePayments();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [copied, setCopied] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPayment(id).then(setPayment).catch(() => router.push('/payments'));
    api.get('/v1/payments/' + id + '/refunds').then(({ data }) => setRefunds(data.data)).catch(() => {});
  }, [id]);

  const copyRef = () => {
    if (!payment) return;
    navigator.clipboard.writeText(payment.paymentReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefund = async () => {
    if (!payment) return;
    setRefunding(true);
    try {
      await refundPayment(payment.id, refundAmount ? Number(refundAmount) : undefined, refundReason);
      setShowRefundModal(false);
      const updated = await getPayment(payment.id);
      setPayment(updated);
      const r = await api.get('/v1/payments/' + id + '/refunds');
      setRefunds(r.data.data);
    } catch { /* ignore */ }
    finally { setRefunding(false); }
  };

  if (loading && !payment) return <DashboardLayout><PaymentDetailSkeleton /></DashboardLayout>;
  if (!payment) return null;

  const detailRows = [
    { label: 'Payment Reference', value: payment.paymentReference },
    { label: 'Payment Method', value: payment.paymentMethod + (payment.cardLastFour ? ' \u2022\u2022\u2022\u2022' + payment.cardLastFour : '') + (payment.cardBrand ? ' (' + payment.cardBrand + ')' : '') },
    { label: 'Customer Name', value: payment.customerName },
    { label: 'Customer Email', value: payment.customerEmail },
    { label: 'Description', value: payment.description },
    { label: 'Processing Fee', value: payment.processingFee ? formatCurrency(payment.processingFee, payment.currency) : undefined },
    { label: 'Net Amount', value: payment.netAmount ? formatCurrency(payment.netAmount, payment.currency) : undefined },
    { label: 'Created At', value: formatDateTime(payment.createdAt) },
    { label: 'Processed At', value: payment.processedAt ? formatDateTime(payment.processedAt) : undefined },
    { label: 'Failure Reason', value: payment.failureMessage },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black flex items-center gap-3">
              Payment Details
              <span className={'status-badge text-xs ' + getStatusColor(payment.status)}>
                {getStatusLabel(payment.status)}
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-dark-400 text-xs font-mono">{payment.paymentReference}</code>
              <button onClick={copyRef} className="text-dark-500 hover:text-white transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {payment.status === 'COMPLETED' && (
            <button onClick={() => setShowRefundModal(true)} className="btn-ghost flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4" /> Refund
            </button>
          )}
          {payment.receiptUrl && (
            <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-2 text-sm">
              <ExternalLink className="w-4 h-4" /> Receipt
            </a>
          )}
        </div>

        <div className="glass-card p-8 text-center gradient-border">
          <p className="text-5xl font-black tracking-tight">{formatCurrency(payment.amount, payment.currency)}</p>
          <p className="text-dark-400 mt-2">{payment.currency}</p>
          {payment.riskScore !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800 border border-dark-700 text-xs">
              <AlertTriangle className={'w-3.5 h-3.5 ' + getRiskColor(payment.riskScore)} />
              <span className="text-dark-300">Risk Score:</span>
              <span className={'font-bold ' + getRiskColor(payment.riskScore)}>{payment.riskScore}/100</span>
            </div>
          )}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-800">
            <h2 className="font-bold text-sm">Transaction Details</h2>
          </div>
          <dl className="divide-y divide-dark-800/50">
            {detailRows.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between px-6 py-3.5 gap-8">
                <dt className="text-sm text-dark-400 whitespace-nowrap flex-shrink-0 w-40">{label}</dt>
                <dd className={cn('text-sm font-medium text-right break-all', label === 'Failure Reason' ? 'text-red-400' : 'text-white')}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {refunds.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-800">
              <h2 className="font-bold text-sm">Refunds ({refunds.length})</h2>
            </div>
            <div className="divide-y divide-dark-800/40">
              {refunds.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-mono text-dark-300">{r.refundReference}</p>
                    {r.reason && <p className="text-xs text-dark-500 mt-0.5">{r.reason}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(r.amount, r.currency)}</p>
                    <span className={'status-badge text-xs ' + (r.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20')}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowRefundModal(false)} />
          <div className="relative bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-sm p-6 space-y-5 animate-slide-up">
            <h3 className="text-lg font-bold">Initiate Refund</h3>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Amount (leave blank for full)</label>
              <input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                type="number" step="0.01" placeholder={'Max: ' + formatCurrency(payment.amount, payment.currency)} className="input-dark" />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Reason</label>
              <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Customer request…" className="input-dark" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRefundModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleRefund} disabled={refunding} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {refunding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
