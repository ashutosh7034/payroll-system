import React, { useState, useEffect } from 'react';
import { Plug, Save, Key, Link as LinkIcon, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PlatformIntegrations = () => {
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
        if (!data.data.integrations) {
          data.data.integrations = {
            razorpayX: { enabled: false, apiKey: '', apiSecret: '' },
            iciciCIB: { enabled: false, corpId: '', userId: '', urn: '' },
            sendgrid: { enabled: false, apiKey: '' },
            twilio: { enabled: false, accountSid: '', authToken: '' }
          };
        }
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
        alert('Integrations configuration saved successfully.');
      } else {
        alert('Failed to save configuration.');
      }
    } catch (err) {
      alert('Error saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  const updateIntegration = (provider: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [provider]: {
          ...prev.integrations[provider],
          [field]: value
        }
      }
    }));
  };

  if (loading || !config) {
    return <div className="text-center py-12 text-secondary">Loading integrations...</div>;
  }

  const { integrations } = config;

  return (
    <div className="app-content-inner flex flex-col gap-6" style={{ paddingBottom: '40px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title m-0">Platform Integrations</h1>
          <p className="text-secondary mt-1">Configure external providers and adapters for the Payflow platform.</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2" 
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Integrations'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment Providers */}
        <div className="card flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-light pb-3">
            <LinkIcon size={18} className="text-primary" />
            <h2 className="text-lg font-semibold m-0 text-primary">Payment Gateways & Banking</h2>
          </div>
          
          <div className="border border-light rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4 border-b border-light pb-2">
              <h3 className="font-semibold text-primary">RazorpayX</h3>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="toggle-checkbox"
                  checked={integrations.razorpayX.enabled}
                  onChange={e => updateIntegration('razorpayX', 'enabled', e.target.checked)}
                />
              </label>
            </div>
            {integrations.razorpayX.enabled && (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={integrations.razorpayX.apiKey}
                    onChange={e => updateIntegration('razorpayX', 'apiKey', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">API Secret</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={integrations.razorpayX.apiSecret}
                    onChange={e => updateIntegration('razorpayX', 'apiSecret', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border border-light rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4 border-b border-light pb-2">
              <h3 className="font-semibold text-primary">ICICI CIB</h3>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="toggle-checkbox"
                  checked={integrations.iciciCIB.enabled}
                  onChange={e => updateIntegration('iciciCIB', 'enabled', e.target.checked)}
                />
              </label>
            </div>
            {integrations.iciciCIB.enabled && (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">Corporate ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.iciciCIB.corpId}
                    onChange={e => updateIntegration('iciciCIB', 'corpId', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">User ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.iciciCIB.userId}
                    onChange={e => updateIntegration('iciciCIB', 'userId', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URN</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.iciciCIB.urn}
                    onChange={e => updateIntegration('iciciCIB', 'urn', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Communication Providers */}
        <div className="card flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-light pb-3">
            <Plug size={18} className="text-primary" />
            <h2 className="text-lg font-semibold m-0 text-primary">Communication & Notifications</h2>
          </div>
          
          <div className="border border-light rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4 border-b border-light pb-2">
              <h3 className="font-semibold text-primary">SendGrid (Email)</h3>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="toggle-checkbox"
                  checked={integrations.sendgrid.enabled}
                  onChange={e => updateIntegration('sendgrid', 'enabled', e.target.checked)}
                />
              </label>
            </div>
            {integrations.sendgrid.enabled && (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={integrations.sendgrid.apiKey}
                    onChange={e => updateIntegration('sendgrid', 'apiKey', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border border-light rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4 border-b border-light pb-2">
              <h3 className="font-semibold text-primary">Twilio (SMS/WhatsApp)</h3>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="toggle-checkbox"
                  checked={integrations.twilio.enabled}
                  onChange={e => updateIntegration('twilio', 'enabled', e.target.checked)}
                />
              </label>
            </div>
            {integrations.twilio.enabled && (
              <div className="flex flex-col gap-3">
                <div className="form-group">
                  <label className="form-label">Account SID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={integrations.twilio.accountSid}
                    onChange={e => updateIntegration('twilio', 'accountSid', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Auth Token</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={integrations.twilio.authToken}
                    onChange={e => updateIntegration('twilio', 'authToken', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlatformIntegrations;
