import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TaxRule {
  id: string;
  tenantId: string;
  statutoryType: string;
  effectiveFrom: string;
  employeeRate: number;
  employerRate: number;
  wageCeiling: number;
  wageThreshold: number;
  isActive: boolean;
}

export const TaxConfiguration = ({ tenantId, initialRules, onRefresh }: { tenantId: string, initialRules: TaxRule[], onRefresh: () => void }) => {
  const [rules, setRules] = useState<TaxRule[]>(initialRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<TaxRule> | null>(null);
  const [deletingRule, setDeletingRule] = useState<TaxRule | null>(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  const openCreate = () => {
    setError('');
    setSuccess('');
    setEditingRule({
      statutoryType: 'PF',
      employeeRate: 0,
      employerRate: 0,
      wageCeiling: 0,
      wageThreshold: 0,
      isActive: true,
      effectiveFrom: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEdit = (rule: TaxRule) => {
    setError('');
    setSuccess('');
    setEditingRule({
      ...rule,
      effectiveFrom: rule.effectiveFrom.split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openDelete = (rule: TaxRule) => {
    setError('');
    setSuccess('');
    setDeletingRule(rule);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingRule(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!editingRule?.statutoryType || !editingRule?.effectiveFrom) {
      setError('Statutory Type and Effective From are required.');
      return;
    }

    if (
      (editingRule.employeeRate && editingRule.employeeRate < 0) ||
      (editingRule.employerRate && editingRule.employerRate < 0) ||
      (editingRule.wageCeiling && editingRule.wageCeiling < 0) ||
      (editingRule.wageThreshold && editingRule.wageThreshold < 0)
    ) {
      setError('Rates and limits cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const isUpdate = !!editingRule.id;
      const url = isUpdate 
        ? `http://localhost:4000/api/platform/tenants/${tenantId}/configuration/tax/${editingRule.id}`
        : `http://localhost:4000/api/platform/tenants/${tenantId}/configuration/tax`;
      
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingRule)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to save rule.');
      
      setSuccess(`Statutory rule ${isUpdate ? 'updated' : 'created'} successfully.`);
      closeModal();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}/configuration/tax/${deletingRule.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to delete rule.');
      
      setSuccess('Statutory rule deleted successfully.');
      closeDeleteModal();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
      setIsDeleteModalOpen(false); // Close delete modal to show error on main screen if wanted, or leave it. We will close it and show error.
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (rule: TaxRule) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}/configuration/tax/${rule.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !rule.isActive })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update status.');
      
      setSuccess(`Statutory rule ${rule.isActive ? 'deactivated' : 'activated'} successfully.`);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title m-0">Statutory Rules</h2>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Statutory Rule
        </button>
      </div>

      {error && (
        <div className="card flex items-center gap-3" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', borderColor: 'var(--error-color)', padding: '12px 16px' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {success && (
        <div className="card flex items-center gap-3" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-color)', borderColor: 'var(--success-color)', padding: '12px 16px' }}>
          <CheckCircle2 size={20} /> {success}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 rounded-full bg-surface-active flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-tertiary" />
          </div>
          <h3 className="section-title mb-2">No statutory rules configured</h3>
          <p className="text-secondary mb-4 text-center" style={{ maxWidth: '400px' }}>
            Add statutory rules to configure employee and employer statutory deductions.
          </p>
          <button type="button" className="btn btn-secondary" onClick={openCreate}>
            <Plus size={16} /> Add Statutory Rule
          </button>
        </div>
      ) : (
        rules.map((rule) => (
          <div key={rule.id} className="card relative flex flex-col sm:flex-row justify-between gap-6" style={{ borderLeft: `4px solid ${rule.isActive ? 'var(--success-color)' : 'var(--border-medium)'}` }}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 border-b border-light pb-3">
                <h3 className="card-title m-0 text-lg">{rule.statutoryType === 'PF' ? 'Provident Fund (PF)' : rule.statutoryType}</h3>
                <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-neutral'}`}>
                  ● {rule.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-small text-secondary">Effective From</span>
                  <span className="text-body font-medium">{new Date(rule.effectiveFrom).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-small text-secondary">Employee Rate</span>
                  <span className="text-body font-medium">{rule.employeeRate}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-small text-secondary">Employer Rate</span>
                  <span className="text-body font-medium">{rule.employerRate}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-small text-secondary">Wage Ceiling</span>
                  <span className="text-body font-medium">₹{rule.wageCeiling.toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-small text-secondary">Wage Threshold</span>
                  <span className="text-body font-medium">₹{rule.wageThreshold.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-center justify-center sm:justify-start gap-2 border-t sm:border-t-0 sm:border-l border-light pt-4 sm:pt-0 sm:pl-6 min-w-[140px]">
              <button type="button" className="btn btn-secondary w-full justify-start" onClick={() => openEdit(rule)}>
                <Edit2 size={14} /> Edit
              </button>
              <button type="button" className="btn btn-secondary w-full justify-start" onClick={() => handleDeactivate(rule)}>
                <Power size={14} /> {rule.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button type="button" className="btn btn-danger w-full justify-start" onClick={() => openDelete(rule)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && editingRule && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="section-title m-0">{editingRule.id ? 'Edit Statutory Rule' : 'Create Statutory Rule'}</h2>
              <button type="button" className="btn btn-ghost" onClick={closeModal} style={{ padding: '4px' }}>✕</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body grid grid-cols-2 gap-4">
                
                <div className="form-group col-span-2 md:col-span-1">
                  <label className="form-label">Statutory Type *</label>
                  <select 
                    className="form-select" 
                    value={editingRule.statutoryType || 'PF'} 
                    onChange={e => setEditingRule({...editingRule, statutoryType: e.target.value})}
                    required
                  >
                    <option value="PF">Provident Fund (PF)</option>
                    <option value="ESI">ESI</option>
                    <option value="PT">Professional Tax (PT)</option>
                    <option value="LWF">LWF</option>
                  </select>
                </div>

                <div className="form-group col-span-2 md:col-span-1">
                  <label className="form-label">Effective From *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editingRule.effectiveFrom || ''} 
                    onChange={e => setEditingRule({...editingRule, effectiveFrom: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group col-span-2 md:col-span-1">
                  <label className="form-label">Employee Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="form-input" 
                    value={editingRule.employeeRate === undefined ? '' : editingRule.employeeRate} 
                    onChange={e => setEditingRule({...editingRule, employeeRate: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group col-span-2 md:col-span-1">
                  <label className="form-label">Employer Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="form-input" 
                    value={editingRule.employerRate === undefined ? '' : editingRule.employerRate} 
                    onChange={e => setEditingRule({...editingRule, employerRate: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group col-span-2 md:col-span-1">
                  <label className="form-label">Wage Ceiling Limit (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    value={editingRule.wageCeiling === undefined ? '' : editingRule.wageCeiling} 
                    onChange={e => setEditingRule({...editingRule, wageCeiling: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group col-span-2 md:col-span-1">
                  <label className="form-label">Wage Threshold Minimum (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    value={editingRule.wageThreshold === undefined ? '' : editingRule.wageThreshold} 
                    onChange={e => setEditingRule({...editingRule, wageThreshold: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group col-span-2 flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    checked={editingRule.isActive !== false} 
                    onChange={e => setEditingRule({...editingRule, isActive: e.target.checked})} 
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label className="form-label mb-0" style={{ cursor: 'pointer' }}>Set as Active immediately</label>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingRule.id ? 'Save Changes' : 'Create Rule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingRule && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="section-title m-0">Delete Statutory Rule?</h2>
              <button type="button" className="btn btn-ghost" onClick={closeDeleteModal} disabled={saving} style={{ padding: '4px' }}>✕</button>
            </div>
            
            <div className="modal-body text-body">
              <p className="mb-4">Are you sure you want to delete the following rule?</p>
              
              <div className="card bg-surface-active p-4 mb-4 border-light flex flex-col gap-2">
                <div className="font-bold">{deletingRule.statutoryType === 'PF' ? 'Provident Fund (PF)' : deletingRule.statutoryType}</div>
                <div className="text-small text-secondary">Effective from: {new Date(deletingRule.effectiveFrom).toLocaleDateString()}</div>
              </div>
              
              <p className="text-small" style={{ color: 'var(--error-color)' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer bg-surface-active">
              <button type="button" className="btn btn-secondary" onClick={closeDeleteModal} disabled={saving}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
