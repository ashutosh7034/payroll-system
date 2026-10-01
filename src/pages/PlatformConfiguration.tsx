import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe, Shield, ToggleLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PlatformConfiguration = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/configuration', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/configuration', {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Platform configuration saved successfully.');
      } else {
        alert('Failed to save configuration.');
      }
    } catch (err) {
      alert('Error saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  const updateNestedConfig = (section: string, key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (loading || !config) {
    return <div className="text-center py-12 text-secondary">Loading configuration...</div>;
  }

  return (
    <div className="app-content-inner flex flex-col gap-6" style={{ paddingBottom: '40px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title m-0">Platform Configuration</h1>
          <p className="text-secondary mt-1">Global platform settings and defaults applied across all tenants.</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2" 
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* System Defaults */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-light pb-3">
            <Globe size={18} className="text-primary" />
            <h2 className="text-lg font-semibold m-0 text-primary">System Defaults</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Platform Language</label>
              <select 
                className="form-input" 
                value={config.systemDefaults.language}
                onChange={e => updateNestedConfig('systemDefaults', 'language', e.target.value)}
              >
                <option value="en">English (US)</option>
                <option value="en-gb">English (UK)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Timezone</label>
              <select 
                className="form-input" 
                value={config.systemDefaults.timezone}
                onChange={e => updateNestedConfig('systemDefaults', 'timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="form-group">
                <label className="form-label">Fin Year Start Month</label>
                <input 
                  type="number" 
                  min="1" max="12" 
                  className="form-input" 
                  value={config.financialYearDefaults.startMonth}
                  onChange={e => updateNestedConfig('financialYearDefaults', 'startMonth', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fin Year End Month</label>
                <input 
                  type="number" 
                  min="1" max="12" 
                  className="form-input" 
                  value={config.financialYearDefaults.endMonth}
                  onChange={e => updateNestedConfig('financialYearDefaults', 'endMonth', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-light pb-3">
            <Shield size={18} className="text-primary" />
            <h2 className="text-lg font-semibold m-0 text-primary">Security Policies</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Minimum Password Length</label>
              <input 
                type="number" 
                min="8" max="32" 
                className="form-input" 
                value={config.security.passwordMinLength}
                onChange={e => updateNestedConfig('security', 'passwordMinLength', parseInt(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.security.requireSpecialChar}
                  onChange={e => updateNestedConfig('security', 'requireSpecialChar', e.target.checked)}
                />
                <span className="text-sm">Require Special Character (!@#$%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.security.requireNumber}
                  onChange={e => updateNestedConfig('security', 'requireNumber', e.target.checked)}
                />
                <span className="text-sm">Require Number (0-9)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.security.requireUppercase}
                  onChange={e => updateNestedConfig('security', 'requireUppercase', e.target.checked)}
                />
                <span className="text-sm">Require Uppercase Letter</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.security.mfaEnabled}
                  onChange={e => updateNestedConfig('security', 'mfaEnabled', e.target.checked)}
                />
                <span className="text-sm">Enforce Multi-Factor Authentication (Platform-wide)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b border-light pb-3">
            <ToggleLeft size={18} className="text-primary" />
            <h2 className="text-lg font-semibold m-0 text-primary">Feature Flags</h2>
          </div>
          <div className="flex flex-col gap-3">
             <label className="flex items-center justify-between p-3 border border-light rounded-md bg-gray-50 cursor-pointer">
                <span className="font-medium text-sm">Enable Beta Features</span>
                <input 
                  type="checkbox" 
                  className="toggle-checkbox"
                  checked={config.featureFlags.enableBetaFeatures}
                  onChange={e => updateNestedConfig('featureFlags', 'enableBetaFeatures', e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between p-3 border border-light rounded-md bg-gray-50 cursor-pointer">
                <span className="font-medium text-sm">Payflow AI Assistant</span>
                <input 
                  type="checkbox" 
                  className="toggle-checkbox"
                  checked={config.featureFlags.enableAI}
                  onChange={e => updateNestedConfig('featureFlags', 'enableAI', e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between p-3 border border-red-200 rounded-md bg-red-50 cursor-pointer">
                <span className="font-medium text-sm text-danger">Global Maintenance Mode</span>
                <input 
                  type="checkbox" 
                  className="toggle-checkbox"
                  checked={config.featureFlags.maintenanceMode}
                  onChange={e => updateNestedConfig('featureFlags', 'maintenanceMode', e.target.checked)}
                />
              </label>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlatformConfiguration;
