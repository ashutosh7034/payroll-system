import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, User, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';

const ExceptionDashboard = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">Payroll Exceptions</h1>
          <p className="text-secondary">March 2026 • India Entity</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">Recalculate All</button>
          <Link to="/payroll/run" className="btn btn-primary">Back to Payroll</Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-small mb-1">Total Exceptions</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>7</div>
        </div>
        <div className="card p-4" style={{ borderColor: 'var(--error-color)', backgroundColor: 'var(--error-bg)' }}>
          <div className="text-small mb-1" style={{ color: 'var(--error-color)' }}>Blocking Errors</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--error-color)' }}>3</div>
        </div>
        <div className="card p-4" style={{ borderColor: 'var(--warning-color)', backgroundColor: 'var(--warning-bg)' }}>
          <div className="text-small mb-1" style={{ color: 'var(--warning-color)' }}>Warnings</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--warning-color)' }}>4</div>
        </div>
        <div className="card p-4">
          <div className="text-small mb-1">Resolved</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--success-color)' }}>12</div>
        </div>
      </div>

      <h2 className="section-title mb-4">Requires Attention</h2>
      
      <div className="flex-col gap-4">
        <div className="card" style={{ borderLeft: '4px solid var(--error-color)' }}>
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <ShieldAlert size={24} className="text-error mt-1" />
              <div>
                <div style={{ display: 'inline-flex', padding: '2px 6px', backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', fontSize: '11px', fontWeight: 600, borderRadius: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>Blocking</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Missing Bank Details</h3>
                <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
                  Bank account information is missing. Payment cannot be processed for this employee.
                </p>
                
                <div className="flex items-center gap-3 p-3 mb-4" style={{ backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px' }}>
                  <User size={16} className="text-secondary" />
                  <span style={{ fontWeight: 500 }}>EMP209 • Rohan Verma</span>
                  <span className="text-small border-l border-medium pl-3 ml-1">Engineering</span>
                </div>
                
                <div className="flex gap-3">
                  <button className="btn btn-primary" style={{ padding: '6px 12px' }}>Update Bank Details</button>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px' }}>Hold Payment</button>
                </div>
              </div>
            </div>
            <div className="text-small text-secondary">
              Owner: HR
            </div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <Banknote size={24} className="text-warning mt-1" />
              <div>
                <div style={{ display: 'inline-flex', padding: '2px 6px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)', fontSize: '11px', fontWeight: 600, borderRadius: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>Warning</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>High Salary Variance</h3>
                <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
                  Net pay is 15% higher than previous month. Threshold is 10%.
                </p>
                
                <div className="flex flex-col gap-2 p-3 mb-4" style={{ backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px' }}>
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-secondary" />
                    <span style={{ fontWeight: 500 }}>EMP102 • Rahul Sharma</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-small mt-2">
                    <div>Last Month: <strong>₹85,000</strong></div>
                    <div>Current: <strong>₹97,750</strong></div>
                    <div className="text-error">Variance: <strong>+15.0%</strong></div>
                  </div>
                  <div className="text-small mt-1 text-secondary">
                    Reason: Mid-month promotion applied retroactively.
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button className="btn btn-secondary" style={{ padding: '6px 12px' }}>Acknowledge & Ignore</button>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px' }}>View Calculation</button>
                </div>
              </div>
            </div>
            <div className="text-small text-secondary">
              Owner: Finance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExceptionDashboard;
