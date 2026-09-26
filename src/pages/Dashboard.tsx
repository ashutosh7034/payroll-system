import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, Users, CheckCircle2, AlertCircle, 
  Wallet, Banknote
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ReferenceLine 
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [period, setPeriod] = useState('Current Period (March 2026)');
  const [entity, setEntity] = useState('India Entity');
  const [location, setLocation] = useState('All Locations');
  const [department, setDepartment] = useState('All Departments');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const queryParams = new URLSearchParams({
          period,
          entity,
          location,
          department
        });
        const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/dashboard?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
  }, [token, period, entity, location, department]);

  const STATUS_COLORS = ['#3949ab', '#e0e0e0', '#e53935', '#fb8c00'];

  if (loading || !data) {
    return <div className="p-8 text-center text-secondary">Loading dashboard data...</div>;
  }

  const { metrics, payrollCostData, readinessData, payrollStatusData, departmentData, exceptionsData } = data;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* HEADER & FILTERS */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="page-title mb-1">PAYROLL Dashboard</h1>
          <p className="text-secondary text-small">Workforce, payroll, compliance and financial overview</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <span className="text-small text-secondary font-medium">Period:</span>
            <select className="form-select text-small py-1 px-2 h-8" value={period} onChange={e => setPeriod(e.target.value)}>
              <option>Current Period (March 2026)</option>
              <option>Previous Period (Feb 2026)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-small text-secondary font-medium">Entity:</span>
            <select className="form-select text-small py-1 px-2 h-8" value={entity} onChange={e => setEntity(e.target.value)}>
              <option>India Entity</option>
              <option>US Entity</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-small text-secondary font-medium">Location:</span>
            <select className="form-select text-small py-1 px-2 h-8" value={location} onChange={e => setLocation(e.target.value)}>
              <option>All Locations</option>
              <option>Bengaluru</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-small text-secondary font-medium">Dept:</span>
            <select className="form-select text-small py-1 px-2 h-8" value={department} onChange={e => setDepartment(e.target.value)}>
              <option>All Departments</option>
              <option>Engineering</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <KpiCard title="Payroll Cost" value={metrics.payrollCost} trend="+2.1%" isPositive={true} icon={<IndianRupee size={16} />} context="vs prev month" />
        <KpiCard title="Gross Payroll" value={metrics.grossPayroll} trend="+1.8%" isPositive={true} icon={<Wallet size={16} />} context="vs target" />
        <KpiCard title="Payroll Readiness" value={metrics.readiness} trend="-1.2%" isPositive={false} icon={<CheckCircle2 size={16} />} context="18 pending inputs" />
        <KpiCard title="Active Employees" value={metrics.activeEmployees} trend="+4" isPositive={true} icon={<Users size={16} />} context="total headcount" />
        <KpiCard title="Net Payable" value={metrics.netPayable} trend="+2.4%" isPositive={true} icon={<Banknote size={16} />} context="cash requirement" />
        <KpiCard title="Payroll Exceptions" value={metrics.exceptions} trend="+3" isPositive={false} icon={<AlertCircle size={16} />} context="critical issues" />
      </div>

      {/* MAIN CHARTS */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        
        {/* Payroll Cost Trend */}
        <div className="card h-full" style={{ padding: '20px' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-small">Payroll Cost Trend</h2>
            <span className="text-secondary text-xs">YTD FY 2025-26</span>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollCostData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a237e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#1a237e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} domain={['dataMin - 2', 'dataMax + 1']} tickFormatter={(val) => `₹${val}L`} />
                <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                <Area type="monotone" name="Actual Cost" dataKey="value" stroke="#1a237e" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                <Area type="monotone" name="Prev. Period" dataKey="previous" stroke="#9fa8da" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payroll Readiness Trend */}
        <div className="card h-full" style={{ padding: '20px' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-small">Readiness Trend</h2>
            <span className="text-secondary text-xs">Target: 100%</span>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readinessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} domain={[80, 105]} />
                <ReferenceLine y={100} stroke="#4F7D62" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: '#4F7D62', fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                <Line type="monotone" name="Readiness %" dataKey="value" stroke="#3949ab" strokeWidth={2} dot={{ r: 4, fill: '#3949ab', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payroll Status */}
        <div className="card h-full" style={{ padding: '20px' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-small">Payroll Status</h2>
            <span className="text-secondary text-xs">March 2026</span>
          </div>
          <div className="flex-col h-full">
            <div className="flex items-center justify-center relative" style={{ height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payrollStatusData} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                    {payrollStatusData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '4px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{metrics.activeEmployees}</span>
                <span className="text-[10px] text-secondary">Employees</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-4" style={{ padding: '0 8px' }}>
              {payrollStatusData.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs w-full">
                  <div className="flex items-center gap-2">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[idx] }}></span>
                    <span className="text-secondary">{item.name}</span>
                  </div>
                  <span className="font-medium text-primary tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* SECOND ANALYTICS SECTION */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        
        {/* Cost by Department */}
        <div className="card h-full" style={{ padding: '20px' }}>
          <h2 className="card-title text-small mb-4">Cost by Department</h2>
          <div className="flex-col gap-3">
            {departmentData.map((dept: any, idx: number) => {
              const maxVal = departmentData[0].value;
              const widthPct = (dept.value / maxVal) * 100;
              return (
                <div key={idx} className="flex items-center text-xs">
                  <div style={{ width: '80px' }} className="text-secondary font-medium">{dept.name}</div>
                  <div className="flex-1 ml-2 mr-3 bg-surface-active rounded" style={{ height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${widthPct}%`, height: '100%', backgroundColor: '#3949ab', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ width: '45px', textAlign: 'right' }} className="font-medium">{dept.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exceptions Breakdown */}
        <div className="card h-full" style={{ padding: '20px' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-small">Exceptions Breakdown</h2>
            <span className="badge badge-error px-2 py-0.5" style={{ fontSize: '10px' }}>12 Total</span>
          </div>
          <div className="flex-col gap-0 border border-light rounded overflow-hidden">
            <div className="flex justify-between items-center bg-surface-active px-3 py-2 text-xs font-semibold text-secondary">
              <span>Issue</span>
              <div className="flex w-24 justify-between">
                <span>Count</span>
                <span>Severity</span>
              </div>
            </div>
            {exceptionsData.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center px-3 py-2 border-t border-light text-xs hover:bg-surface-hover cursor-pointer transition-colors">
                <span className="font-medium text-primary">{item.name}</span>
                <div className="flex w-24 justify-between items-center">
                  <span className="font-medium">{item.value}</span>
                  <span style={{ 
                    color: item.severity === 'High' ? 'var(--error-color)' : 'var(--warning-color)',
                    fontSize: '11px', fontWeight: 500
                  }}>
                    {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Health */}
        <div className="card h-full" style={{ padding: '20px' }}>
          <h2 className="card-title text-small mb-4">Compliance Health</h2>
          <div className="grid grid-cols-2 gap-3">
            <ComplianceItem label="PF" status="Compliant" />
            <ComplianceItem label="ESI" status="Compliant" />
            <ComplianceItem label="PT" status="Attention" />
            <ComplianceItem label="TDS" status="Compliant" />
            <div style={{ gridColumn: 'span 2' }}>
              <ComplianceItem label="LWF" status="Action Required" />
            </div>
          </div>
        </div>

      </div>

      {/* PAYROLL PROCESSING LIFECYCLE */}
      <div className="card mb-6" style={{ padding: '20px 24px' }}>
        <h2 className="card-title text-small mb-4">Payroll Processing Lifecycle</h2>
        <div className="flex justify-between items-center">
          <LifecycleStep label="Input Collection" status="done" isFirst={true} />
          <LifecycleStep label="Calculation" status="done" />
          <LifecycleStep label="Validation" status="current" />
          <LifecycleStep label="Approval" status="pending" />
          <LifecycleStep label="Lock" status="pending" />
          <LifecycleStep label="Payment" status="pending" />
          <LifecycleStep label="Reconciliation" status="pending" isLast={true} />
        </div>
      </div>

      {/* OPERATIONAL WORK QUEUE */}
      <div className="card" style={{ padding: 0 }}>
        <div className="flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="card-title text-small">Payroll Work Queue</h2>
          <button className="btn-ghost text-xs text-primary font-medium py-1 px-2 border border-light rounded hover:bg-surface-active">
            View All Queue
          </button>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0, padding: 0 }}>
          <table className="data-table" style={{ fontSize: '13px' }}>
            <thead style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
              <tr>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Employee</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Department</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Issue</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Period</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Severity</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Owner</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <QueueRow emp="Rajesh Kumar" dept="Engineering" issue="Missing Bank Info" period="Mar 2026" severity="High" owner="HR Ops" status="Pending" action="Resolve" />
              <QueueRow emp="Anita Sharma" dept="Sales" issue="LOP Adjustment" period="Mar 2026" severity="Medium" owner="Manager" status="Pending" action="Review" />
              <QueueRow emp="Vikram Singh" dept="Finance" issue="Tax Declaration Mismatch" period="Mar 2026" severity="High" owner="Payroll Admin" status="Pending" action="Verify" />
              <QueueRow emp="Sneha Patel" dept="Operations" issue="Bonus Approval" period="Mar 2026" severity="Standard" owner="Dept Head" status="Approved" action="View" isLast={true} />
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// --- Sub-components ---

const KpiCard = ({ title, value, trend, isPositive, icon, context }: any) => {
  return (
    <div className="card h-full" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-secondary font-medium" style={{ fontSize: '12px' }}>
          <div className="flex items-center justify-center bg-primary-light text-primary rounded p-1">
            {icon}
          </div>
          {title}
        </div>
      </div>
      <div>
        <div className="text-primary font-bold mb-1" style={{ fontSize: '24px', lineHeight: '1.2' }}>{value}</div>
        <div className="flex items-center flex-wrap gap-1">
          <span className={`text-[12px] font-medium flex items-center ${isPositive ? 'text-success' : 'text-error'}`}>
            {trend}
          </span>
          <span className="text-[12px] text-tertiary">{context}</span>
        </div>
      </div>
    </div>
  );
};

const ComplianceItem = ({ label, status }: { label: string, status: string }) => {
  let color = 'var(--success-color)';
  if (status === 'Attention') color = 'var(--warning-color)';
  if (status === 'Action Required') color = 'var(--error-color)';

  return (
    <div className="flex items-center gap-2 p-2 rounded border border-light bg-surface-hover">
      <div className="font-semibold text-xs" style={{ width: '32px' }}>{label}</div>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }}></div>
      <div className="text-xs text-secondary font-medium">{status}</div>
    </div>
  );
};

const LifecycleStep = ({ label, status, isFirst = false }: any) => {
  let icon = <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--border-light)', backgroundColor: 'var(--bg-surface)', position: 'relative', zIndex: 10 }}></div>;
  let lineColor = "var(--border-light)";
  let textClass = "text-tertiary";

  if (status === 'done') {
    icon = <CheckCircle2 size={16} className="text-success" style={{ backgroundColor: 'var(--bg-surface)', position: 'relative', zIndex: 10 }} />;
    lineColor = "var(--success-color)";
    textClass = "text-secondary";
  } else if (status === 'current') {
    icon = <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--primary-dark)', border: '2px solid white', boxShadow: '0 0 0 1px var(--primary-dark)', position: 'relative', zIndex: 10 }}></div>;
    lineColor = "var(--border-light)";
    textClass = "text-primary font-semibold";
  }

  return (
    <div className="flex flex-col items-center flex-1" style={{ position: 'relative' }}>
      {!isFirst && <div style={{ position: 'absolute', top: '7px', left: '-50%', width: '100%', height: '2px', backgroundColor: lineColor }}></div>}
      <div className="mb-2 flex items-center justify-center" style={{ height: '16px' }}>
        {icon}
      </div>
      <div className={`text-center ${textClass}`} style={{ fontSize: '11px', maxWidth: '80px', lineHeight: '1.2' }}>{label}</div>
    </div>
  );
};

const QueueRow = ({ emp, dept, issue, period, severity, owner, status, action, isLast = false }: any) => {
  let sevBadge = "badge-neutral";
  if (severity === 'High') sevBadge = "badge-error";
  if (severity === 'Medium') sevBadge = "badge-warning";
  if (severity === 'Standard') sevBadge = "badge-success bg-surface-active text-secondary border border-light";

  let statBadge = "badge-neutral";
  if (status === 'Approved') statBadge = "badge-success";
  
  return (
    <tr>
      <td style={{ padding: '12px 20px', fontWeight: 500, borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}>{emp}</td>
      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}>{dept}</td>
      <td style={{ padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}>{issue}</td>
      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}>{period}</td>
      <td style={{ padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}><span className={`badge ${sevBadge}`}>{severity}</span></td>
      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}>{owner}</td>
      <td style={{ padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}><span className={`badge ${statBadge}`}>{status}</span></td>
      <td style={{ padding: '12px 20px', textAlign: 'right', borderBottom: isLast ? 'none' : '1px solid var(--border-light)' }}>
        <button className="text-primary hover:underline font-medium text-xs">{action}</button>
      </td>
    </tr>
  );
};

export default Dashboard;
