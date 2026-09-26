import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PayrollCostData {
  month: string;
  value: number;
  label: string;
}

interface Props {
  data: PayrollCostData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{label} 2025/26</p>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
          Payroll Cost: {payload[0].payload.label}
        </p>
      </div>
    );
  }
  return null;
};

const PayrollCostChart: React.FC<Props> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-medium)', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="var(--primary-dark)" 
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--bg-surface)', stroke: 'var(--primary-dark)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--primary-dark)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PayrollCostChart;
