import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { TaxConfiguration } from '../components/TaxConfiguration';

const MODULE_NAMES: Record<string, string> = {
  'payroll': 'Payroll Configuration',
  'attendance': 'Attendance Rules',
  'leave': 'Leave Policies',
  'tax': 'Tax & Statutory',
  'approval': 'Approval Workflows'
};

const PlatformTenantConfiguration = () => {
  const { tenantId, module } = useParams<{ tenantId: string, module: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const moduleKey = module || 'payroll';
  const moduleTitle = MODULE_NAMES[moduleKey] || 'Configuration';

  useEffect(() => {
    fetchData();
  }, [tenantId, moduleKey]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('payflow_token');
      
      // Fetch tenant context
      const tRes = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tData = await tRes.json();
      if (!tRes.ok) throw new Error(tData.error?.message || 'Failed to load company');
      setTenant(tData.data);

      // Fetch config
      const cRes = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}/configuration/${moduleKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cData = await cRes.json();
      if (!cRes.ok) throw new Error(cData.error?.message || 'Failed to load configuration');
      
      setConfig(cData.data || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}/configuration/${moduleKey}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Configuration saved successfully.');
        await fetchData(); // reload to get IDs
      } else {
        setError(data.error?.message || 'Failed to save configuration');
      }
    } catch (err: any) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
  }

  if (error && !tenant) {
    return <div className="card text-center" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2 className="section-title mb-4">Error</h2>
      <p className="text-danger mb-4">{error}</p>
      <button className="btn btn-secondary" onClick={() => navigate(`/platform/tenants/${tenantId}`)}>Back to Company</button>
    </div>;
  }

  const renderPayrollForm = () => (
    <div className="card">
      <h3 className="card-title mb-4 border-b border-light pb-2">Financial Year</h3>
      <div className="form-group" style={{ maxWidth: '400px' }}>
        <label className="form-label">Current Financial Year</label>
        <input 
          className="form-input" 
          value={config?.financialYear || ''} 
          onChange={e => setConfig({...config, financialYear: e.target.value})} 
          placeholder="e.g. 2026-2027" 
        />
        <span className="text-small text-secondary mt-1">This defines the core tax and payroll calculation window.</span>
      </div>
    </div>
  );

  const renderAttendanceForm = () => {
    const calendar = config?.calendars?.[0] || { 
      isMondayWorking: true, isTuesdayWorking: true, isWednesdayWorking: true, 
      isThursdayWorking: true, isFridayWorking: true, isSaturdayWorking: false, isSundayWorking: false 
    };
    
    const updateCal = (field: string, val: boolean) => {
      const updated = { ...calendar, [field]: val };
      setConfig({ ...config, calendars: [updated] });
    };

    return (
      <div className="card">
        <h3 className="card-title mb-4 border-b border-light pb-2">Default Work Week</h3>
        <div className="grid grid-cols-2 gap-4" style={{ maxWidth: '500px' }}>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
            const field = `is${day}Working`;
            return (
              <label key={day} className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={calendar[field] || false} 
                  onChange={e => updateCal(field, e.target.checked)} 
                  style={{ width: '16px', height: '16px' }}
                />
                <span className="text-body">{day}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLeaveForm = () => {
    const policies = config?.policies || [];
    
    const addPolicy = () => {
      setConfig({ 
        ...config, 
        policies: [...policies, { 
          name: '', type: 'CASUAL', daysPerYear: 0, canCarryForward: false, 
          maxCarryForward: 0, isEncashable: false, maxEncashment: 0, effectiveFrom: new Date().toISOString().split('T')[0] 
        }] 
      });
    };

    const updatePolicy = (idx: number, field: string, val: any) => {
      const updated = [...policies];
      updated[idx][field] = val;
      setConfig({ ...config, policies: updated });
    };

    const removePolicy = (idx: number) => {
      const updated = policies.filter((_: any, i: number) => i !== idx);
      setConfig({ ...config, policies: updated });
    };

    return (
      <div className="flex flex-col gap-4">
        {policies.length === 0 && (
          <div className="card text-center text-secondary py-8">
            <p>This configuration has not been set up yet.</p>
            <button type="button" className="btn btn-secondary mt-4" onClick={addPolicy}>Create Leave Policy</button>
          </div>
        )}
        
        {policies.map((policy: any, idx: number) => (
          <div key={idx} className="card relative">
            <button type="button" className="btn btn-ghost" style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--error-color)' }} onClick={() => removePolicy(idx)}>
              <Trash2 size={16} />
            </button>
            <h3 className="card-title mb-4 border-b border-light pb-2">Policy #{idx + 1}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Policy Name *</label>
                <input required className="form-input" value={policy.name || ''} onChange={e => updatePolicy(idx, 'name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={policy.type || 'CASUAL'} onChange={e => updatePolicy(idx, 'type', e.target.value)}>
                  <option value="CASUAL">Casual</option>
                  <option value="SICK">Sick</option>
                  <option value="EARNED">Earned</option>
                  <option value="MATERNITY">Maternity</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Days Per Year *</label>
                <input required type="number" className="form-input" value={policy.daysPerYear || 0} onChange={e => updatePolicy(idx, 'daysPerYear', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Effective From</label>
                <input type="date" className="form-input" value={policy.effectiveFrom ? policy.effectiveFrom.split('T')[0] : ''} onChange={e => updatePolicy(idx, 'effectiveFrom', e.target.value)} />
              </div>
              
              <div className="flex items-center gap-2 mb-4 mt-2">
                <input type="checkbox" checked={policy.canCarryForward || false} onChange={e => updatePolicy(idx, 'canCarryForward', e.target.checked)} style={{ width: '16px', height: '16px' }} />
                <label className="form-label mb-0">Allow Carry Forward</label>
              </div>
              {policy.canCarryForward && (
                <div className="form-group">
                  <label className="form-label">Max Carry Forward</label>
                  <input type="number" className="form-input" value={policy.maxCarryForward || 0} onChange={e => updatePolicy(idx, 'maxCarryForward', e.target.value)} />
                </div>
              )}
            </div>
          </div>
        ))}
        {policies.length > 0 && (
          <div><button type="button" className="btn btn-secondary" onClick={addPolicy}><Plus size={16}/> Add Another Policy</button></div>
        )}
      </div>
    );
  };



  const renderApprovalForm = () => (
    <div className="card text-center text-secondary py-8">
      <h3 className="section-title mb-2">Approval Workflows</h3>
      <p>Approval chains in PAYFLOW are currently derived dynamically from the Employee Manager hierarchy defined in the Organization structure.</p>
      <p className="mt-2 text-small">There are no additional tenant-level rules to configure at this time.</p>
    </div>
  );

  return (
    <div className="app-content-inner" style={{ paddingBottom: '40px' }}>
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button className="btn btn-ghost" onClick={() => navigate(`/platform/tenants/${tenantId}`)} style={{ paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back to Company
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <span className="text-small text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Companies / {tenant?.name} / Configuration
        </span>
        <h1 className="page-title">{moduleTitle}</h1>
      </div>

      {error && <div className="card mb-4" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', borderColor: 'var(--error-color)' }}>{error}</div>}
      {success && <div className="card mb-4" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-color)', borderColor: 'var(--success-color)' }}>{success}</div>}

      {moduleKey === 'tax' ? (
        <div className="flex flex-col gap-6">
          <TaxConfiguration tenantId={tenantId!} initialRules={config?.rules || []} onRefresh={fetchData} />
        </div>
      ) : (
        <form id="config-form" onSubmit={handleSave} className="flex flex-col gap-6">
          {moduleKey === 'payroll' && renderPayrollForm()}
          {moduleKey === 'attendance' && renderAttendanceForm()}
          {moduleKey === 'leave' && renderLeaveForm()}
          {moduleKey === 'approval' && renderApprovalForm()}

          {moduleKey !== 'approval' && (
            <div className="flex justify-end gap-3 pt-4 border-t border-light mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(`/platform/tenants/${tenantId}`)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default PlatformTenantConfiguration;
