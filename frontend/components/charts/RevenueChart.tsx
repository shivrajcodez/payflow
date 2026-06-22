'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyRevenue } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface Props { data: DailyRevenue[]; }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-dark-400 text-xs mb-1">{label ? format(parseISO(label), 'MMM d, yyyy') : ''}</p>
        <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
        {payload[1] && <p className="text-dark-300 text-xs">{payload[1].value} transactions</p>}
      </div>
    );
  }
  return null;
};

export const RevenueChart = ({ data }: Props) => {
  const chartData = data.map((d) => ({
    ...d,
    date: d.date,
    label: format(parseISO(d.date), 'MMM d'),
    revenue: Number(d.revenue),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2}
          fill="url(#revGradient)" dot={false} activeDot={{ r: 4, fill: '#e11d48' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};
