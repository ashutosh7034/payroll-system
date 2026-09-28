import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  IndianRupee, Users, CheckCircle2, AlertCircle, 
  Wallet, Banknote, FileText, Clock, CalendarDays, Receipt, Building2, ShieldCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { token, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/dashboard`, {
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
    return <div className="p-8 text-center text-secondary">Loading role-specific dashboard data...</div>;
  }

  // Dashboard Resolver
  switch (data.type) {
    case 'EMPLOYEE': return <EmployeeDashboard data={data} />;
    case 'HR': return <HRDashboard data={data} />;
    case 'FINANCE': return <FinanceDashboard data={data} />;
    case 'PAYROLL': return <PayrollManagerDashboard data={data} />;
    case 'TENANT_ADMIN': return <TenantAdminDashboard data={data} />;
    case 'AUDITOR': return <AuditorDashboard data={data} />;
    case 'MANAGER': return <ManagerDashboard data={data} />;
    case 'PLATFORM': return <PlatformAdminDashboard data={data} />;
    default: return <div className="p-8">No dashboard configuration found for your role.</div>;
  }
};

// --- Sub Dashboards ---

const EmployeeDashboard = ({ data }: any) => {
  const navigate = useNavigate();
  const { metrics, recentPayslips, employee } = data;
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

const FinanceDashboard = ({ data }: any) => {
  const { metrics, latestPeriod } = data;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="page-title mb-1">Finance & Accounting</h1>
        <p className="text-secondary text-small">Financial metrics for {latestPeriod}</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Payroll Cost" value={`₹${(metrics.payrollCost/100000).toFixed(1)}L`} icon={<IndianRupee size={16} />} />
        <KpiCard title="Gross Payroll" value={`₹${(metrics.grossPayroll/100000).toFixed(1)}L`} icon={<Wallet size={16} />} />
        <KpiCard title="Net Payable" value={`₹${(metrics.netPayable/100000).toFixed(1)}L`} icon={<Banknote size={16} />} />
        <KpiCard title="Tax & Liabilities" value={`₹${(metrics.liabilities/100000).toFixed(1)}L`} icon={<Receipt size={16} />} />
      </div>
    </div>
  );
};

const HRDashboard = ({ data }: any) => {
  const { metrics } = data;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="page-title mb-1">HR & Workforce</h1>
        <p className="text-secondary text-small">Headcount and organizational structure</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard title="Active Employees" value={metrics.activeEmployees} icon={<Users size={16} />} />
        <KpiCard title="New Joiners (This Month)" value={metrics.newJoiners} icon={<CheckCircle2 size={16} />} />
        <KpiCard title="Total Departments" value={metrics.totalDepts} icon={<Building2 size={16} />} />
      </div>
    </div>
  );
};

const PayrollManagerDashboard = ({ data }: any) => {
  const { metrics, recentRuns } = data;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="page-title mb-1">Payroll Operations</h1>
        <p className="text-secondary text-small">Processing status and exceptions</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard title="Pending Runs" value={metrics.pendingRuns} icon={<Clock size={16} />} />
        <KpiCard title="Active Exceptions" value={metrics.exceptions} icon={<AlertCircle size={16} />} />
        <KpiCard title="Employees in Processing" value={metrics.activeEmployees} icon={<Users size={16} />} />
      </div>
      <div className="card" style={{ padding: '20px' }}>
        <h2 className="card-title text-small mb-4">Recent Runs</h2>
        {recentRuns.map((r: any, i: number) => (
             <div key={i} className="flex justify-between items-center py-2 border-b border-light">
               <span className="font-medium text-sm">Month {r.month}/{r.year}</span>
               <span className={`badge ${r.status === 'FINALIZED' ? 'badge-success' : 'badge-neutral'}`}>{r.status}</span>
             </div>
        ))}
      </div>
    </div>
  );
};

const TenantAdminDashboard = ({ data }: any) => {
  const { metrics } = data;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="page-title mb-1">Company Administration</h1>
        <p className="text-secondary text-small">Executive overview of business operations</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Employees" value={metrics.activeEmployees} icon={<Users size={16} />} />
        <KpiCard title="Total App Users" value={metrics.totalUsers} icon={<Users size={16} />} />
        <KpiCard title="Departments" value={metrics.depts} icon={<Building2 size={16} />} />
        <KpiCard title="Locations" value={metrics.locs} icon={<Building2 size={16} />} />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KpiCard title="Processed Payroll Runs" value={metrics.payrollProcessed} icon={<CheckCircle2 size={16} />} />
        <KpiCard title="Pending Payroll Runs" value={metrics.payrollPending} icon={<Clock size={16} />} />
      </div>
    </div>
  );
};

const AuditorDashboard = ({ data }: any) => {
  const { metrics } = data;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="page-title mb-1">Audit & Compliance</h1>
        <p className="text-secondary text-small">Read-only oversight</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KpiCard title="Active Exceptions" value={metrics.activeExceptions} icon={<AlertCircle size={16} />} />
        <KpiCard title="Audited Finalized Runs" value={metrics.auditedRuns} icon={<ShieldCheck size={16} />} />
      </div>
    </div>
  );
};

const ManagerDashboard = ({ data }: any) => {
  const { metrics } = data;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="page-title mb-1">Team Overview</h1>
        <p className="text-secondary text-small">Manager dashboard</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KpiCard title="Team Headcount" value={metrics.teamSize} icon={<Users size={16} />} />
        <KpiCard title="Team Payroll Exceptions" value={metrics.teamExceptions} icon={<AlertCircle size={16} />} />
      </div>
    </div>
  );
};

const PlatformAdminDashboard = ({ data }: any) => {
  const { metrics } = data;
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mb-6">
        <h1 className="page-title mb-1">Platform Administration</h1>
        <p className="text-secondary text-small">Global Multi-tenant metrics</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Tenants" value={metrics.totalTenants} icon={<Building2 size={16} />} />
        <KpiCard title="Active Tenants" value={metrics.activeTenants} icon={<CheckCircle2 size={16} />} />
        <KpiCard title="Total Global Users" value={metrics.totalUsers} icon={<Users size={16} />} />
        <KpiCard title="Total Global Employees" value={metrics.totalEmployees} icon={<Users size={16} />} />
      </div>
    </div>
  );
};

// --- Shared UI ---

const KpiCard = ({ title, value, icon }: any) => (
  <div className="card h-full" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div className="flex items-center gap-2 text-secondary font-medium mb-3" style={{ fontSize: '12px' }}>
      <div className="flex items-center justify-center bg-primary-light text-primary rounded p-1">{icon}</div>
      {title}
    </div>
    <div className="text-primary font-bold" style={{ fontSize: '24px', lineHeight: '1.2' }}>{value}</div>
  </div>
);

export default Dashboard;
