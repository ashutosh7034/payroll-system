const fs = require('fs');

// 1. MyDashboard.tsx
let dashboardContent = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
let myDashboardCode = `import React, { useState, useEffect } from 'react';
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
        const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + \`/dashboard?isEmployeeOnly=true\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
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
        <KpiCard title="Latest Net Pay" value={\`₹\${metrics.latestNetPay.toLocaleString()}\`} icon={<Wallet size={16} />} />
        <KpiCard title="Leave Balance" value={\`\${metrics.leaveBalance} Days\`} icon={<CalendarDays size={16} />} />
        <KpiCard title="Attendance" value={\`\${metrics.attendancePercent}%\`} icon={<Clock size={16} />} />
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
`;
fs.writeFileSync('src/pages/MyDashboard.tsx', myDashboardCode);

// 2. MyAttendance.tsx
let myAttendanceCode = `import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Loader2 } from 'lucide-react';

const MyAttendance = () => {
  const { token, user } = useAuth();
  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.employeeId) fetchMyAttendance();
    else setLoading(false);
  }, [user]);

  const fetchMyAttendance = async () => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + \`/attendance/records/\${user?.employeeId || ""}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyRecords(data.data || data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (status: string) => {
    if (!user?.employeeId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + \`/attendance/records/\${user.employeeId}\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          date: today,
          status,
          punchIn: status === 'PRESENT' ? new Date().toISOString() : null
        })
      });
      if (res.ok) {
        alert('Attendance marked successfully!');
        fetchMyAttendance();
      } else {
        alert('Failed to mark attendance');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user?.employeeId) {
    return <div className="p-8 text-center text-secondary">You do not have a linked employee record.</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">My Attendance</h1>
          <p className="text-secondary">View your daily attendance and shifts</p>
        </div>
        <button className="btn btn-primary" onClick={() => markAttendance('PRESENT')}>
          <Clock size={16} /> Web Check-in
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader2 className="animate-spin text-secondary mx-auto" size={24} />
                  </td>
                </tr>
              ) : myRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-secondary py-8">No attendance records found</td>
                </tr>
              ) : (
                myRecords.map((rec, i) => (
                  <tr key={i}>
                    <td className="font-medium">{new Date(rec.date).toLocaleDateString()}</td>
                    <td>General Shift (09:00 - 18:00)</td>
                    <td>
                      <span className={\`badge \${rec.status === 'PRESENT' ? 'badge-success' : rec.status === 'ABSENT' ? 'badge-danger' : 'badge-neutral'}\`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>{rec.punchIn ? new Date(rec.punchIn).toLocaleTimeString() : '-'}</td>
                    <td>{rec.punchOut ? new Date(rec.punchOut).toLocaleTimeString() : '-'}</td>
                    <td>{rec.totalHours ? rec.totalHours.toFixed(1) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default MyAttendance;
`;
fs.writeFileSync('src/pages/MyAttendance.tsx', myAttendanceCode);

// 3. MyLeave.tsx
let myLeaveCode = `import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Plus } from 'lucide-react';

const MyLeave = () => {
  const { token, user } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({ leavePolicyId: '', startDate: '', endDate: '', days: 1, reason: '' });

  useEffect(() => {
    if (user?.employeeId) fetchEmployeeData();
    else setLoading(false);
  }, [user, token]);

  const fetchEmployeeData = async () => {
    try {
      const year = new Date().getFullYear();
      const [balRes, reqRes, polRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + \`/leave/balance/\${user?.employeeId || ""}/\${year}\`, { headers: { 'Authorization': \`Bearer \${token}\` } }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + \`/leave/requests/\${user?.employeeId || ""}\`, { headers: { 'Authorization': \`Bearer \${token}\` } }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/leave/policies', { headers: { 'Authorization': \`Bearer \${token}\` } })
      ]);
      
      if (balRes.ok) {
        const d = await balRes.json();
        setBalances(d.data || d);
      }
      if (reqRes.ok) {
        const d = await reqRes.json();
        setRequests(d.data || d);
      }
      if (polRes.ok) {
        const d = await polRes.json();
        setPolicies(d.data || d);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.employeeId) return;
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + \`/leave/request/\${user.employeeId}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to apply leave');
      
      alert('Leave applied successfully');
      setShowApplyModal(false);
      fetchEmployeeData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user?.employeeId) {
    return <div className="p-8 text-center text-secondary">You do not have a linked employee record.</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">My Leave</h1>
          <p className="text-secondary">Manage your leave balances and requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {error && <div className="p-3 mb-4 text-sm bg-[var(--error-bg)] text-[var(--error-color)] rounded border border-[var(--error-color)]">{error}</div>}

      <h2 className="text-lg font-bold text-primary mb-4">Leave Balances</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {loading ? (
           <Loader2 className="animate-spin text-secondary mx-auto" />
        ) : balances.length === 0 ? (
          <p className="text-secondary">No active leave balances.</p>
        ) : (
          balances.map((b, i) => (
            <div key={i} className="card p-4">
              <h3 className="font-semibold text-primary mb-2">{b.policy?.name || 'Leave'}</h3>
              <div className="text-3xl font-bold text-primary">{b.balance}</div>
              <div className="text-small text-secondary mt-1">Total: {b.balance + b.consumed} | Used: {b.consumed}</div>
            </div>
          ))
        )}
      </div>

      <h2 className="text-lg font-bold text-primary mb-4">Leave History</h2>
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-secondary py-4">No leave requests found.</td></tr>
            ) : (
              requests.map((r, i) => (
                <tr key={i}>
                  <td>{policies.find(p => p.id === r.leavePolicyId)?.name || 'Leave'}</td>
                  <td>{new Date(r.startDate).toLocaleDateString()}</td>
                  <td>{new Date(r.endDate).toLocaleDateString()}</td>
                  <td>{r.days}</td>
                  <td>
                    <span className={\`badge \${r.status === 'APPROVED' ? 'badge-success' : r.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}\`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title">Apply for Leave</h3>
              <button className="btn-ghost" onClick={() => setShowApplyModal(false)}>&times;</button>
            </div>
            <form onSubmit={applyLeave}>
              <div className="modal-body py-4">
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-input" required value={formData.leavePolicyId} onChange={e => setFormData({...formData, leavePolicyId: e.target.value})}>
                    <option value="">Select leave type</option>
                    {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" required className="form-input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" required className="form-input" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Days</label>
                  <input type="number" required min="0.5" step="0.5" className="form-input" value={formData.days} onChange={e => setFormData({...formData, days: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea className="form-input" rows={3} required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer flex justify-end">
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MyLeave;
`;
fs.writeFileSync('src/pages/MyLeave.tsx', myLeaveCode);

