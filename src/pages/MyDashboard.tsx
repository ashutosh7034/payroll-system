import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, CalendarDays, Clock } from 'lucide-react';

const KpiCard = ({ title, value, icon }: any) => (
  <div className="card h-full" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div className="flex items-center gap-2 text-secondary font-medium mb-3" style={{ fontSize: '12px' }}>
      <div className="flex items-center justify-center bg-primary-light text-primary rounded p-1">{icon}</div>
      {title}
    </div>
    <div className="text-primary font-bold" style={{ fontSize: '24px', lineHeight: '1.2' }}>{value}</div>
  </div>
);

const MyDashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/dashboard?isEmployeeOnly=true`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (loading || !data) {
    return <div className="p-8 text-center text-secondary">Loading your dashboard...</div>;
  }

  const { metrics, recentPayslips, employee } = data;
  if (!employee) return <div className="p-8 text-center text-secondary">No employee record linked to your account.</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="mb-6">
        <h1 className="page-title mb-1">My Dashboard</h1>
        <p className="text-secondary text-small">Welcome back, {employee.firstName} {employee.lastName}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard title="Latest Net Pay" value={`₹${metrics.latestNetPay.toLocaleString()}`} icon={<Wallet size={16} />} />
        <KpiCard title="Leave Balance" value={`${metrics.leaveBalance} Days`} icon={<CalendarDays size={16} />} />
        <KpiCard title="Attendance" value={`${metrics.attendancePercent}%`} icon={<Clock size={16} />} />
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <h2 className="card-title text-small mb-4">Recent Payslips</h2>
        {recentPayslips.length > 0 ? (
          recentPayslips.map((ps: any, i: number) => (
             <div key={i} className="flex justify-between items-center py-2 border-b border-light">
               <span className="font-medium text-sm">Month {ps.month}/{ps.year}</span>
               <span className="text-secondary">₹{ps.netPay.toLocaleString()}</span>
             </div>
          ))
        ) : <p className="text-secondary text-sm">No recent payslips.</p>}
      </div>
    </div>
  );
};
export default MyDashboard;
