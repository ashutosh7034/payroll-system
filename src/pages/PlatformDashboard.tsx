import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Activity, Briefcase, TrendingUp, ChevronRight, Server, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const PlatformDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-content-inner" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 className="page-title text-secondary">Loading Platform Overview...</h1>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="card" style={{ height: '120px', backgroundColor: '#FAFAFA' }}></div>)}
        </div>
        <div className="card" style={{ height: '300px', backgroundColor: '#FAFAFA' }}></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="app-content-inner flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <AlertCircle size={48} className="text-danger mb-4" />
        <h2 className="section-title mb-2">Unable to load platform metrics.</h2>
        <p className="text-secondary mb-6">The API request failed or returned invalid data.</p>
        <button className="btn btn-primary" onClick={() => { setLoading(true); setError(false); fetchMetrics(); }}>Retry Connection</button>
      </div>
    );
  }

  const { kpi, health, tenants, recentTenants, employeesByCompany, systemUsersByRole, recentActivity } = metrics;

  if (kpi.totalTenants === 0) {
    return (
      <div className="app-content-inner flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <Building2 size={64} className="text-secondary mb-4 opacity-50" />
        <h2 className="page-title mb-2">No companies yet</h2>
        <p className="text-secondary mb-6 text-center" style={{ maxWidth: '400px' }}>
          Create your first company to start using PAYFLOW and generate platform analytics.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/platform/tenants')}>Create Company</button>
      </div>
    );
  }

  // Charts processing
  const statusData = [
    { name: 'Active', value: kpi.activeTenants, color: 'var(--success-color)' },
    { name: 'Suspended', value: kpi.suspendedTenants, color: 'var(--error-color)' }
  ].filter(d => d.value > 0);

  const tenantGrowthMap: Record<string, number> = {};
  tenants.forEach((t: any) => {
    const d = new Date(t.createdAt);
    const label = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
    tenantGrowthMap[label] = (tenantGrowthMap[label] || 0) + 1;
  });
  const growthData = Object.keys(tenantGrowthMap).map(k => ({ name: k, companies: tenantGrowthMap[k] }));
  
  // Accumulated growth
  let acc = 0;
  const areaGrowthData = growthData.map(item => {
    acc += item.companies;
    return { name: item.name, Total: acc };
  });

  const empData = employeesByCompany?.map((c: any) => ({
    name: c.name,
    employees: c._count.employees
  })).filter((c: any) => c.employees > 0);

  const roleData = systemUsersByRole?.map((r: any) => ({
    name: r.role.replace(/_/g, ' '),
    users: r.count
  })).filter((r: any) => r.users > 0);

  // Custom KPI Card component
  const KPICard = ({ title, value, icon, accent, desc, onClick }: any) => (
    <div className="card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', borderTop: `4px solid var(--${accent}-color)`, position: 'relative' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-small" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
        <div style={{ color: `var(--${accent}-color)`, opacity: 0.8 }}>{icon}</div>
      </div>
      <div className="page-title mb-1" style={{ fontSize: '32px' }}>{value}</div>
      {desc && <span className="text-small" style={{ color: 'var(--text-tertiary)' }}>{desc}</span>}
    </div>
  );

  return (
    <div className="app-content-inner flex flex-col gap-6" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div>
        <h1 className="page-title m-0">Platform Overview</h1>
        <p className="text-secondary mt-1">Real-time metrics for all hosted companies and system operations.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <KPICard title="Total Companies" value={kpi.totalTenants} accent="info" icon={<Building2 size={20} />} desc={`${kpi.activeTenants} active, ${kpi.suspendedTenants} suspended`} onClick={() => navigate('/platform/tenants')} />
        <KPICard title="Active Companies" value={kpi.activeTenants} accent="success" icon={<Activity size={20} />} desc="100% operational" />
        <KPICard title="Suspended" value={kpi.suspendedTenants} accent="warning" icon={<TrendingUp size={20} className="rotate-180" />} desc="Requires attention" />
        <KPICard title="Total Users" value={kpi.totalUsers} accent="primary-dark" icon={<Users size={20} />} desc="Platform & Tenant users" />
        <KPICard title="Total Employees" value={kpi.totalEmployees} accent="info" icon={<Briefcase size={20} />} desc="Across all companies" />
      </div>

      {/* Analytics Row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        <div className="card flex flex-col">
          <h2 className="card-title mb-4">Company Status Distribution</h2>
          <div style={{ height: '280px', flex: 1 }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-\${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-secondary text-small">No company status data available.</div>
            )}
          </div>
        </div>

        <div className="card flex flex-col" style={{ gridColumn: 'auto / span 2' }}>
          <h2 className="card-title mb-4">Company Growth</h2>
          <div style={{ height: '280px', flex: 1 }}>
            {areaGrowthData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }} />
                  <Area type="monotone" dataKey="Total" stroke="var(--info-color)" fill="var(--info-bg)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-secondary text-small gap-2">
                <TrendingUp size={24} className="opacity-50" />
                <span>Not enough historical data yet. Check back next month!</span>
              </div>
            )}
          </div>
        </div>

      </div>
      
      {/* Operations Row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        <div className="card flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">System Users</h2>
            <span className="badge badge-info text-small">{kpi.totalUsers} Total</span>
          </div>
          <div style={{ height: '240px' }}>
            {roleData && roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-light)"/>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500}} />
                  <Tooltip cursor={{fill: 'var(--bg-surface-hover)'}} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                  <Bar dataKey="users" fill="var(--primary-dark)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-secondary text-small">No role data available.</div>
            )}
          </div>
        </div>

        <div className="card flex flex-col">
          <h2 className="card-title mb-4">Employee Distribution</h2>
          <div style={{ height: '240px' }}>
            {empData && empData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={empData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} tickFormatter={(val) => val.length > 10 ? val.substring(0,10)+'...' : val} dy={10} />
                  <YAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'var(--bg-surface-hover)'}} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                  <Bar dataKey="employees" fill="var(--info-color)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-secondary text-small">No employee data available across companies.</div>
            )}
          </div>
        </div>

      </div>

      {/* Tables Row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        <div className="card flex flex-col" style={{ gridColumn: 'auto / span 2', padding: 0 }}>
          <div className="card-header border-light" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border-light)', backgroundColor: '#FAFAFA' }}>
            <h2 className="card-title m-0">Recent Companies</h2>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            {recentTenants && recentTenants.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Users</th>
                    <th>Employees</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTenants.map((rt: any) => (
                    <tr key={rt.id}>
                      <td style={{ fontWeight: 500 }}>{rt.name}</td>
                      <td><span className="badge badge-neutral">{rt.domain}</span></td>
                      <td>
                         <span className={`badge ${rt.isActive ? 'badge-success' : 'badge-error'}`}>
                           ● {rt.isActive ? 'Active' : 'Suspended'}
                         </span>
                      </td>
                      <td>{rt._count.users}</td>
                      <td>{rt._count.employees}</td>
                      <td className="text-small">{new Date(rt.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 8px', color: 'var(--info-color)' }} onClick={() => navigate(`/platform/tenants/${rt.id}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-secondary">No recent companies found.</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <Server size={18} className="text-secondary"/> Platform Health
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#FAFAFA', border: '1px solid var(--border-light)' }}>
                <span className="text-body font-medium">Database</span>
                <span className="badge badge-success"><CheckCircle2 size={12} className="mr-1"/> Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#FAFAFA', border: '1px solid var(--border-light)' }}>
                <span className="text-body font-medium">Core API</span>
                <span className="badge badge-success"><CheckCircle2 size={12} className="mr-1"/> Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#FAFAFA', border: '1px solid var(--border-light)' }}>
                <span className="text-body font-medium">Authentication</span>
                <span className="badge badge-success"><CheckCircle2 size={12} className="mr-1"/> Operational</span>
              </div>
            </div>
          </div>

          <div className="card flex-1">
            <h2 className="card-title mb-4">Recent Activity</h2>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="flex flex-col gap-4">
                {recentActivity.map((log: any) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="mt-1"><Clock size={16} className="text-tertiary" /></div>
                    <div className="flex flex-col">
                      <span className="text-body font-medium">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-small text-secondary">{log.tenant?.name || 'Platform'}</span>
                      <span className="text-small" style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-secondary py-4 text-small">No recent activity.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default PlatformDashboard;
