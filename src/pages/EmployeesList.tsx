import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, MoreHorizontal, Plus, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EmployeeDetailModal from '../components/employee/EmployeeDetailModal';

// Basic wrapper around fetch for API calls
const fetchApi = async (url: string, token: string | null, options?: RequestInit) => {
  const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + `${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers || {})
    }
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || 'API request failed');
  }
  return data.data;
};

const EmployeeFormModal = ({ isOpen, onClose, onSuccess, token, orgData }: any) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', employeeId: '', status: 'ACTIVE',
    departmentId: '', locationId: '', legalEntityId: '', designationId: '', costCenterId: '', managerId: '',
    employmentType: 'FULL_TIME', joiningDate: '', exitDate: '',
    bankName: '', accountNumber: '', ifscCode: '', accountType: 'SAVINGS',
    panNumber: '', taxRegime: 'NEW',
    createLogin: false, password: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1 && formData.createLogin && !formData.email) {
      setError('Email is required to create a login');
      return;
    }
    
    if (step < 5) {
      setError('');
      setStep(step + 1);
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      await fetchApi('/employees', token, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Personal' },
    { num: 2, label: 'Employment' },
    { num: 3, label: 'Organization' },
    { num: 4, label: 'Bank' },
    { num: 5, label: 'Tax' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ width: '90%', maxWidth: '800px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        
        {/* Header - Fixed */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h3 className="card-title">Add New Employee</h3>
          <button className="btn-ghost" onClick={onClose} type="button" style={{ fontSize: '20px', lineHeight: '1', padding: '0 8px' }}>&times;</button>
        </div>
        
        {/* Step Indicator - Fixed */}
        <div style={{ flexShrink: 0, padding: '16px 24px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-app)', overflowX: 'auto' }}>
          <div className="flex items-center justify-between" style={{ minWidth: '500px' }}>
            {stepsList.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: step >= s.num ? 'var(--primary-dark)' : 'var(--bg-surface-active)',
                    color: step >= s.num ? 'white' : 'var(--text-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: '12px'
                  }}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span style={{
                    color: step >= s.num ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontWeight: step >= s.num ? 600 : 500,
                    fontSize: '13px'
                  }}>
                    {s.label}
                  </span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div style={{
                    flex: 1, height: '1px', margin: '0 16px',
                    backgroundColor: step > s.num ? 'var(--primary-dark)' : 'var(--border-light)'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body - Scrollable */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {error && <div className="p-3 mb-4 text-sm rounded-md" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', border: '1px solid var(--error-color)' }}>{error}</div>}
            
            {step === 1 && (
              <div className="flex flex-col" style={{ gap: '24px' }}>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Employee ID <span style={{ color: 'var(--error-color)' }}>*</span></label>
                    <input type="text" name="employeeId" className="form-input" required value={formData.employeeId} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email <span style={{ color: 'var(--error-color)' }}>*</span></label>
                    <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">First Name <span style={{ color: 'var(--error-color)' }}>*</span></label>
                    <input type="text" name="firstName" className="form-input" required value={formData.firstName} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Last Name <span style={{ color: 'var(--error-color)' }}>*</span></label>
                    <input type="text" name="lastName" className="form-input" required value={formData.lastName} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status <span style={{ color: 'var(--error-color)' }}>*</span></label>
                    <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px' }}>
                    Employee Self-Service (ESS)
                  </div>
                  
                  <div className="flex items-start" style={{ gap: '12px', marginBottom: '16px' }}>
                    <input 
                      type="checkbox" 
                      id="createLogin"
                      checked={formData.createLogin} 
                      onChange={(e) => setFormData({...formData, createLogin: e.target.checked})}
                      style={{ marginTop: '4px', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div>
                      <label htmlFor="createLogin" style={{ display: 'block', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px' }}>
                        Allow this employee to access the employee portal
                      </label>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Creates access to personal attendance, leave and payslips.
                      </div>
                    </div>
                  </div>
                  
                  {formData.createLogin && (
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-light)' }}>
                      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Password <span style={{ color: 'var(--error-color)' }}>*</span></label>
                          <div className="flex" style={{ gap: '8px' }}>
                            <input type="text" name="password" className="form-input" required={formData.createLogin} value={formData.password} onChange={handleChange} placeholder="Enter or generate password" />
                            <button type="button" className="btn btn-secondary" onClick={() => setFormData({...formData, password: Math.random().toString(36).slice(-8) + 'A1!'})}>
                              Generate
                            </button>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Copy this password to share with the employee.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Employment Type <span style={{ color: 'var(--error-color)' }}>*</span></label>
                  <select name="employmentType" className="form-input" required value={formData.employmentType} onChange={handleChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACTOR">Contractor</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Joining Date <span style={{ color: 'var(--error-color)' }}>*</span></label>
                  <input type="date" name="joiningDate" className="form-input" required value={formData.joiningDate} onChange={handleChange} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Legal Entity</label>
                  <select name="legalEntityId" className="form-input" value={formData.legalEntityId} onChange={handleChange}>
                    <option value="">Select Entity (Optional)</option>
                    {orgData.entities.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Location</label>
                  <select name="locationId" className="form-input" value={formData.locationId} onChange={handleChange}>
                    <option value="">Select Location (Optional)</option>
                    {orgData.locations.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department</label>
                  <select name="departmentId" className="form-input" value={formData.departmentId} onChange={handleChange}>
                    <option value="">Select Department (Optional)</option>
                    {orgData.departments.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Designation</label>
                  <select name="designationId" className="form-input" value={formData.designationId} onChange={handleChange}>
                    <option value="">Select Designation (Optional)</option>
                    {orgData.designations.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Bank Name</label>
                  <input type="text" name="bankName" className="form-input" value={formData.bankName} onChange={handleChange} placeholder="Optional" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Account Number</label>
                  <input type="text" name="accountNumber" className="form-input" value={formData.accountNumber} onChange={handleChange} placeholder="Optional" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">IFSC Code</label>
                  <input type="text" name="ifscCode" className="form-input" value={formData.ifscCode} onChange={handleChange} placeholder="Optional" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Account Type</label>
                  <select name="accountType" className="form-input" value={formData.accountType} onChange={handleChange}>
                    <option value="SAVINGS">Savings</option>
                    <option value="CURRENT">Current</option>
                  </select>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">PAN Number</label>
                  <input type="text" name="panNumber" className="form-input" value={formData.panNumber} onChange={handleChange} placeholder="Optional" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tax Regime</label>
                  <select name="taxRegime" className="form-input" value={formData.taxRegime} onChange={handleChange}>
                    <option value="NEW">New Regime</option>
                    <option value="OLD">Old Regime</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer - Fixed */}
          <div className="modal-footer" style={{ flexShrink: 0, padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-light)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            {step > 1 && (
              <button type="button" className="btn btn-secondary flex items-center gap-2" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : step < 5 ? (
                <>Next <ChevronRight size={16} /></>
              ) : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const EmployeesList = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const { token } = useAuth();
  
  const [orgData, setOrgData] = useState({
    departments: [], locations: [], entities: [], designations: []
  });

  useEffect(() => {
    fetchEmployees();
    fetchOrgData();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await fetchApi('/employees', token);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgData = async () => {
    try {
      const [departments, locations, entities, designations] = await Promise.all([
        fetchApi('/org/departments', token),
        fetchApi('/org/locations', token),
        fetchApi('/org/legal-entities', token),
        fetchApi('/org/designations', token)
      ]);
      setOrgData({ departments, locations, entities, designations });
    } catch (err) {
      console.error('Failed to load org data', err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title mb-1">Employees</h1>
          <p className="text-secondary">Manage employee directory and profiles</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="flex justify-between items-center" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex gap-3">
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                placeholder="Search by name, ID or role..." 
                className="form-input" 
                style={{ paddingLeft: '36px', height: '36px' }}
              />
            </div>
            <button className="btn btn-secondary" style={{ height: '36px', padding: '0 12px' }}>
              <Filter size={16} /> Filters
            </button>
          </div>
          
          <div className="text-small text-secondary">
            Showing {employees.length} employees
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" /></th>
                <th>Employee</th>
                <th>Role & Dept</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: '24px' }}>
                    <div className="flex justify-center items-center gap-2 text-secondary">
                      <Loader2 className="animate-spin" size={20} />
                      Loading employees...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center text-red-500" style={{ padding: '24px' }}>
                    {error}
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-secondary" style={{ padding: '24px' }}>
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
                          <div className="text-small">{emp.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-primary)' }}>{emp.designation?.name || '-'}</div>
                      <div className="text-small">{emp.department?.name || '-'}</div>
                    </td>
                    <td>{emp.location?.name || '-'}</td>
                    <td>{emp.employment?.employmentType || '-'}</td>
                    <td>
                      <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-success' : emp.status === 'ON_LEAVE' ? 'badge-info' : emp.status === 'NOTICE' ? 'badge-warning' : 'badge-neutral'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-ghost" style={{ padding: '6px', color: 'var(--text-secondary)' }}>
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        token={token}
        orgData={orgData}
        onSuccess={() => {
          setShowAddModal(false);
          fetchEmployees();
        }}
      />
    </div>
  );
};

export default EmployeesList;
