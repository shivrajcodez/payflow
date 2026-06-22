'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, CreditCard, Building2, Wallet, Bitcoin } from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { cn } from '@/lib/utils';
import type { PaymentMethod, Currency } from '@/types';

const schema = z.object({
  amount: z.number({ invalid_type_error: 'Enter a valid amount' }).min(0.01).max(999999),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'WALLET', 'CRYPTO']),
  description: z.string().max(500).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerName: z.string().max(255).optional(),
  cardLastFour: z.string().regex(/^\d{4}$/).optional().or(z.literal('')),
  cardBrand: z.string().optional(),
  cardExpMonth: z.number().min(1).max(12).optional(),
  cardExpYear: z.number().min(2024).max(2040).optional(),
  bankAccountLastFour: z.string().regex(/^\d{4}$/).optional().or(z.literal('')),
  bankName: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

interface Props { onClose: () => void; onSuccess: () => void; }

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'CARD',          label: 'Card',          icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer',  icon: Building2 },
  { value: 'WALLET',        label: 'Wallet',         icon: Wallet },
  { value: 'CRYPTO',        label: 'Crypto',         icon: Bitcoin },
];

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];
const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover'];

export const CreatePaymentModal = ({ onClose, onSuccess }: Props) => {
  const { createPayment, loading } = usePayments();
  const [serverError, setServerError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CARD');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD', paymentMethod: 'CARD' },
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await createPayment({
        ...data,
        amount: Number(data.amount),
        cardLastFour: data.cardLastFour || undefined,
        bankAccountLastFour: data.bankAccountLastFour || undefined,
        customerEmail: data.customerEmail || undefined,
        webhookUrl: data.webhookUrl || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg || 'Payment failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-800 sticky top-0 bg-dark-900 z-10">
          <div>
            <h2 className="text-lg font-bold">Create Payment</h2>
            <p className="text-dark-400 text-sm">Simulate a payment transaction</p>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {serverError && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Amount *</label>
              <input {...register('amount', { valueAsNumber: true })}
                type="number" step="0.01" placeholder="0.00" className="input-dark" />
              {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Currency</label>
              <select {...register('currency')} className="input-dark cursor-pointer">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Payment Method *</label>
            <div className="grid grid-cols-4 gap-2">
              {METHOD_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button"
                  onClick={() => { setSelectedMethod(value); setValue('paymentMethod', value); }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all',
                    selectedMethod === value
                      ? 'bg-brand-red/10 border-brand-red/40 text-brand-red-light'
                      : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600 hover:text-white'
                  )}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Card details */}
          {selectedMethod === 'CARD' && (
            <div className="space-y-3 p-4 rounded-xl bg-dark-800/50 border border-dark-700">
              <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Card Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Last 4 digits</label>
                  <input {...register('cardLastFour')} placeholder="4242" maxLength={4} className="input-dark" />
                  {errors.cardLastFour && <p className="mt-1 text-xs text-red-400">{errors.cardLastFour.message}</p>}
                </div>
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Brand</label>
                  <select {...register('cardBrand')} className="input-dark cursor-pointer">
                    <option value="">Select brand</option>
                    {CARD_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Exp Month</label>
                  <input {...register('cardExpMonth', { valueAsNumber: true })}
                    type="number" min="1" max="12" placeholder="12" className="input-dark" />
                </div>
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Exp Year</label>
                  <input {...register('cardExpYear', { valueAsNumber: true })}
                    type="number" min="2024" max="2040" placeholder="2027" className="input-dark" />
                </div>
              </div>
            </div>
          )}

          {/* Bank details */}
          {selectedMethod === 'BANK_TRANSFER' && (
            <div className="space-y-3 p-4 rounded-xl bg-dark-800/50 border border-dark-700">
              <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Bank Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Account last 4</label>
                  <input {...register('bankAccountLastFour')} placeholder="5678" maxLength={4} className="input-dark" />
                </div>
                <div>
                  <label className="block text-xs text-dark-300 mb-1">Bank Name</label>
                  <input {...register('bankName')} placeholder="Chase" className="input-dark" />
                </div>
              </div>
            </div>
          )}

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Customer Name</label>
              <input {...register('customerName')} placeholder="John Doe" className="input-dark" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Customer Email</label>
              <input {...register('customerEmail')} type="email" placeholder="john@example.com" className="input-dark" />
              {errors.customerEmail && <p className="mt-1 text-xs text-red-400">{errors.customerEmail.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Description</label>
            <input {...register('description')} placeholder="Payment for services…" className="input-dark" />
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Webhook URL (optional)</label>
            <input {...register('webhookUrl')} type="url" placeholder="https://your-server.com/webhooks" className="input-dark" />
            {errors.webhookUrl && <p className="mt-1 text-xs text-red-400">{errors.webhookUrl.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {loading ? 'Processing…' : 'Create Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
