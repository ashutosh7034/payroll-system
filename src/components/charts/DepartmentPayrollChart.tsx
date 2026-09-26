import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DepartmentData {
  department: string;
  value: number;
  label: string;
}

interface Props {
  data: DepartmentData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{payload[0].payload.department}</p>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
          Cost: {payload[0].payload.label}
        </p>
      </div>
    );
  }
  return null;
};

const DepartmentPayrollChart: React.FC<Props> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
          <XAxis 
            type="number"
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
            dy={10}
          />
          <YAxis 
            type="category"
            dataKey="department" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}
            width={120}
          />
          <Tooltip cursor={{ fill: 'var(--bg-surface-hover)' }} content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            fill="var(--primary-dark)" 
            radius={[0, 4, 4, 0]}
            barSize={20}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentPayrollChart;
