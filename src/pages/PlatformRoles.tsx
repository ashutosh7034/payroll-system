import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PlatformRoles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoles(data.data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/permissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPermissions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: any) => {
    setSelectedRole(role);
    const permIds = new Set<string>();
    role.rolePermissions.forEach((rp: any) => permIds.add(rp.permissionId));
    setRolePermissions(permIds);
  };

  const togglePermission = (permId: string) => {
    setRolePermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permId)) {
        newSet.delete(permId);
      } else {
        newSet.add(permId);
      }
      return newSet;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissionIds: Array.from(rolePermissions) })
      });
      if (res.ok) {
        alert('Permissions saved successfully');
        fetchRoles(); // refresh
      } else {
        const d = await res.json();
        alert(d.error?.message || 'Failed to save');
      }
    } catch (err) {
      alert('Error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions logically by prefix, e.g., 'employee.view' -> 'employee'
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    permissions.forEach(p => {
      const prefix = p.name.split('.')[0] || 'other';
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(p);
    });
    return groups;
  }, [permissions]);

  return (
    <div className="app-content-inner flex flex-col gap-6" style={{ paddingBottom: '40px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title m-0">Platform Roles</h1>
          <p className="text-secondary mt-1">Manage permissions for platform-level administrative roles.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-secondary">Loading...</div>
      ) : error ? (
        <div className="text-center py-12 text-danger">Failed to load roles.</div>
      ) : (
        <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
          
          {/* Roles List (Left) */}
          <div className="card w-1/3 p-0 overflow-hidden flex-shrink-0">
            <div className="bg-gray-50 px-4 py-3 border-b border-light font-medium text-secondary">
              Platform Roles
            </div>
            <div className="flex flex-col">
              {roles.map(r => (
                <div 
                  key={r.id}
                  onClick={() => handleRoleSelect(r)}
                  className={`p-4 border-b border-light cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedRole?.id === r.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''}`}
                  style={selectedRole?.id === r.id ? { borderLeftColor: 'var(--primary-color)' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} className={selectedRole?.id === r.id ? 'text-primary' : 'text-secondary'} />
                    <span className={`font-medium ${selectedRole?.id === r.id ? 'text-primary' : ''}`}>
                      {r.name.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <ChevronRightIcon className="text-secondary opacity-50" />
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Editor (Right) */}
          <div className="card flex-1 flex flex-col h-[700px]">
            {selectedRole ? (
              <>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-light shrink-0">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">{selectedRole.name.replace(/_/g, ' ')} Permissions</h2>
                    <p className="text-sm text-secondary">Toggle the access levels for this platform role.</p>
                  </div>
                  <button className="btn btn-primary flex items-center gap-2" onClick={savePermissions} disabled={saving}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-6">
                    {Object.keys(groupedPermissions).map(group => (
                      <div key={group} className="border border-light rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-sm text-secondary uppercase tracking-wider mb-4 border-b border-light pb-2">
                          {group}
                        </h3>
                        <div className="flex flex-col gap-3">
                          {groupedPermissions[group].map(p => {
                            const isChecked = rolePermissions.has(p.id);
                            return (
                              <div key={p.id} className="flex items-start gap-3 cursor-pointer group" onClick={() => togglePermission(p.id)}>
                                <div className={`mt-0.5 ${isChecked ? 'text-primary' : 'text-secondary opacity-40 group-hover:opacity-70'}`}>
                                  {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-primary">{p.name}</div>
                                  {p.description && <div className="text-xs text-secondary mt-0.5">{p.description}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-secondary">
                <Shield size={48} className="opacity-20 mb-4" />
                <p>Select a role from the left to manage permissions.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default PlatformRoles;
