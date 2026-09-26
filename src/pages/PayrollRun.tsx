import React, { useState } from 'react';
import { ArrowRight, Calculator, CheckCircle2, ChevronRight, AlertTriangle, Play, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const PayrollRun = () => {
  const [currentStep, setCurrentStep] = useState(2); // 0: Prepare, 1: Inputs, 2: Calculate, 3: Validate, etc.
  
  const steps = [
    'Prepare', 'Inputs', 'Calculate', 'Validate', 'Review', 'Approve', 'Lock', 'Pay', 'Close'
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="mb-8 text-center">
        <h1 className="page-title mb-2">March 2026</h1>
        <p className="text-secondary" style={{ fontSize: '15px' }}>India Monthly Payroll</p>
      </div>

      <div className="card mb-8" style={{ padding: '32px' }}>
        <div className="flex justify-between items-center mb-8 relative">
          <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', backgroundColor: 'var(--border-light)', zIndex: 0, transform: 'translateY(-50%)' }}></div>
          {steps.map((step, idx) => (
            <div key={step} className="flex flex-col items-center gap-2" style={{ position: 'relative', zIndex: 1, backgroundColor: 'var(--bg-surface)', padding: '0 8px' }}>
              <div style={{ 
                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: idx < currentStep ? 'var(--success-color)' : idx === currentStep ? 'var(--primary-dark)' : 'var(--bg-surface-hover)',
                color: idx <= currentStep ? 'white' : 'var(--text-tertiary)',
                fontWeight: 600, fontSize: '13px', border: idx > currentStep ? '1px solid var(--border-medium)' : 'none'
              }}>
                {idx < currentStep ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <span style={{ fontSize: '12px', fontWeight: idx === currentStep ? 600 : 500, color: idx <= currentStep ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'var(--info-bg)', color: 'var(--info-color)', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
            STATUS: READY FOR CALCULATION
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Calculate Payroll
          </h2>
          <p className="text-secondary mb-8" style={{ maxWidth: '500px', margin: '0 auto 32px' }}>
            All inputs have been collected and verified. You are now ready to calculate payroll for 428 active employees in the India Entity.
          </p>

          <div className="grid grid-cols-3 gap-4 text-left mb-8" style={{ maxWidth: '600px', margin: '0 auto 32px' }}>
            <div className="p-4" style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div className="text-small mb-1">Employees</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>428</div>
            </div>
            <div className="p-4" style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div className="text-small mb-1">Input Completeness</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--success-color)' }}>100%</div>
            </div>
            <div className="p-4" style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div className="text-small mb-1">Unresolved Exceptions</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>0</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button className="btn btn-secondary">Review Inputs</button>
            <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => setCurrentStep(3)}>
              <Calculator size={18} />
              Run Calculation
            </button>
          </div>
        </div>
      </div>
      
      {currentStep === 3 && (
        <div className="card text-center" style={{ padding: '48px' }}>
           <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Payroll Calculated Successfully
          </h2>
          
          <div className="grid grid-cols-4 gap-4 text-left mb-8" style={{ maxWidth: '700px', margin: '0 auto 32px' }}>
            <div className="p-4" style={{ borderRight: '1px solid var(--border-light)' }}>
              <div className="text-small mb-1">Processed</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>428</div>
            </div>
            <div className="p-4" style={{ borderRight: '1px solid var(--border-light)' }}>
              <div className="text-small mb-1">Gross Payroll</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>₹42,50,000</div>
            </div>
            <div className="p-4" style={{ borderRight: '1px solid var(--border-light)' }}>
              <div className="text-small mb-1">Net Payroll</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>₹35,80,000</div>
            </div>
            <div className="p-4">
              <div className="text-small mb-1">Exceptions</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--warning-color)' }}>3 Warnings</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link to="/payroll/exceptions" className="btn btn-secondary">Review Exceptions</Link>
            <Link to="/payroll/result" className="btn btn-primary">View Results</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollRun;
