'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props { data: Record<string, number>; }

const COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  PENDING:   '#f59e0b',
  FAILED:    '#ef4444',
  REFUNDED:  '#8b5cf6',
  PROCESSING:'#3b82f6',
  CANCELLED: '#6b7280',
  PARTIALLY_REFUNDED: '#f97316',
};

export const PaymentStatusChart = ({ data }: Props) => {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
          paddingAngle={3} dataKey="value">
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#6b7280'} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
          labelStyle={{ color: '#aaa' }}
          itemStyle={{ color: '#fff', fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8}
          formatter={(v) => <span style={{ color: '#888', fontSize: 11 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
};
