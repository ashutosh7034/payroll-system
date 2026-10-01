import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, AlertCircle, CheckCircle2, Loader2, Search, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { checkPermission } from '../utils/permissions';
import OrganizationLegalEntities from '../components/organization/OrganizationLegalEntities';
import OrganizationCostCenters from '../components/organization/OrganizationCostCenters';

export default function Organization() {
  const [data, setData] = useState<{ departments: any[], locations: any[], employees: any[], legalEntities: any[], costCenters: any[] }>({ departments: [], locations: [], employees: [], legalEntities: [], costCenters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: string, message: string } | null>(null);
  const [success, setSuccess] = useState('');
  
  const [activeTab, setActiveTab] = useState<'departments' | 'locations' | 'legalEntities' | 'costCenters'>('departments');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [editingDept, setEditingDept] = useState<any>(null);
  const [editingLoc, setEditingLoc] = useState<any>(null);
  const [editingLegalEntity, setEditingLegalEntity] = useState<any>(null);
  const [editingCostCenter, setEditingCostCenter] = useState<any>(null);
  const [leModalOpen, setLeModalOpen] = useState(false);
  const [ccModalOpen, setCcModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'dept' | 'loc' | 'le' | 'cc', item: any } | null>(null);
  const [saving, setSaving] = useState(false);

  // Dropdown Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { token, user } = useAuth();
  const canManage = checkPermission(user?.roles || [], 'organization.manage');

  const fetchData = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [depsRes, locsRes, empRes, leRes, ccRes] = await Promise.all([
        fetch(`${baseUrl}/org/departments`, { headers }),
        fetch(`${baseUrl}/org/locations`, { headers }),
        fetch(`${baseUrl}/employees`, { headers }),
        fetch(`${baseUrl}/org/legal-entities`, { headers }),
        fetch(`${baseUrl}/org/cost-centers`, { headers })
      ]);

      if (depsRes.status === 401 || locsRes.status === 401 || empRes.status === 401) {
        throw { type: 'AUTH', message: 'Authentication required or token expired. Please login again.' };
      }
      
      if (depsRes.status === 403 || locsRes.status === 403 || empRes.status === 403) {
        throw { type: 'PERMISSION', message: 'You don\'t have permission to view organization structure.' };
      }
      
      if (depsRes.status === 404 || locsRes.status === 404 || empRes.status === 404) {
        throw { type: 'NOT_FOUND', message: 'API configuration error: endpoint not found.' };
      }
      
      if (depsRes.status >= 500 || locsRes.status >= 500 || empRes.status >= 500) {
        throw { type: 'SERVER', message: 'Internal server error occurred while fetching organization data.' };
      }

      const [deps, locs, emps, les, ccs] = await Promise.all([depsRes.json(), locsRes.json(), empRes.json(), leRes.json(), ccRes.json()]);

      if (!depsRes.ok) throw { type: 'API', message: deps.error?.message || 'Failed to fetch departments' };
      if (!locsRes.ok) throw { type: 'API', message: locs.error?.message || 'Failed to fetch locations' };

      setData({
        departments: deps.data || [],
        locations: locs.data || [],
        employees: emps.data || [],
        legalEntities: les.data || [],
        costCenters: ccs.data || []
      });
      setError(null);
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError({ type: 'NETWORK', message: 'Network connection failed. Please check your internet connection and try again.' });
      } else {
        setError(err.type ? err : { type: 'UNKNOWN', message: err.message || 'An unknown error occurred.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const isUpdate = !!editingDept.id;
      const url = isUpdate ? `${baseUrl}/org/departments/${editingDept.id}` : `${baseUrl}/org/departments`;
      
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingDept)
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to save department');
      
      setSuccess(`Department ${isUpdate ? 'updated' : 'created'} successfully.`);
      setDeptModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const isUpdate = !!editingLoc.id;
      const url = isUpdate ? `${baseUrl}/org/locations/${editingLoc.id}` : `${baseUrl}/org/locations`;
      
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingLoc)
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to save location');
      
      setSuccess(`Location ${isUpdate ? 'updated' : 'created'} successfully.`);
      setLocModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const typeStr = deletingItem.type === 'dept' ? 'departments' : 'locations';
      
      const res = await fetch(`${baseUrl}/org/${typeStr}/${deletingItem.item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || `Failed to delete ${deletingItem.type}`);
      
      setSuccess(`${deletingItem.type === 'dept' ? 'Department' : 'Location'} deleted successfully.`);
      setDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError({ type: 'API', message: err.message });
      setDeleteModalOpen(false);
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (type: 'dept' | 'loc', item: any) => {
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const typeStr = type === 'dept' ? 'departments' : 'locations';
      
      const res = await fetch(`${baseUrl}/org/${typeStr}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...item, isActive: !item.isActive })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || `Failed to update status`);
      
      setSuccess(`${type === 'dept' ? 'Department' : 'Location'} ${item.isActive ? 'deactivated' : 'activated'} successfully.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
      window.scrollTo(0, 0);
    }
  };

  if (loading) {
    return <div className="app-content-inner" style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-secondary)' }} /></div>;
  }

  const totalEmployees = data.employees.length;

  const filteredDepartments = data.departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLocations = data.locations.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.city && l.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.code && l.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="app-content-inner" style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      
      {/* HEADER AND SUMMARY */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '28px', margin: '0 0 4px 0' }}>Organization Structure</h1>
          <p className="text-body" style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage departments, locations and organizational setup.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <span>{data.departments.length} Department{data.departments.length !== 1 ? 's' : ''}</span>
            <span>&middot;</span>
            <span>{data.locations.length} Location{data.locations.length !== 1 ? 's' : ''}</span>
            <span>&middot;</span>
            <span>{totalEmployees} Employee{totalEmployees !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {canManage && (
          <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', height: '40px' }} onClick={() => {
            if (activeTab === 'departments') {
              setEditingDept({ isActive: true });
              setDeptModalOpen(true);
            } else {
              setEditingLoc({ isActive: true });
              setLocModalOpen(true);
            }
          }}>
            <Plus size={16} /> Add {activeTab === 'departments' ? 'Department' : 'Location'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '6px', backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
          <AlertCircle size={18} /> {error.message}
        </div>
      )}
      
      {!error && success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '6px', backgroundColor: 'var(--success-bg)', color: 'var(--success-color)', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {/* Hide the main UI if there's an auth/permission error, but show it if it's just an API/Network error with the specific action they tried */}
      {(!error || (error.type !== 'AUTH' && error.type !== 'PERMISSION' && error.type !== 'NOT_FOUND' && error.type !== 'SERVER' && error.type !== 'NETWORK')) && (
        <>
          {/* TABS */}
          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', overflowX: 'auto' }}>
        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'departments' ? 600 : 500,
            color: activeTab === 'departments' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'departments' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px', whiteSpace: 'nowrap'
          }}
          onClick={() => { setActiveTab('departments'); setSearchQuery(''); }}
        >
          Departments ({data.departments.length})
        </button>
        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'locations' ? 600 : 500,
            color: activeTab === 'locations' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'locations' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px', whiteSpace: 'nowrap'
          }}
          onClick={() => { setActiveTab('locations'); setSearchQuery(''); }}
        >
          Locations ({data.locations.length})
        </button>
        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'legalEntities' ? 600 : 500,
            color: activeTab === 'legalEntities' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'legalEntities' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px', whiteSpace: 'nowrap'
          }}
          onClick={() => { setActiveTab('legalEntities'); setSearchQuery(''); }}
        >
          Legal Entities ({data.legalEntities.length})
        </button>
        <button 
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '14px', fontWeight: activeTab === 'costCenters' ? 600 : 500,
            color: activeTab === 'costCenters' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'costCenters' ? '2px solid var(--primary-dark)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px', whiteSpace: 'nowrap'
          }}
          onClick={() => { setActiveTab('costCenters'); setSearchQuery(''); }}
        >
          Cost Centers ({data.costCenters.length})
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '16px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder={`Search ${activeTab}...`} 
          className="form-input"
          style={{ paddingLeft: '36px', height: '40px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* MAIN DATA TABLES */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
        {activeTab === 'departments' && (
          <div>
            {filteredDepartments.length > 0 ? (
              <div className="table-container" style={{ border: 'none', margin: 0 }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Code</th>
                      <th>Head</th>
                      <th>Location</th>
                      <th>Employees</th>
                      <th>Status</th>
                      {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map(d => (
                      <tr key={d.id} style={{ opacity: d.isActive ? 1 : 0.7, height: '56px' }}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{d.code || '—'}</td>
                        <td>{d.head ? `${d.head.firstName} ${d.head.lastName}` : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                        <td>{d.location ? d.location.name : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}</td>
                        <td>{d._count?.employees || 0}</td>
                        <td>
                          {d.isActive ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-neutral">Inactive</span>
                          )}
                        </td>
                        {canManage && (
                          <td style={{ textAlign: 'right', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                              <button style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }} onClick={() => { setEditingDept(d); setDeptModalOpen(true); }}>Edit</button>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === d.id ? null : d.id); }}>
                                  <MoreHorizontal size={16} />
                                </button>
                                {openMenuId === d.id && (
                                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '6px', boxShadow: 'var(--shadow-md)', zIndex: 50, padding: '4px 0', minWidth: '140px', textAlign: 'left' }}>
                                    <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => { handleDeactivate('dept', d); setOpenMenuId(null); }}>
                                      {d.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--error-color)' }} onClick={() => { setDeletingItem({ type: 'dept', item: d }); setDeleteModalOpen(true); setOpenMenuId(null); }}>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No departments {searchQuery ? 'found' : 'configured'}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  {searchQuery ? `No departments matching "${searchQuery}"` : 'Add your first department to organize employees.'}
                </p>
                {!searchQuery && canManage && (
                  <button className="btn btn-primary" onClick={() => { setEditingDept({ isActive: true }); setDeptModalOpen(true); }}><Plus size={16} /> Add Department</button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'locations' && (
          <div>
            {filteredLocations.length > 0 ? (
              <div className="table-container" style={{ border: 'none', margin: 0 }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Code</th>
                      <th>City</th>
                      <th>Employees</th>
                      <th>Departments</th>
                      <th>Status</th>
                      {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map(l => (
                      <tr key={l.id} style={{ opacity: l.isActive ? 1 : 0.7, height: '56px' }}>
                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{l.code || '—'}</td>
                        <td>{l.city || '—'}</td>
                        <td>{l._count?.employees || 0}</td>
                        <td>{l._count?.departments || 0}</td>
                        <td>
                          {l.isActive ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-neutral">Inactive</span>
                          )}
                        </td>
                        {canManage && (
                          <td style={{ textAlign: 'right', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                              <button style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }} onClick={() => { setEditingLoc(l); setLocModalOpen(true); }}>Edit</button>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === l.id ? null : l.id); }}>
                                  <MoreHorizontal size={16} />
                                </button>
                                {openMenuId === l.id && (
                                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '6px', boxShadow: 'var(--shadow-md)', zIndex: 50, padding: '4px 0', minWidth: '140px', textAlign: 'left' }}>
                                    <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => { handleDeactivate('loc', l); setOpenMenuId(null); }}>
                                      {l.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: 'var(--error-color)' }} onClick={() => { setDeletingItem({ type: 'loc', item: l }); setDeleteModalOpen(true); setOpenMenuId(null); }}>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No locations {searchQuery ? 'found' : 'configured'}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  {searchQuery ? `No locations matching "${searchQuery}"` : "Add your company's offices, branches or work locations."}
                </p>
                {!searchQuery && canManage && (
                  <button className="btn btn-primary" onClick={() => { setEditingLoc({ isActive: true }); setLocModalOpen(true); }}><Plus size={16} /> Add Location</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DEPARTMENT MODAL */}
      {deptModalOpen && editingDept && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>{editingDept.id ? 'Edit Department' : 'Add Department'}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Create or modify a department for your organization.</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setDeptModalOpen(false)} style={{ padding: '4px' }}>✕</button>
            </div>
            <form onSubmit={handleSaveDepartment}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Department Name <span style={{ color: 'var(--error-color)' }}>*</span></label>
                  <input required className="form-input" value={editingDept.name || ''} onChange={e => setEditingDept({...editingDept, name: e.target.value})} placeholder="e.g. Engineering & Product" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Department Code <span style={{ color: 'var(--error-color)' }}>*</span></label>
                  <input required className="form-input" value={editingDept.code || ''} onChange={e => setEditingDept({...editingDept, code: e.target.value.toUpperCase()})} placeholder="e.g. ENG" />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Department Head</label>
                  <select className="form-select" value={editingDept.headId || ''} onChange={e => setEditingDept({...editingDept, headId: e.target.value})}>
                    <option value="">-- Select employee --</option>
                    {data.employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Location</label>
                  <select className="form-select" value={editingDept.locationId || ''} onChange={e => setEditingDept({...editingDept, locationId: e.target.value})}>
                    <option value="">-- Select location --</option>
                    {data.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Parent Department</label>
                  <select className="form-select" value={editingDept.parentId || ''} onChange={e => setEditingDept({...editingDept, parentId: e.target.value})}>
                    <option value="">-- None --</option>
                    {data.departments.filter(d => d.id !== editingDept.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Status</label>
                  <select className="form-select" value={editingDept.isActive === false ? 'false' : 'true'} onChange={e => setEditingDept({...editingDept, isActive: e.target.value === 'true'})}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Description</label>
                  <textarea className="form-input" value={editingDept.description || ''} onChange={e => setEditingDept({...editingDept, description: e.target.value})} rows={2} placeholder="Brief description of the department's function..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeptModalOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editingDept.id ? 'Save Changes' : 'Create Department')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCATION MODAL */}
      {locModalOpen && editingLoc && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>{editingLoc.id ? 'Edit Location' : 'Add Location'}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Create or modify a work location for your organization.</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setLocModalOpen(false)} style={{ padding: '4px' }}>✕</button>
            </div>
            <form onSubmit={handleSaveLocation}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Location Name <span style={{ color: 'var(--error-color)' }}>*</span></label>
                  <input required className="form-input" value={editingLoc.name || ''} onChange={e => setEditingLoc({...editingLoc, name: e.target.value})} placeholder="e.g. Testing Studio" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Location Code <span style={{ color: 'var(--error-color)' }}>*</span></label>
                  <input required className="form-input" value={editingLoc.code || ''} onChange={e => setEditingLoc({...editingLoc, code: e.target.value.toUpperCase()})} placeholder="e.g. TST-STD" />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Address Line 1</label>
                  <input className="form-input" value={editingLoc.address || ''} onChange={e => setEditingLoc({...editingLoc, address: e.target.value})} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>City</label>
                  <input className="form-input" value={editingLoc.city || ''} onChange={e => setEditingLoc({...editingLoc, city: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>State / Province</label>
                  <input className="form-input" value={editingLoc.state || ''} onChange={e => setEditingLoc({...editingLoc, state: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Country</label>
                  <input className="form-input" value={editingLoc.country || ''} onChange={e => setEditingLoc({...editingLoc, country: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Pincode / Zip</label>
                  <input className="form-input" value={editingLoc.pincode || ''} onChange={e => setEditingLoc({...editingLoc, pincode: e.target.value})} />
                </div>

                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-light)', marginTop: '8px', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Contact Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Contact Person</label>
                      <input className="form-input" value={editingLoc.contactPerson || ''} onChange={e => setEditingLoc({...editingLoc, contactPerson: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Contact Email</label>
                      <input type="email" className="form-input" value={editingLoc.contactEmail || ''} onChange={e => setEditingLoc({...editingLoc, contactEmail: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Contact Phone</label>
                      <input className="form-input" value={editingLoc.contactPhone || ''} onChange={e => setEditingLoc({...editingLoc, contactPhone: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Status</label>
                      <select className="form-select" value={editingLoc.isActive === false ? 'false' : 'true'} onChange={e => setEditingLoc({...editingLoc, isActive: e.target.value === 'true'})}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setLocModalOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editingLoc.id ? 'Save Changes' : 'Create Location')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && deletingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} style={{ color: 'var(--error-color)' }} /> 
                Delete {deletingItem.type === 'dept' ? 'Department' : 'Location'}
              </h2>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete the following {deletingItem.type === 'dept' ? 'department' : 'location'}?
              </p>
              
              <div style={{ backgroundColor: 'var(--bg-surface-active)', borderRadius: '6px', border: '1px solid var(--border-light)', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{deletingItem.item.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Code: <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-surface)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>{deletingItem.item.code || 'N/A'}</span></div>
                
                {deletingItem.item._count?.employees > 0 && (
                  <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 500, backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(184, 84, 80, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>Warning: This {deletingItem.type === 'dept' ? 'department' : 'location'} currently has <strong>{deletingItem.item._count.employees} employees</strong> assigned. You must reassign them before deletion will be permitted by the system.</span>
                  </div>
                )}
              </div>
              
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer" style={{ backgroundColor: 'var(--bg-surface-active)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)} disabled={saving}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting...' : `Delete ${deletingItem.type === 'dept' ? 'Department' : 'Location'}`}</button>
            </div>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
}
