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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 relative">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold m-0">Create New Company</h2>
                <p className="text-sm text-secondary mt-1">Set up a new company and administrator access.</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-secondary hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="p-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-6 flex items-center gap-2 text-sm font-medium">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* LEFT COLUMN: COMPANY & PRIMARY ADMIN */}
                <div className="flex flex-col gap-6">
                  {/* SECTION 1 — COMPANY INFORMATION */}
                  <div>
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                      <Building2 size={16} className="text-primary"/> Company Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                        <input required className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. Acme Corp" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Domain / Company Code *</label>
                        <input required className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. acme" value={company.code} onChange={e => setCompany({...company, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2 — PRIMARY SUPER ADMIN */}
                  <div>
                    <div className="flex items-center justify-between border-b pb-2 mb-4">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Key size={16} className="text-primary"/> Primary Super Admin
                      </h3>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-semibold tracking-wide">REQUIRED</span>
                    </div>
                    <p className="text-xs text-secondary mb-4">Every company must have at least one Super Admin.</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input required className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={primaryAdmin.firstName} onChange={e => setPrimaryAdmin({...primaryAdmin, firstName: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <input required className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={primaryAdmin.lastName} onChange={e => setPrimaryAdmin({...primaryAdmin, lastName: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input required type="email" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={primaryAdmin.email} onChange={e => setPrimaryAdmin({...primaryAdmin, email: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <div className="relative">
                          <input required type={showPwd1 ? "text" : "password"} minLength={8} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={primaryAdmin.password} onChange={e => setPrimaryAdmin({...primaryAdmin, password: e.target.value})} />
                          <button type="button" onClick={() => setShowPwd1(!showPwd1)} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
                            {showPwd1 ? <EyeOff size={16}/> : <Eye size={16}/>}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                        <input required type={showPwd1 ? "text" : "password"} minLength={8} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={primaryAdmin.confirmPassword} onChange={e => setPrimaryAdmin({...primaryAdmin, confirmPassword: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: SECONDARY ADMIN & SUMMARY */}
                <div className="flex flex-col gap-6">
                  {/* SECTION 3 — SECOND SUPER ADMIN */}
                  <div className={`p-4 rounded-lg border transition-all ${secondaryAdmin.enabled ? 'border-primary/30 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'}`}>
                    <div className="flex items-center justify-between border-b pb-2 mb-4">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users size={16} className="text-blue-600"/> Additional Super Admin
                      </h3>
                      {!secondaryAdmin.enabled && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-semibold tracking-wide">OPTIONAL</span>
                      )}
                    </div>
                    
                    {!secondaryAdmin.enabled ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-secondary mb-4">Add another administrator who can independently manage this company.</p>
                        <button type="button" onClick={() => setSecondaryAdmin({...secondaryAdmin, enabled: true})} className="btn btn-secondary text-sm border-dashed">
                          + Add Second Super Admin
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input required={secondaryAdmin.enabled} className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={secondaryAdmin.firstName} onChange={e => setSecondaryAdmin({...secondaryAdmin, firstName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <input required={secondaryAdmin.enabled} className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={secondaryAdmin.lastName} onChange={e => setSecondaryAdmin({...secondaryAdmin, lastName: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input required={secondaryAdmin.enabled} type="email" className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={secondaryAdmin.email} onChange={e => setSecondaryAdmin({...secondaryAdmin, email: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                          <div className="relative">
                            <input required={secondaryAdmin.enabled} type={showPwd2 ? "text" : "password"} minLength={8} className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={secondaryAdmin.password} onChange={e => setSecondaryAdmin({...secondaryAdmin, password: e.target.value})} />
                            <button type="button" onClick={() => setShowPwd2(!showPwd2)} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
                              {showPwd2 ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                          <input required={secondaryAdmin.enabled} type={showPwd2 ? "text" : "password"} minLength={8} className="w-full p-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={secondaryAdmin.confirmPassword} onChange={e => setSecondaryAdmin({...secondaryAdmin, confirmPassword: e.target.value})} />
                        </div>
                        <div className="col-span-2 text-right mt-2">
                          <button type="button" onClick={() => setSecondaryAdmin({ enabled: false, firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })} className="text-red-500 text-sm hover:underline">
                            Remove Second Super Admin
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 4 — ACCESS SUMMARY */}
                  <div className="mt-auto bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 text-sm mb-2">Access Summary</h4>
                    <p className="text-sm text-gray-700"><strong>Company:</strong> {company.name || <span className="text-gray-400">Not specified</span>}</p>
                    <p className="text-sm text-gray-700 mt-1"><strong>Super Admins:</strong> {secondaryAdmin.enabled ? '2 Accounts' : '1 Required'}</p>
                    {secondaryAdmin.enabled && (
                      <p className="text-xs text-secondary mt-2 border-t pt-2 border-gray-200">Both administrators will have full Super Admin access to this company independently.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                <button type="button" className="btn btn-secondary px-6" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary px-8 flex items-center justify-center min-w-[160px]">
                  {submitting ? 'Creating Company...' : 'Create Company'}
                </button>
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
