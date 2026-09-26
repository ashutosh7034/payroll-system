import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Check, X, FileText, Search, Download } from 'lucide-react';

const PayrollInputCenter: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('variable');
  const [inputs, setInputs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInputs = async () => {
    setLoading(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/payroll-inputs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInputs(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInputs();
  }, [token]);

  const tabs = [
    { id: 'variable', label: 'Variable Pay & Bonus' },
    { id: 'arrears', label: 'Arrears & Adjustments' },
    { id: 'reimbursements', label: 'Reimbursements' },
    { id: 'loans', label: 'Loans & Advances' },
    { id: 'overtime', label: 'Overtime' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">Payroll Input Center</h1>
          <p className="text-secondary text-small">Manage all variable inputs, deductions, and adjustments for the current payroll cycle.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><Download size={16} /> Export Template</button>
          <button className="btn btn-primary"><Plus size={16} /> Add Input</button>
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
        <div className="flex justify-between mb-4">
          <div className="relative" style={{ width: '300px' }}>
            <Search className="absolute left-3 top-2.5 text-secondary" size={16} />
            <input type="text" className="form-input w-full pl-9" placeholder="Search employees..." />
          </div>
          <div className="flex gap-2">
            <select className="form-input">
              <option>All Statuses</option>
              <option>Approved</option>
              <option>Pending</option>
            </select>
            <select className="form-input">
              <option>Oct 2026</option>
              <option>Sep 2026</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inputs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-secondary">No inputs found for this category</td>
                  </tr>
                ) : (
                  inputs.map((input, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="font-medium text-dark">{input.employee?.firstName} {input.employee?.lastName}</div>
                        <div className="text-small text-secondary">{input.employee?.employeeId}</div>
                      </td>
                      <td>{input.inputType}</td>
                      <td className="font-medium">₹{input.amount?.toLocaleString()}</td>
                      <td>{input.payrollPeriodMonth}/{input.payrollPeriodYear}</td>
                      <td><span className={`badge badge-${input.status === 'APPROVED' ? 'success' : 'warning'}`}>{input.status}</span></td>
                      <td className="text-secondary text-small">{input.remarks || '-'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-ghost p-1 text-primary"><FileText size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollInputCenter;
