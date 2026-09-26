import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, MoreHorizontal, Plus, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
    panNumber: '', taxRegime: 'NEW'
  });

  if (!isOpen) return null;

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) {
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

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="card-title">Add New Employee</h3>
          <button className="btn-ghost" onClick={onClose}>&times;</button>
        </div>
        
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 text-small text-secondary flex justify-between">
          <span className={step === 1 ? 'font-medium text-primary' : ''}>1. Personal</span>
          <span className={step === 2 ? 'font-medium text-primary' : ''}>2. Employment</span>
          <span className={step === 3 ? 'font-medium text-primary' : ''}>3. Organization</span>
          <span className={step === 4 ? 'font-medium text-primary' : ''}>4. Bank</span>
          <span className={step === 5 ? 'font-medium text-primary' : ''}>5. Tax</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ minHeight: '300px' }}>
            {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}
            
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Employee ID *</label>
                  <input type="text" name="employeeId" className="form-input" required value={formData.employeeId} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input type="text" name="firstName" className="form-input" required value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input type="text" name="lastName" className="form-input" required value={formData.lastName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select name="status" className="form-input" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Employment Type *</label>
                  <select name="employmentType" className="form-input" required value={formData.employmentType} onChange={handleChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACTOR">Contractor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date *</label>
                  <input type="date" name="joiningDate" className="form-input" required value={formData.joiningDate} onChange={handleChange} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Legal Entity</label>
                  <select name="legalEntityId" className="form-input" value={formData.legalEntityId} onChange={handleChange}>
                    <option value="">Select Entity</option>
                    {orgData.entities.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select name="locationId" className="form-input" value={formData.locationId} onChange={handleChange}>
                    <option value="">Select Location</option>
                    {orgData.locations.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select name="departmentId" className="form-input" value={formData.departmentId} onChange={handleChange}>
                    <option value="">Select Department</option>
                    {orgData.departments.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select name="designationId" className="form-input" value={formData.designationId} onChange={handleChange}>
                    <option value="">Select Designation</option>
                    {orgData.designations.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input type="text" name="bankName" className="form-input" value={formData.bankName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input type="text" name="accountNumber" className="form-input" value={formData.accountNumber} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input type="text" name="ifscCode" className="form-input" value={formData.ifscCode} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <select name="accountType" className="form-input" value={formData.accountType} onChange={handleChange}>
                    <option value="SAVINGS">Savings</option>
                    <option value="CURRENT">Current</option>
                  </select>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">PAN Number</label>
                  <input type="text" name="panNumber" className="form-input" value={formData.panNumber} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Regime</label>
                  <select name="taxRegime" className="form-input" value={formData.taxRegime} onChange={handleChange}>
                    <option value="NEW">New Regime</option>
                    <option value="OLD">Old Regime</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer flex justify-between">
            {step > 1 ? (
              <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : step < 5 ? (
                <>Next <ChevronRight size={16} /></>
              ) : 'Complete Profile'}
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
