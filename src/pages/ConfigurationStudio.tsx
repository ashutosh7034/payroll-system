import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ConfigurationStudio = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const modules = [
    { title: 'Company & Legal', desc: 'Manage company profile and legal entities', action: () => setActiveModal('company') },
    { title: 'Organization', desc: 'Departments, Locations, and Cost Centers', action: () => navigate('/organization') },
    { title: 'Payroll Calendar', desc: 'Define payroll cycles and cut-off dates', action: () => setActiveModal('calendar') },
    { title: 'Working Policy', desc: 'Shifts, weekends, and grace periods', action: () => setActiveModal('policy') },
    { title: 'Attendance & Leave', desc: 'Leave policies and attendance tracking', action: () => navigate('/leave') },
    { title: 'Salary & Variable Pay', desc: 'Salary components, CTC formulas', action: () => navigate('/compensation/structure') },
    { title: 'Tax & Statutory', desc: 'PF, ESI, PT, and Tax regimes', action: () => setActiveModal('tax') },
    { title: 'Approval Workflows', desc: 'Custom approval chains for payroll', action: () => setActiveModal('workflows') },
    { title: 'Payment & Accounting', desc: 'Bank integrations and GL mapping', action: () => setActiveModal('accounting') }
  ];

  return (
    <div className="card">
      <h1 className="card-title">Configuration Studio</h1>
      <p className="text-secondary mb-6">Manage all tenant-specific configurations here.</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {modules.map((mod, i) => (
          <div key={i} onClick={mod.action} style={{ padding: '20px', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
            <h3 className="mb-2 text-primary flex items-center justify-between" style={{ fontWeight: 600 }}>
              {mod.title}
              {!mod.action.toString().includes('navigate') && <span className="text-[10px] bg-[var(--bg-surface-active)] text-secondary px-2 py-0.5 rounded">Setup</span>}
            </h3>
            <p className="text-secondary text-small">{mod.desc}</p>
          </div>
        ))}
      </div>

      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header border-b pb-4 mb-4">
              <h3 className="card-title m-0">Configure {activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}</h3>
              <button className="btn-ghost" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className="modal-body py-8 text-center text-secondary border-2 border-dashed border-[var(--border-light)] rounded bg-slate-50">
              <p>Configuration panel for <strong>{activeModal}</strong> is being initialized.</p>
              <p className="text-small mt-2">All settings will be safely scoped to your tenant.</p>
            </div>
            <div className="modal-footer mt-4 pt-4 border-t flex justify-end">
              <button className="btn btn-primary" onClick={() => setActiveModal(null)}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationStudio;
