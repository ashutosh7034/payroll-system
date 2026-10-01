import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, X, Users, Key, AlertCircle, Eye, EyeOff } from 'lucide-react';

const PlatformTenants = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [company, setCompany] = useState({ name: '', code: '' });
  const [primaryAdmin, setPrimaryAdmin] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [secondaryAdmin, setSecondaryAdmin] = useState({ enabled: false, firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/tenants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (primaryAdmin.password !== primaryAdmin.confirmPassword) {
      return "Primary Super Admin passwords do not match.";
    }
    if (secondaryAdmin.enabled) {
      if (secondaryAdmin.password !== secondaryAdmin.confirmPassword) {
        return "Additional Super Admin passwords do not match.";
      }
      if (primaryAdmin.email.toLowerCase() === secondaryAdmin.email.toLowerCase()) {
        return "Primary and Additional Super Admins cannot have the same email address.";
      }
    }
    return null;
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/tenants', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ company, primaryAdmin, secondaryAdmin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        fetchTenants();
        resetForm();
      } else {
        setErrorMsg(data.error?.message || 'Failed to create company');
      }
    } catch (error) {
      setErrorMsg('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompany({ name: '', code: '' });
    setPrimaryAdmin({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    setSecondaryAdmin({ enabled: false, firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    setErrorMsg('');
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h1 className="card-title m-0">Companies / Tenants</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Onboard Company</button>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '85vh', width: '90%' }}>
            <div className="modal-header">
              <div>
                <h2 className="section-title m-0">Create New Company</h2>
                <p className="text-secondary mt-1" style={{ fontSize: '13px' }}>Set up a new company and administrator access.</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
              <div className="modal-body" style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {errorMsg && (
                  <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                    <AlertCircle size={16} /> {errorMsg}
                  </div>
                )}

                {/* COMPANY INFO SECTION */}
                <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                   <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Building2 size={16} style={{ color: 'var(--primary-dark)' }}/> Company Information
                   </h3>
                   <div className="grid grid-cols-2" style={{ gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                     <div className="form-group" style={{ marginBottom: 0 }}>
                       <label className="form-label">Company Name *</label>
                       <input required className="form-input" placeholder="e.g. Acme Corp" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
                     </div>
                     <div className="form-group" style={{ marginBottom: 0 }}>
                       <label className="form-label">Domain / Company Code *</label>
                       <input required className="form-input" placeholder="e.g. acme" value={company.code} onChange={e => setCompany({...company, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
                     </div>
                   </div>
                </div>

                {/* PRIMARY ADMIN SECTION */}
                <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <Key size={16} style={{ color: 'var(--primary-dark)' }}/> Primary Super Admin
                    </h3>
                    <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--bg-surface-active)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>REQUIRED</span>
                  </div>
                  
                  <div className="grid grid-cols-2" style={{ gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">First Name *</label>
                      <input required className="form-input" value={primaryAdmin.firstName} onChange={e => setPrimaryAdmin({...primaryAdmin, firstName: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Last Name *</label>
                      <input required className="form-input" value={primaryAdmin.lastName} onChange={e => setPrimaryAdmin({...primaryAdmin, lastName: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Email *</label>
                      <input required type="email" className="form-input" value={primaryAdmin.email} onChange={e => setPrimaryAdmin({...primaryAdmin, email: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Password *</label>
                      <div style={{ position: 'relative' }}>
                        <input required type={showPwd1 ? "text" : "password"} minLength={8} className="form-input" value={primaryAdmin.password} onChange={e => setPrimaryAdmin({...primaryAdmin, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPwd1(!showPwd1)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          {showPwd1 ? <EyeOff size={16} color="var(--text-tertiary)"/> : <Eye size={16} color="var(--text-tertiary)"/>}
                        </button>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Confirm Password *</label>
                      <input required type={showPwd1 ? "text" : "password"} minLength={8} className="form-input" value={primaryAdmin.confirmPassword} onChange={e => setPrimaryAdmin({...primaryAdmin, confirmPassword: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: 'var(--text-tertiary)', paddingTop: '22px' }}>
                      Must be at least 8 characters long.
                    </div>
                  </div>
                </div>

                {/* SECONDARY ADMIN SECTION */}
                <div style={{ backgroundColor: secondaryAdmin.enabled ? 'var(--info-bg)' : 'var(--bg-app)', border: `1px solid ${secondaryAdmin.enabled ? 'var(--info-color)' : 'var(--border-light)'}`, borderRadius: '8px', padding: '20px', transition: 'all 0.2s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${secondaryAdmin.enabled ? 'rgba(59, 114, 164, 0.2)' : 'var(--border-light)'}`, paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: secondaryAdmin.enabled ? 'var(--info-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <Users size={16} /> Additional Super Admin
                    </h3>
                    <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--bg-surface-active)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>OPTIONAL</span>
                  </div>
                  
                  {!secondaryAdmin.enabled ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button type="button" onClick={() => setSecondaryAdmin({...secondaryAdmin, enabled: true})} style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        + Add Second Super Admin
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2" style={{ gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">First Name *</label>
                        <input required={secondaryAdmin.enabled} className="form-input" value={secondaryAdmin.firstName} onChange={e => setSecondaryAdmin({...secondaryAdmin, firstName: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Last Name *</label>
                        <input required={secondaryAdmin.enabled} className="form-input" value={secondaryAdmin.lastName} onChange={e => setSecondaryAdmin({...secondaryAdmin, lastName: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Email *</label>
                        <input required={secondaryAdmin.enabled} type="email" className="form-input" value={secondaryAdmin.email} onChange={e => setSecondaryAdmin({...secondaryAdmin, email: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Password *</label>
                        <div style={{ position: 'relative' }}>
                          <input required={secondaryAdmin.enabled} type={showPwd2 ? "text" : "password"} minLength={8} className="form-input" value={secondaryAdmin.password} onChange={e => setSecondaryAdmin({...secondaryAdmin, password: e.target.value})} />
                          <button type="button" onClick={() => setShowPwd2(!showPwd2)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            {showPwd2 ? <EyeOff size={16} color="var(--text-tertiary)"/> : <Eye size={16} color="var(--text-tertiary)"/>}
                          </button>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Confirm Password *</label>
                        <input required={secondaryAdmin.enabled} type={showPwd2 ? "text" : "password"} minLength={8} className="form-input" value={secondaryAdmin.confirmPassword} onChange={e => setSecondaryAdmin({...secondaryAdmin, confirmPassword: e.target.value})} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setSecondaryAdmin({ enabled: false, firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })} style={{ background: 'none', border: 'none', color: 'var(--error-color)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                          - Remove Additional Admin
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {secondaryAdmin.enabled ? '2 Super Admins will be created' : '1 Super Admin will be created'}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary" style={{ minWidth: '160px' }}>
                    {submitting ? 'Creating...' : 'Create Company'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading tenants...</div>
      ) : (
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-medium)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Company Name</th>
              <th style={{ padding: '12px' }}>Domain</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Created On</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px', fontWeight: 500 }}>{t.name}</td>
                <td style={{ padding: '12px' }}>{t.domain}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    backgroundColor: t.isActive ? 'var(--success-color)' : 'var(--danger-color)',
                    color: '#fff' 
                  }}>
                    {t.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>
                  <button className="btn btn-secondary btn-small" onClick={() => navigate(`/platform/tenants/${t.id}`)}>Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PlatformTenants;
