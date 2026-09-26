import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Play, Lock, CheckCircle, XCircle, AlertCircle, Eye, Download, Users, FileText, Calculator } from 'lucide-react';

const PayrollControlTower: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('runs');
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  
  const fetchRuns = async () => {
    setLoading(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/payroll/runs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRuns(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [token]);

  const handleCreateRun = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
      });
      if (res.ok) fetchRuns();
      else alert((await res.json()).error.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalculate = async (id: string) => {
    try {
      setLoading(true);
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `/payroll/runs/${id}/calculate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchRuns();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'runs', label: 'Payroll Runs & Processing' },
    { id: 'preview', label: 'Payroll Preview' },
    { id: 'exceptions', label: 'Exceptions' },
    { id: 'history', label: 'Payroll History' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">Payroll Control Tower</h1>
          <p className="text-secondary text-small">End-to-end payroll orchestration, calculation, and finalization.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={handleCreateRun}><Play size={16} /> Init Payroll Run</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card stat-card" style={{ padding: '16px' }}>
          <div className="text-small text-secondary mb-1">Active Run Status</div>
          <div className="text-xl font-bold">{runs[0]?.status || 'NO ACTIVE RUN'}</div>
        </div>
        <div className="card stat-card" style={{ padding: '16px' }}>
          <div className="text-small text-secondary mb-1">Calculated Employees</div>
          <div className="text-xl font-bold">{runs[0]?.employeeCount || 0}</div>
        </div>
        <div className="card stat-card" style={{ padding: '16px' }}>
          <div className="text-small text-secondary mb-1">Total Net Payable</div>
          <div className="text-xl font-bold text-success">₹{(runs[0]?.totalNet || 0).toLocaleString()}</div>
        </div>
        <div className="card stat-card" style={{ padding: '16px' }}>
          <div className="text-small text-secondary mb-1">Blocking Exceptions</div>
          <div className="text-xl font-bold text-danger">{runs[0]?.exceptionCount || 0}</div>
        </div>
      </div>

      <div className="tabs mb-6">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8">Processing...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Employees</th>
                  <th>Gross Payroll</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{run.runPeriodMonth}/{run.runPeriodYear}</td>
                    <td><span className={`badge badge-${run.status === 'DRAFT' ? 'warning' : (run.status === 'FINALIZED' ? 'success' : 'primary')}`}>{run.status}</span></td>
                    <td>{run.employeeCount} ({run.successCount} OK, {run.failedCount} ERR)</td>
                    <td>₹{run.totalGross.toLocaleString()}</td>
                    <td>₹{run.totalDeductions.toLocaleString()}</td>
                    <td className="font-medium">₹{run.totalNet.toLocaleString()}</td>
                    <td>
                      <div className="flex gap-2">
                        {['DRAFT', 'VALIDATION_FAILED', 'CALCULATED'].includes(run.status) && (
                          <button className="btn-ghost p-1 text-primary" onClick={() => handleCalculate(run.id)} title="Calculate"><Calculator size={16}/></button>
                        )}
                        <button className="btn-ghost p-1 text-secondary" title="View Preview"><Eye size={16}/></button>
                        {run.status === 'APPROVED' && (
                          <button className="btn-ghost p-1 text-warning" title="Lock Run"><Lock size={16}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-secondary">No payroll runs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default PayrollControlTower;
