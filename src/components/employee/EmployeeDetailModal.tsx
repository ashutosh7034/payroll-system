import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Clock, FileText, Download, Trash2, User, Building, MapPin, Briefcase, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeDetailModal({ employeeId, onClose, isOpen }: { employeeId: string | null, onClose: () => void, isOpen: boolean }) {
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'history'>('profile');
  const { token } = useAuth();
  
  // Doc Upload
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('ID');
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchEmployee();
    }
  }, [isOpen, employeeId]);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${baseUrl}/employees/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEmployee(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docUrl) return alert('Name and URL required');
    setUploading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${baseUrl}/employees/${employeeId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: docType, name: docName, url: docUrl })
      });
      if (res.ok) {
        setDocName('');
        setDocUrl('');
        fetchEmployee();
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Delete document?')) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${baseUrl}/employees/${employeeId}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEmployee();
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="modal-content" style={{ maxWidth: '800px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        {loading || !employee ? (
          <div className="flex-1 flex items-center justify-center">Loading...</div>
        ) : (
          <>
            <div className="modal-header border-b flex justify-between items-center" style={{ padding: '16px 24px' }}>
              <div className="flex items-center gap-4">
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '18px' }}>
                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h2>
                  <p className="text-sm text-secondary">{employee.employeeId} • {employee.designation?.name || 'No Designation'}</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost" style={{ padding: '4px' }}><X size={20} /></button>
            </div>

            <div className="px-6 border-b flex gap-6">
              <button 
                className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile Overview
              </button>
              <button 
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                onClick={() => setActiveTab('documents')}
              >
                <FileText size={16} /> Documents
              </button>
              <button 
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                onClick={() => setActiveTab('history')}
              >
                <Clock size={16} /> History
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><User size={16} /> Personal Info</h4>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between border-b pb-2"><span className="text-secondary">Email</span> <span>{employee.email}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-secondary">Status</span> <span>{employee.status}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-secondary">PAN</span> <span>{employee.taxProfile?.panNumber || 'N/A'}</span></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Briefcase size={16} /> Employment Info</h4>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between border-b pb-2"><span className="text-secondary">Type</span> <span>{employee.employment?.employmentType}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-secondary">Joining Date</span> <span>{employee.employment?.joiningDate ? format(new Date(employee.employment.joiningDate), 'MMM d, yyyy') : 'N/A'}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-secondary">Department</span> <span>{employee.department?.name || 'N/A'}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-secondary">Location</span> <span>{employee.location?.name || 'N/A'}</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-secondary">Cost Center</span> <span>{employee.costCenter?.name || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="flex flex-col gap-6">
                  <form onSubmit={handleUploadDoc} className="bg-gray-50 p-4 rounded-lg border border-light flex items-end gap-4">
                    <div className="flex-1 form-group mb-0">
                      <label className="form-label text-xs">Document Type</label>
                      <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
                        <option value="ID">Identity Proof</option>
                        <option value="ADDRESS">Address Proof</option>
                        <option value="OFFER_LETTER">Offer Letter</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="flex-1 form-group mb-0">
                      <label className="form-label text-xs">Document Name</label>
                      <input className="form-input" required value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Aadhar Card" />
                    </div>
                    <div className="flex-1 form-group mb-0">
                      <label className="form-label text-xs">URL / Path</label>
                      <input className="form-input" required value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </form>

                  <table className="table w-full text-sm">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Uploaded On</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.documents?.map((d: any) => (
                        <tr key={d.id}>
                          <td><span className="badge badge-neutral">{d.type}</span></td>
                          <td className="font-medium">{d.name}</td>
                          <td className="text-secondary">{format(new Date(d.uploadedAt), 'MMM d, yyyy')}</td>
                          <td className="text-right flex gap-2 justify-end">
                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><Download size={14}/> View</a>
                            <button className="text-danger hover:underline" onClick={() => handleDeleteDoc(d.id)}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                      {!employee.documents?.length && (
                        <tr><td colSpan={4} className="text-center py-4 text-secondary">No documents uploaded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="flex flex-col gap-4">
                  {employee.history?.map((h: any) => (
                    <div key={h.id} className="flex gap-4 p-4 border rounded-lg bg-gray-50">
                      <div className="pt-1">
                        <Clock size={20} className="text-secondary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Changed <span className="font-bold">{h.fieldChanged}</span></div>
                        <div className="text-xs text-secondary mt-1">
                          From: <span className="line-through">{h.oldValue || 'None'}</span> &nbsp;→&nbsp; To: <span className="font-bold text-primary">{h.newValue || 'None'}</span>
                        </div>
                        <div className="text-xs text-tertiary mt-2">
                          On {format(new Date(h.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!employee.history?.length && (
                    <div className="text-center py-4 text-secondary">No history found.</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
