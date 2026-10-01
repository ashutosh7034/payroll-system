import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CalendarOff, Loader2, Plus, Check, X } from 'lucide-react';
import { checkPermission } from '../utils/permissions';

const Leave = () => {
  const { token, user } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canManage = checkPermission(user?.roles || [], 'leave.manage');
  const canApprove = checkPermission(user?.roles || [], 'leave.approve') || user?.roles?.includes('MANAGER') || user?.roles?.includes('HR');
  

    
  useEffect(() => { fetchAdminData(); }, [user, token]);

  const fetchAdminData = async () => {
    try {
      const [polRes, allReqRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/leave/policies', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/leave/requests/all', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (polRes.ok) {
        const d = await polRes.json();
        setPolicies(d.data || d);
      }
      if (allReqRes.ok) {
        const d = await allReqRes.json();
        setAllRequests(d.data || d);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  

  const reviewLeave = async (requestId: string, status: string, comments: string) => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/leave/review/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, comments })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to review leave');
      
      alert(`Leave ${status.toLowerCase()} successfully`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  

  return (
    <div>
      <h1 className="page-title mb-6">Leave Management</h1>
      {error && <div className="text-danger mb-4">Error: {error}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="card-title mb-4">Pending Approvals</h2>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-secondary" /></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allRequests.filter(r => r.status === 'PENDING').map((r: any) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.employee?.firstName} {r.employee?.lastName}</td>
                      <td>{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                      <td>{r.days}</td>
                      <td>{policies.find(p => p.id === r.leavePolicyId)?.name}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => reviewLeave(r.id, 'APPROVED', 'Approved by manager')} className="btn btn-primary" style={{ padding: '4px 8px', minHeight: '30px' }}><Check size={14}/></button>
                          <button onClick={() => reviewLeave(r.id, 'REJECTED', 'Rejected')} className="btn btn-secondary text-danger" style={{ padding: '4px 8px', minHeight: '30px' }}><X size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allRequests.filter(r => r.status === 'PENDING').length === 0 && (
                    <tr><td colSpan={5} className="text-center text-secondary py-4">No pending requests.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h2 className="card-title flex items-center gap-2 mb-4"><CalendarOff size={18}/> Leave Policies</h2>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-secondary" /></div>
            ) : (
              <div className="space-y-3">
                {policies.map((p: any) => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-light rounded">
                    <div className="font-medium text-primary">{p.name}</div>
                    <div className="text-small text-secondary flex justify-between mt-1">
                      <span>{p.type}</span>
                      <span>{p.daysAllowed} days/yr</span>
                    </div>
                  </div>
                ))}
                {policies.length === 0 && <p className="text-secondary text-small">No policies configured.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Leave;
