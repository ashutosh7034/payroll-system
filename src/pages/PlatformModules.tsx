import React, { useState, useEffect } from 'react';
import { BrainCircuit, Building2, Save, Search, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PlatformModules = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [tenantModules, setTenantModules] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const [tenantsRes, modulesRes] = await Promise.all([
        fetch('http://localhost:4000/api/platform/tenants', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:4000/api/platform/modules', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const tData = await tenantsRes.json();
      const mData = await modulesRes.json();
      
      if (tData.success) setTenants(tData.data);
      if (mData.success) setAvailableModules(mData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = async (tenant: any) => {
    setSelectedTenant(tenant);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/tenants/${tenant.id}/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTenantModules(new Set(data.data));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleModule = (moduleId: string) => {
    setTenantModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const saveModules = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch(`http://localhost:4000/api/platform/tenants/${selectedTenant.id}/modules`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ modules: Array.from(tenantModules) })
      });
      if (res.ok) {
        alert('Modules updated successfully');
      } else {
        const d = await res.json();
        alert(d.error?.message || 'Failed to update modules');
      }
    } catch (err) {
      alert('Error saving modules');
    } finally {
      setSaving(false);
    }
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="app-content-inner flex flex-col gap-6" style={{ paddingBottom: '40px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title m-0">Platform Modules</h1>
          <p className="text-secondary mt-1">Control which application modules are available for each company.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-secondary">Loading...</div>
      ) : (
        <div className="flex gap-6 items-start h-[700px]">
          {/* Tenants Sidebar */}
          <div className="card w-1/3 p-0 flex flex-col h-full overflow-hidden shrink-0">
            <div className="p-4 border-b border-light bg-gray-50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                <input 
                  type="text" 
                  className="form-input pl-9 text-sm" 
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredTenants.length === 0 ? (
                <div className="p-4 text-secondary text-sm text-center">No companies found</div>
              ) : (
                filteredTenants.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => handleSelectTenant(t)}
                    className={`p-4 border-b border-light cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedTenant?.id === t.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''}`}
                    style={selectedTenant?.id === t.id ? { borderLeftColor: 'var(--primary-color)' } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className={selectedTenant?.id === t.id ? 'text-primary' : 'text-secondary'} />
                      <div>
                        <div className={`font-medium ${selectedTenant?.id === t.id ? 'text-primary' : ''}`}>{t.name}</div>
                        <div className="text-xs text-secondary mt-0.5">{t.domain}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Module Editor */}
          <div className="card flex-1 h-full flex flex-col">
            {selectedTenant ? (
              <>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-light shrink-0">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">{selectedTenant.name} Modules</h2>
                    <p className="text-sm text-secondary">Toggle features available to this company.</p>
                  </div>
                  <button className="btn btn-primary flex items-center gap-2" onClick={saveModules} disabled={saving}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-4 auto-rows-max">
                  {availableModules.map(m => {
                    const isEnabled = tenantModules.has(m.id);
                    return (
                      <div 
                        key={m.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${isEnabled ? 'border-primary bg-blue-50/30' : 'border-light hover:border-gray-300'}`}
                        onClick={() => toggleModule(m.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${isEnabled ? 'text-primary' : 'text-secondary opacity-40'}`}>
                            {isEnabled ? <CheckSquare size={20} /> : <Square size={20} />}
                          </div>
                          <div>
                            <div className={`font-medium text-sm ${isEnabled ? 'text-primary' : 'text-gray-700'}`}>{m.name}</div>
                            <div className="text-xs text-secondary mt-1">{m.description}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-secondary">
                <BrainCircuit size={48} className="opacity-20 mb-4" />
                <p>Select a company to configure its available modules.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformModules;
