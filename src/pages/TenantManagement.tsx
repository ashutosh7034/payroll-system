import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, ArrowLeft, Edit2, Shield, Activity, Calendar, CreditCard, ChevronRight, Copy, MapPin, FileText, Briefcase } from 'lucide-react';

const TenantManagement = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchTenant = async () => {
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setTenant(data.data);
      } else {
        setError(data.error?.message || 'Company Not Found');
      }
    } catch (err) {
      setError('Failed to fetch company details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) fetchTenant();
  }, [tenantId]);

  const superAdmins = tenant?.users?.filter((u: any) => u.userRoles?.some((ur: any) => ur.role.name === 'TENANT_SUPER_ADMIN')) || [];

  const handleUpdateStatus = async (isActive: boolean) => {
    if (!window.confirm(`Are you sure you want to ${isActive ? 'activate' : 'suspend'} this company?\n\nImpact: Users will ${isActive ? 'regain' : 'lose'} access to the system.`)) return;
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}/status`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) {
        fetchTenant();
      } else {
        alert('Failed to update company status');
      }
    } catch (err) {
      alert('Error updating company status');
    }
  };

  const handleResetAdminClick = () => {
    if (superAdmins.length === 1) {
      setSelectedAdminId(superAdmins[0].id);
      setIsResetModalOpen(true);
    } else if (superAdmins.length > 1) {
      setSelectedAdminId('');
      setIsResetModalOpen(true);
    } else {
      alert('No super admins found for this company');
    }
  };
  
  const triggerSingleAdminReset = (id: string) => {
    setSelectedAdminId(id);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId) {
      alert('Please select an administrator');
      return;
    }
    setResetting(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}/reset-admin`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: selectedAdminId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setIsResetModalOpen(false);
      } else {
        alert(data.error?.message || 'Failed to reset super admin');
      }
    } catch (err) {
      alert('Error resetting super admin');
    } finally {
      setResetting(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: tenant.name || '',
      legalName: tenant.profile?.legalName || '',
      displayName: tenant.profile?.displayName || '',
      companyType: tenant.profile?.companyType || '',
      industry: tenant.profile?.industry || '',
      website: tenant.profile?.website || '',
      officialEmail: tenant.profile?.officialEmail || '',
      officialPhone: tenant.profile?.officialPhone || '',
      cin: tenant.profile?.cin || '',
      pan: tenant.profile?.pan || '',
      tan: tenant.profile?.tan || '',
      gstin: tenant.profile?.gstin || '',
      registeredAddress: tenant.profile?.registeredAddress || '',
      city: tenant.profile?.city || '',
      state: tenant.profile?.state || '',
      country: tenant.profile?.country || '',
      pincode: tenant.profile?.pincode || '',
      financialYear: tenant.profile?.financialYear || '',
      contactName: tenant.profile?.contactName || '',
      contactDesignation: tenant.profile?.contactDesignation || '',
      contactEmail: tenant.profile?.contactEmail || '',
      contactPhone: tenant.profile?.contactPhone || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('payflow_token');
      
      const payload = {
        name: editForm.name,
        profile: { ...editForm }
      };
      delete payload.profile.name; // name goes to tenant

      const res = await fetch(`http://localhost:4000/api/platform/tenants/${tenantId}/profile`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditModalOpen(false);
        fetchTenant();
      } else {
        alert(data.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      alert('Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  if (loading) return <div className="text-center text-secondary" style={{ padding: '40px' }}>Loading company details...</div>;
  if (error || !tenant) return (
    <div className="card text-center" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2 className="section-title mb-4">{error || 'Company Not Found'}</h2>
      <button className="btn btn-secondary" onClick={() => navigate('/platform/tenants')}>Back to Companies</button>
    </div>
  );

  const displayValue = (val: any) => val ? val : <span className="text-secondary" style={{ fontStyle: 'italic' }}>Not provided</span>;
  const isAddressEmpty = !tenant.profile?.registeredAddress && !tenant.profile?.city && !tenant.profile?.state && !tenant.profile?.country && !tenant.profile?.pincode;

  return (
    <div className="app-content-inner" style={{ paddingBottom: '40px' }}>
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button className="btn btn-ghost" onClick={() => navigate('/platform/tenants')} style={{ paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back to Companies
        </button>
      </div>

      {/* Header Card */}
      <div className="card mb-6" style={{ padding: '32px' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Identity Section */}
          <div className="flex items-center gap-4">
            <div style={{
              width: '64px', height: '64px', borderRadius: '12px',
              backgroundColor: 'var(--primary-dark)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 'bold'
            }}>
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="page-title">{tenant.name}</h1>
                <span className={`badge ${tenant.isActive ? 'badge-success' : 'badge-error'}`} style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                  {tenant.isActive ? 'ACTIVE' : 'SUSPENDED'}
                </span>
              </div>
              
              {/* Metadata Grid */}
              <div className="flex items-center gap-6 mt-4" style={{ flexWrap: 'wrap' }}>
                <div className="flex flex-col">
                  <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Code</span>
                  <span className="text-body" style={{ fontWeight: 600 }}>{tenant.domain}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tenant ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-body" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {tenant.id.substring(0,8)}...{tenant.id.substring(tenant.id.length-6)}
                    </span>
                    <button onClick={() => copyToClipboard(tenant.id)} className="btn btn-ghost" style={{ padding: '4px' }}>
                      <Copy size={14}/>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</span>
                  <span className="text-body" style={{ fontWeight: 600 }}>
                    {new Date(tenant.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={openEditModal}>
              <Edit2 size={16} /> Edit Company
            </button>
            {tenant.isActive ? (
              <button className="btn btn-danger" onClick={() => handleUpdateStatus(false)}>
                Suspend Company
              </button>
            ) : (
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)' }} onClick={() => handleUpdateStatus(true)}>
                Activate Company
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleResetAdminClick}>
              <Shield size={16} /> Reset Super Admin
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-header" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {['OVERVIEW', 'USERS', 'EMPLOYEES', 'CONFIGURATION', 'PAYROLL', 'AUDIT'].map(tab => (
          <div 
            key={tab} 
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'OVERVIEW' && (
          <div className="flex flex-col gap-6">
            
            {/* KPI Row */}
            <div className="grid grid-cols-4 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="card flex flex-col gap-1">
                <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Employees</span>
                <span className="page-title">{tenant.employees?.length || 0}</span>
                <span className="text-secondary mt-4">Active: {tenant.employees?.filter((e:any)=>e.status==='ACTIVE').length || 0}</span>
              </div>
              <div className="card flex flex-col gap-1">
                <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Users</span>
                <span className="page-title">{tenant.users?.length || 0}</span>
                <span className="text-secondary mt-4">Active: {tenant.users?.filter((u:any)=>u.isActive).length || 0}</span>
              </div>
              <div className="card flex flex-col gap-1">
                <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Super Admins</span>
                <span className="page-title">{superAdmins.length}</span>
                <span className="text-secondary mt-4">Active: {superAdmins.filter((u:any)=>u.isActive).length || 0}</span>
              </div>
              <div className="card flex flex-col gap-1">
                <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Payroll</span>
                <span className="section-title">No runs yet</span>
                <span className="text-secondary mt-4">Pending setup</span>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                
                {/* Company Information */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="card-header bg-surface-active border-light" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 24px', margin: 0, backgroundColor: '#FAFAFA' }}>
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-secondary" />
                      <h2 className="card-title">Company Information</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6" style={{ padding: '24px' }}>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Legal Entity Name</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.legalName)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Display Name</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{tenant.profile?.displayName || tenant.name}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Company Type</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.companyType)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Industry</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.industry)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Website</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.website)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Financial Year</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.financialYear)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>CIN</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.cin)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>PAN</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.pan)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>TAN</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.tan)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>GSTIN</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.gstin)}</span>
                    </div>
                  </div>
                </div>

                {/* Super Administrators */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="card-header bg-surface-active border-light" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 24px', margin: 0, backgroundColor: '#FAFAFA' }}>
                    <div className="flex items-center gap-2">
                      <Shield size={18} className="text-secondary" />
                      <h2 className="card-title">Super Administrators</h2>
                    </div>
                    <span className="text-small" style={{ fontWeight: 600 }}>{superAdmins.length} / 2 slots used</span>
                  </div>
                  
                  <div className="flex flex-col">
                    {superAdmins.length === 0 ? (
                      <div className="text-center text-secondary" style={{ padding: '32px' }}>No super administrators found.</div>
                    ) : (
                      superAdmins.map((admin: any, index: number) => (
                        <div key={admin.id} className="flex justify-between items-center" style={{ padding: '24px', borderBottom: index !== superAdmins.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <div className="flex items-center gap-4">
                            <div style={{
                              width: '48px', height: '48px', borderRadius: '50%',
                              backgroundColor: 'var(--info-bg)', color: 'var(--info-color)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '16px', fontWeight: 'bold'
                            }}>
                              {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-body" style={{ fontWeight: 600 }}>{admin.firstName} {admin.lastName}</span>
                              <span className="text-secondary mb-2">{admin.email}</span>
                              <div className="flex gap-2 items-center">
                                <span className="badge badge-info">Super Admin</span>
                                <span className={`badge ${admin.isActive ? 'badge-success' : 'badge-error'}`}>
                                  ● {admin.isActive ? 'Active' : 'Suspended'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="btn btn-secondary" onClick={() => navigate('/platform/tenants')}>Manage</button>
                            <button className="btn btn-secondary" onClick={() => triggerSingleAdminReset(admin.id)}>Reset</button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {superAdmins.length === 1 && (
                      <div className="flex justify-center items-center" style={{ padding: '16px', borderTop: '1px solid var(--border-light)', backgroundColor: '#FAFAFA' }}>
                        <button className="btn btn-ghost" style={{ color: 'var(--info-color)' }} onClick={() => alert("Please add the secondary Super Admin from the Edit Company profile or Users tab.")}>
                          + Add Second Super Admin
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                
                {/* Company Address */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="card-header bg-surface-active border-light" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 24px', margin: 0, backgroundColor: '#FAFAFA' }}>
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-secondary" />
                      <h2 className="card-title">Company Address</h2>
                    </div>
                  </div>
                  <div style={{ padding: '24px' }}>
                    {isAddressEmpty ? (
                      <div className="text-center text-secondary" style={{ fontStyle: 'italic' }}>No registered address has been added yet.</div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-small" style={{ textTransform: 'uppercase' }}>Registered Address</span>
                          <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.registeredAddress)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-small" style={{ textTransform: 'uppercase' }}>City</span>
                            <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.city)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-small" style={{ textTransform: 'uppercase' }}>State</span>
                            <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.state)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-small" style={{ textTransform: 'uppercase' }}>Country</span>
                            <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.country)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-small" style={{ textTransform: 'uppercase' }}>Pincode</span>
                            <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.pincode)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Contact */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="card-header bg-surface-active border-light" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 24px', margin: 0, backgroundColor: '#FAFAFA' }}>
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-secondary" />
                      <h2 className="card-title">Primary Contact</h2>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4" style={{ padding: '24px' }}>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Contact Name</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.contactName)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Designation</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.contactDesignation)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Email</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.contactEmail)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-small" style={{ textTransform: 'uppercase' }}>Phone</span>
                      <span className="text-body" style={{ fontWeight: 500 }}>{displayValue(tenant.profile?.contactPhone)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header bg-surface-active border-light" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 24px', margin: 0, backgroundColor: '#FAFAFA' }}>
              <h2 className="card-title">Company Users ({tenant.users?.length || 0})</h2>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.users?.length > 0 ? tenant.users.map((u: any) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: 'var(--info-bg)', color: 'var(--info-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 'bold'
                          }}>
                            {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                          {u.userRoles?.map((ur: any) => (
                            <span key={ur.role.name} className="badge badge-neutral">{ur.role.name.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                          ● {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary">Manage</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center text-secondary">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'EMPLOYEES' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="card flex flex-col gap-1">
                <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Employees</span>
                <span className="page-title">{tenant.employees?.length || 0}</span>
              </div>
              <div className="card flex flex-col gap-1">
                <span className="text-small" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active</span>
                <span className="page-title" style={{ color: 'var(--success-color)' }}>{tenant.employees?.filter((e:any) => e.status === 'ACTIVE').length || 0}</span>
              </div>
            </div>
            
            <div className="card text-center flex flex-col items-center justify-center gap-2" style={{ padding: '64px 24px' }}>
               <Briefcase size={40} className="text-tertiary mb-2" />
               <h3 className="section-title">No employees added yet</h3>
               <p className="text-secondary">Employees will appear here once they are added by the tenant administrators.</p>
            </div>
          </div>
        )}

        {activeTab === 'CONFIGURATION' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
             <div className="card-header bg-surface-active border-light" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 24px', margin: 0, backgroundColor: '#FAFAFA' }}>
               <h2 className="card-title">Company Configuration</h2>
             </div>
             <div className="flex flex-col">
               {[
                 { name: 'Payroll Configuration', module: 'payroll', desc: 'Configure payroll calendar and rules', icon: <CreditCard size={18} color="var(--info-color)" /> },
                 { name: 'Attendance Rules', module: 'attendance', desc: 'Working hours, shifts and attendance', icon: <Calendar size={18} color="var(--success-color)" /> },
                 { name: 'Leave Policies', module: 'leave', desc: 'Leave types, balances and approval', icon: <Activity size={18} color="var(--warning-color)" /> },
                 { name: 'Tax & Statutory', module: 'tax', desc: 'Tax rates, deductions and compliances', icon: <FileText size={18} color="var(--primary-dark)" /> },
                 { name: 'Approval Workflows', module: 'approval', desc: 'Configure approval paths for requests', icon: <Users size={18} color="var(--error-color)" /> },
               ].map((config, i, arr) => (
                 <div key={i} className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: i !== arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div className="flex items-center gap-4">
                       <div style={{
                         width: '40px', height: '40px', borderRadius: '8px',
                         border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-surface)',
                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                       }}>
                         {config.icon}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-body" style={{ fontWeight: 600 }}>{config.name}</span>
                         <span className="text-secondary text-small mt-1">{config.desc}</span>
                       </div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate(`/platform/tenants/${tenantId}/configuration/${config.module}`)}>
                      Configure <ChevronRight size={14} />
                    </button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'PAYROLL' && (
          <div className="card text-center flex flex-col items-center justify-center gap-2" style={{ padding: '64px 24px' }}>
             <CreditCard size={40} className="text-tertiary mb-2" />
             <h3 className="section-title">No payroll runs yet</h3>
             <p className="text-secondary">When the company processes payroll, the summary and history will appear here.</p>
          </div>
        )}

        {activeTab === 'AUDIT' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header bg-surface-active border-light" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 24px', margin: 0, backgroundColor: '#FAFAFA' }}>
              <h2 className="card-title">Audit Logs</h2>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Action</th>
                    <th>Performed By</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{new Date(tenant.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ fontWeight: 600 }}>COMPANY_CREATED</td>
                    <td>Platform System</td>
                    <td>{tenant.name}</td>
                    <td><span className="badge badge-success">Success</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h2 className="section-title">Edit Company Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="btn btn-ghost" style={{ padding: '4px' }}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto' }}>
              <form id="edit-company-form" onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                
                {/* General Info */}
                <div className="flex flex-col gap-4">
                  <h3 className="card-title" style={{ color: 'var(--info-color)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>General Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">System Name *</label>
                      <input required name="name" value={editForm.name} onChange={handleEditChange} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Legal Name</label>
                      <input name="legalName" value={editForm.legalName} onChange={handleEditChange} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Display/Trade Name</label>
                      <input name="displayName" value={editForm.displayName} onChange={handleEditChange} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Industry</label>
                      <input name="industry" value={editForm.industry} onChange={handleEditChange} className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Website</label>
                      <input type="url" name="website" value={editForm.website} onChange={handleEditChange} className="form-input" placeholder="https://..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Type</label>
                      <select name="companyType" value={editForm.companyType} onChange={handleEditChange} className="form-select">
                        <option value="">Select...</option>
                        <option value="Private Limited">Private Limited</option>
                        <option value="Public Limited">Public Limited</option>
                        <option value="LLP">LLP</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Proprietorship">Proprietorship</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Financial Year</label>
                      <input name="financialYear" value={editForm.financialYear} onChange={handleEditChange} className="form-input" placeholder="e.g. Apr-Mar" />
                    </div>
                  </div>
                </div>

                {/* Legal & Registrations */}
                <div className="flex flex-col gap-4">
                  <h3 className="card-title" style={{ color: 'var(--info-color)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Legal & Registrations</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group"><label className="form-label">CIN</label><input name="cin" value={editForm.cin} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">PAN</label><input name="pan" value={editForm.pan} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">TAN</label><input name="tan" value={editForm.tan} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">GSTIN</label><input name="gstin" value={editForm.gstin} onChange={handleEditChange} className="form-input" /></div>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="flex flex-col gap-4">
                  <h3 className="card-title" style={{ color: 'var(--info-color)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Contact & Address</h3>
                  <div className="form-group">
                    <label className="form-label">Registered Address</label>
                    <input name="registeredAddress" value={editForm.registeredAddress} onChange={handleEditChange} className="form-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group"><label className="form-label">City</label><input name="city" value={editForm.city} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">State</label><input name="state" value={editForm.state} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Country</label><input name="country" value={editForm.country} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Pincode</label><input name="pincode" value={editForm.pincode} onChange={handleEditChange} className="form-input" /></div>
                  </div>
                </div>

                {/* Primary Contact */}
                <div className="flex flex-col gap-4">
                  <h3 className="card-title" style={{ color: 'var(--info-color)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Primary Contact Person</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group"><label className="form-label">Name</label><input name="contactName" value={editForm.contactName} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Designation</label><input name="contactDesignation" value={editForm.contactDesignation} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Email</label><input type="email" name="contactEmail" value={editForm.contactEmail} onChange={handleEditChange} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Phone</label><input name="contactPhone" value={editForm.contactPhone} onChange={handleEditChange} className="form-input" /></div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="modal-footer">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="edit-company-form" disabled={isSaving} className="btn btn-primary">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Super Admin Modal */}
      {isResetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="section-title">Reset Super Admin Password</h2>
              <button onClick={() => setIsResetModalOpen(false)} className="btn btn-ghost" style={{ padding: '4px' }}>&times;</button>
            </div>
            
            <div className="modal-body">
              <form id="reset-admin-form" onSubmit={handleConfirmReset}>
                <p className="text-secondary mb-4">Select the administrator you want to reset. A new temporary password will be assigned.</p>
                
                <div className="flex flex-col gap-3">
                  {superAdmins.map((admin: any) => (
                    <label key={admin.id} className="card flex items-center gap-4" style={{ cursor: 'pointer', padding: '16px', borderColor: selectedAdminId === admin.id ? 'var(--primary-dark)' : 'var(--border-light)', backgroundColor: selectedAdminId === admin.id ? '#FAFAFA' : 'white' }}>
                      <input 
                        type="radio" 
                        name="superAdmin" 
                        value={admin.id} 
                        checked={selectedAdminId === admin.id} 
                        onChange={() => setSelectedAdminId(admin.id)} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <div className="flex flex-col">
                        <span className="text-body" style={{ fontWeight: 600 }}>{admin.firstName} {admin.lastName}</span>
                        <span className="text-small">{admin.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsResetModalOpen(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="reset-admin-form" disabled={resetting || !selectedAdminId} className="btn btn-primary">
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TenantManagement;
