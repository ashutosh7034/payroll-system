import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search } from 'lucide-react';

export default function OrganizationCostCenters({ 
  costCenters, 
  canManage, 
  onRefresh 
}: { 
  costCenters: any[], 
  canManage: boolean, 
  onRefresh: () => void 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();

  const filtered = costCenters.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || (e.code && e.code.toLowerCase().includes(searchQuery.toLowerCase())));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const isUpdate = !!editingItem.id;
      const url = isUpdate ? `${baseUrl}/org/cost-centers/${editingItem.id}` : `${baseUrl}/org/cost-centers`;
      
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingItem)
      });
      if (res.ok) {
        setModalOpen(false);
        onRefresh();
      }
    } catch (err) {
      alert('Error saving cost center');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cost center?')) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      await fetch(`${baseUrl}/org/cost-centers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onRefresh();
    } catch (err) {
      alert('Error deleting');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
          <input type="text" className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search cost centers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditingItem({ isActive: true }); setModalOpen(true); }}>
            <Plus size={16} /> Add Cost Center
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table w-full text-sm">
          <thead>
            <tr>
              <th>Cost Center Code</th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id}>
                <td className="font-mono text-xs">{l.code}</td>
                <td className="font-medium text-primary">{l.name}</td>
                <td className="text-secondary">{l.description || 'N/A'}</td>
                <td>
                  <span className={`badge ${l.isActive ? 'bg-success text-success' : 'bg-neutral text-secondary'}`}>
                    {l.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {canManage && (
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex gap-2 justify-end">
                      <button className="text-primary hover:underline text-xs" onClick={() => { setEditingItem(l); setModalOpen(true); }}>Edit</button>
                      <button className="text-danger hover:underline text-xs" onClick={() => handleDelete(l.id)}>Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-secondary">No cost centers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && editingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold">{editingItem.id ? 'Edit Cost Center' : 'Add Cost Center'}</h2>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body flex flex-col gap-4">
                <div className="form-group mb-0">
                  <label className="form-label text-xs">Cost Center Name *</label>
                  <input required className="form-input" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label text-xs">Code *</label>
                  <input required className="form-input font-mono" value={editingItem.code || ''} onChange={e => setEditingItem({...editingItem, code: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label text-xs">Description</label>
                  <input className="form-input" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label text-xs">Status</label>
                  <select className="form-select" value={editingItem.isActive ? 'true' : 'false'} onChange={e => setEditingItem({...editingItem, isActive: e.target.value === 'true'})}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
