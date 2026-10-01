import React, { useEffect, useState } from 'react';
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
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/me/leave/balance/${year}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/me/leave`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/leave/policies', { headers: { 'Authorization': `Bearer ${token}` } })
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
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/me/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
                    <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : r.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
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
