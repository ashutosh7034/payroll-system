import React from 'react';
import { ArrowLeft, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ExplainPay = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-6">
        <Link to="/payroll/result" className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-4 text-small font-medium" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Results
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="page-title mb-1">Rahul Sharma</h1>
            <p className="text-secondary">EMP102 • Senior Frontend Engineer • Calculation Trace</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-small text-secondary mb-1">Net Pay</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success-color)', lineHeight: 1 }}>₹48,900</div>
          </div>
        </div>
      </div>

      <div className="card mb-6" style={{ borderTop: '4px solid var(--primary-dark)' }}>
        <h2 className="card-title mb-4 flex items-center gap-2">
          Earnings
          <span className="badge badge-neutral ml-2">Gross: ₹55,000</span>
        </h2>
        
        <div className="flex-col gap-6">
          <div className="border-b border-light pb-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div className="flex justify-between items-start mb-3">
              <div style={{ fontWeight: 600, fontSize: '16px' }}>Basic Salary</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>₹30,000</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-small bg-surface-hover p-4 rounded-md" style={{ backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px' }}>
              <div>
                <span className="text-secondary block mb-1">Source:</span>
                <span className="font-medium">Salary Structure — Version 4</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Effective:</span>
                <span className="font-medium">01 April 2025</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Formula:</span>
                <span className="font-medium font-mono text-xs">FIXED_MONTHLY</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Attendance Adjustment:</span>
                <span className="font-medium">30 / 30 payable days (1.0x)</span>
              </div>
            </div>
          </div>

          <div className="pb-2">
            <div className="flex justify-between items-start mb-3">
              <div style={{ fontWeight: 600, fontSize: '16px' }}>House Rent Allowance (HRA)</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>₹15,000</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-small bg-surface-hover p-4 rounded-md" style={{ backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px' }}>
              <div>
                <span className="text-secondary block mb-1">Formula:</span>
                <span className="font-medium font-mono text-xs">BASIC * 0.5</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Calculation:</span>
                <span className="font-medium">₹30,000 * 0.5 = ₹15,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="card-title mb-4 flex items-center gap-2 text-error">
          Deductions
          <span className="badge badge-error ml-2 bg-error-bg text-error">Total: ₹6,100</span>
        </h2>
        
        <div className="flex-col gap-6">
          <div className="border-b border-light pb-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div className="flex justify-between items-start mb-3">
              <div style={{ fontWeight: 600, fontSize: '16px' }}>PF Employee Contribution</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>₹3,600</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-small bg-surface-hover p-4 rounded-md" style={{ backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px' }}>
              <div>
                <span className="text-secondary block mb-1">Rule:</span>
                <span className="font-medium">PF Statutory Rule v3</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Basis (PF Wage):</span>
                <span className="font-medium">₹30,000 (Basic)</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Rate:</span>
                <span className="font-medium">12.0%</span>
              </div>
              <div>
                <span className="text-secondary block mb-1">Calculation:</span>
                <span className="font-medium">MIN(₹30,000 * 0.12, No Cap) = ₹3,600</span>
              </div>
            </div>
          </div>

          <div className="pb-2">
            <div className="flex justify-between items-start mb-3">
              <div style={{ fontWeight: 600, fontSize: '16px' }}>Tax Deducted at Source (TDS)</div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>₹2,500</div>
            </div>
            
            <div className="text-small bg-surface-hover p-4 rounded-md" style={{ backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px' }}>
              <div className="flex justify-between items-center">
                <span>Calculated via Income Tax Engine based on Old Regime declaration.</span>
                <button className="btn-ghost text-primary text-small font-medium flex items-center gap-1" style={{ padding: 0 }}>
                  View Tax Computation <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-8">
        <button className="btn btn-secondary">Print Trace</button>
      </div>
    </div>
  );
};

export default ExplainPay;
