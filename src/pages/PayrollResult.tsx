import React from 'react';
import { Search, Filter, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const PayrollResult = () => {
  const results = [
    { id: 'EMP102', name: 'Rahul Sharma', basic: '30,000', hra: '15,000', allow: '10,000', gross: '55,000', pf: '3,600', tax: '2,500', net: '48,900', status: 'Calculated' },
    { id: 'EMP103', name: 'Priya Patel', basic: '45,000', hra: '22,500', allow: '12,000', gross: '79,500', pf: '3,600', tax: '6,200', net: '69,700', status: 'Calculated' },
    { id: 'EMP104', name: 'Amit Singh', basic: '25,000', hra: '12,500', allow: '8,000', gross: '45,500', pf: '3,000', tax: '1,200', net: '41,300', status: 'Calculated' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">Payroll Results</h1>
          <p className="text-secondary">March 2026 • India Entity</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            <Download size={16} /> Export Register
          </button>
          <button className="btn btn-primary">Submit for Approval</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-small mb-1">Total Gross</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>₹42,50,000</div>
        </div>
        <div className="card p-4">
          <div className="text-small mb-1">Total Deductions</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>₹6,70,000</div>
        </div>
        <div className="card p-4">
          <div className="text-small mb-1">Total Net Pay</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--success-color)' }}>₹35,80,000</div>
        </div>
        <div className="card p-4">
          <div className="text-small mb-1">Employer Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>₹45,20,000</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="flex justify-between items-center" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex gap-3">
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                placeholder="Search employees..." 
                className="form-input" 
                style={{ paddingLeft: '36px', height: '36px' }}
              />
            </div>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="text-right">Basic</th>
                <th className="text-right">HRA</th>
                <th className="text-right">Allowances</th>
                <th className="text-right" style={{ backgroundColor: '#FAFAFA' }}>Gross</th>
                <th className="text-right">PF</th>
                <th className="text-right">Tax (TDS)</th>
                <th className="text-right" style={{ backgroundColor: '#F8FAF9' }}>Net Pay</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.name}</div>
                    <div className="text-small text-secondary">{r.id}</div>
                  </td>
                  <td className="text-right">₹{r.basic}</td>
                  <td className="text-right">₹{r.hra}</td>
                  <td className="text-right">₹{r.allow}</td>
                  <td className="text-right" style={{ fontWeight: 600 }}>₹{r.gross}</td>
                  <td className="text-right">₹{r.pf}</td>
                  <td className="text-right">₹{r.tax}</td>
                  <td className="text-right" style={{ fontWeight: 600, color: 'var(--success-color)' }}>₹{r.net}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Link to="/payroll/explain" className="btn-ghost text-small" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-dark)', fontWeight: 500 }}>
                      <FileText size={14} /> Explain
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollResult;