// Rename Payslips.tsx to MyPayslips.tsx
fs.renameSync('src/pages/Payslips.tsx', 'src/pages/MyPayslips.tsx');

// Modify Attendance.tsx to remove isEmployeeOnly logic
let attAdminCode = fs.readFileSync('src/pages/Attendance.tsx', 'utf8');
attAdminCode = attAdminCode.replace(/if\s*\(isEmployeeOnly\s*&&\s*user\s*&&\s*user\.employeeId\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);\s*\}/g, '');
attAdminCode = attAdminCode.replace(/if\s*\(isEmployeeOnly\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);\s*\}/g, '');
attAdminCode = attAdminCode.replace(/const isEmployeeOnly.*?;/g, '');
attAdminCode = attAdminCode.replace(/if\s*\(isEmployeeOnly\).*?\{[\s\S]*?\}/g, 'fetchEmployees();'); // the useEffect
attAdminCode = attAdminCode.replace(/if\s*\(isEmployeeOnly\)\s*fetchMyAttendance\(\);\s*else\s*fetchEmployees\(\);/g, 'fetchEmployees();');
attAdminCode = attAdminCode.replace(/const fetchMyAttendance[\s\S]*?fetchEmployees/g, 'const fetchEmployees');
fs.writeFileSync('src/pages/Attendance.tsx', attAdminCode);

// Modify Leave.tsx to remove isEmployeeOnly logic
let leaveAdminCode = fs.readFileSync('src/pages/Leave.tsx', 'utf8');
leaveAdminCode = leaveAdminCode.replace(/if\s*\(isEmployeeOnly\s*&&\s*user\s*&&\s*user\.employeeId\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);\s*\}/g, '');
leaveAdminCode = leaveAdminCode.replace(/if\s*\(isEmployeeOnly\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);\s*\}/g, '');
leaveAdminCode = leaveAdminCode.replace(/const isEmployeeOnly.*?;/g, '');
leaveAdminCode = leaveAdminCode.replace(/if\s*\(isEmployeeOnly\s*&&\s*user\s*&&\s*user\.employeeId\)\s*\{[\s\S]*?\}\s*else\s*\{/g, '{'); // the useEffect
leaveAdminCode = leaveAdminCode.replace(/const fetchEmployeeData[\s\S]*?const fetchAdminData/g, 'const fetchAdminData');
fs.writeFileSync('src/pages/Leave.tsx', leaveAdminCode);

// Modify App.tsx routes
let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
appTsx = appTsx.replace("import Payslips from './pages/Payslips';", 
  "import MyPayslips from './pages/MyPayslips';\nimport MyDashboard from './pages/MyDashboard';\nimport MyAttendance from './pages/MyAttendance';\nimport MyLeave from './pages/MyLeave';");
appTsx = appTsx.replace("<Route path=\"/payslips\" element={<Payslips />} />",
  "<Route path=\"/my-payslips\" element={<MyPayslips />} />\n<Route path=\"/my-dashboard\" element={<MyDashboard />} />\n<Route path=\"/my-attendance\" element={<MyAttendance />} />\n<Route path=\"/my-leave\" element={<MyLeave />} />");
fs.writeFileSync('src/App.tsx', appTsx);

console.log('done');
