import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Shield, Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PlatformUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    roleIds: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      // In a real implementation we might fetch only platform-scoped roles
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoles(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles');
    }
  };

  const handleStatusChange = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/users/${id}/status`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', roleIds: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      roleIds: user.userRoles.map((ur: any) => ur.roleId)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('payflow_token');
      
      if (editingUser) {
        const res = await fetch(`http://localhost:4000/api/platform/users/${editingUser.id}/roles`, {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ roles: formData.roleIds })
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchUsers();
        } else {
          const d = await res.json();
          alert(d.error?.message || 'Update failed');
        }
      } else {
        const res = await fetch(`http://localhost:4000/api/platform/users`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: formData.email, 
            password: formData.password,
            roles: formData.roleIds
          })
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchUsers();
        } else {
          const d = await res.json();
          alert(d.error?.message || 'Creation failed');
        }
      }
    } catch (err) {
      alert('Failed to save user');
    }
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="app-content-inner flex flex-col gap-6" style={{ paddingBottom: '40px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title m-0">Platform Users</h1>
          <p className="text-secondary mt-1">Manage users with access to the Platform Super Admin layer.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Platform User
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input 
              type="text" 
              className="form-input pl-10" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-secondary">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-danger">Failed to load platform users.</div>
        ) : (
          <div className="table-responsive">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-secondary">No users found.</td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {u.userRoles.map((ur: any) => (
                          <span key={ur.roleId} className="badge bg-secondary">
                            <Shield size={12} className="mr-1 inline" />
                            {ur.role.name.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {u.userRoles.length === 0 && <span className="text-secondary text-sm">No roles</span>}
                      </div>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge bg-success"><CheckCircle2 size={12} className="mr-1 inline" /> Active</span>
                      ) : (
                        <span className="badge bg-error"><XCircle size={12} className="mr-1 inline" /> Inactive</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn btn-secondary text-sm px-2 py-1 flex items-center gap-1" onClick={() => handleOpenEdit(u)}>
                          <Edit2 size={14} /> Edit Roles
                        </button>
                        <button 
                          className={`btn text-sm px-2 py-1 flex items-center gap-1 ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleStatusChange(u.id, !u.isActive)}
                          disabled={u.id === user?.id}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingUser ? 'Edit User Roles' : 'Create Platform User'}</h2>
              <button className="btn btn-secondary px-2 py-1" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    disabled={!!editingUser}
                    required
                  />
                </div>
                {!editingUser && (
                  <div className="form-group">
                    <label className="form-label">Temporary Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                )}
                
                <div className="form-group mt-2">
                  <label className="form-label mb-2">Assign Platform Roles</label>
                  <div className="flex flex-col gap-2">
                    {roles.length === 0 ? (
                      <div className="text-sm text-secondary">No platform roles available. Please check role configuration.</div>
                    ) : roles.map(r => (
                      <label key={r.id} className="flex items-center gap-2 p-2 border border-light rounded-md cursor-pointer hover:bg-gray-50">
                        <input 
                          type="checkbox" 
                          checked={formData.roleIds.includes(r.id)}
                          onChange={() => toggleRole(r.id)}
                        />
                        <span className="font-medium text-sm">{r.name.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingUser ? 'Save Roles' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformUsers;
