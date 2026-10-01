import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, CheckCircle, AlertTriangle, Plug, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PlatformSystemHealth = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('payflow_token');
      const res = await fetch('http://localhost:4000/api/platform/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHealthData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto refresh every 30s
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Database': return <Database size={24} />;
      case 'Server': return <Server size={24} />;
      case 'Activity': return <Activity size={24} />;
      case 'CheckCircle': return <CheckCircle size={24} />;
      case 'Plug': return <Plug size={24} />;
      default: return <Activity size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Operational') return 'text-success bg-green-50 border-green-200';
    if (status === 'Degraded') return 'text-warning bg-orange-50 border-orange-200';
    return 'text-danger bg-red-50 border-red-200';
  };

  return (
    <div className="app-content-inner flex flex-col gap-6" style={{ paddingBottom: '40px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title m-0">System Health</h1>
          <p className="text-secondary mt-1">Real-time status of the Payflow infrastructure and services.</p>
        </div>
        <button 
          className="btn btn-secondary flex items-center gap-2" 
          onClick={fetchHealth}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && !healthData ? (
        <div className="text-center py-12 text-secondary">Loading system health data...</div>
      ) : healthData ? (
        <div className="flex flex-col gap-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`card border ${getStatusColor(healthData.status)}`}>
              <div className="text-sm font-medium opacity-80 mb-1">Overall Status</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {healthData.status === 'Operational' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                {healthData.status}
              </div>
            </div>
            
            <div className="card border border-light">
              <div className="text-sm font-medium text-secondary mb-1">Server Uptime</div>
              <div className="text-2xl font-bold text-primary">
                {Math.floor(healthData.uptime / 3600)}h {Math.floor((healthData.uptime % 3600) / 60)}m
              </div>
            </div>

            <div className="card border border-light">
              <div className="text-sm font-medium text-secondary mb-1">Memory Usage</div>
              <div className="text-2xl font-bold text-primary">
                {healthData.memoryUsage}
              </div>
            </div>

            <div className="card border border-light">
              <div className="text-sm font-medium text-secondary mb-1">CPU Load (1m avg)</div>
              <div className="text-2xl font-bold text-primary">
                {healthData.cpuLoad}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-4">Service Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthData.checks.map((check: any, idx: number) => (
              <div key={idx} className="card border border-light flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  check.status === 'Operational' ? 'bg-green-100 text-success' : 
                  check.status === 'Degraded' ? 'bg-orange-100 text-warning' : 'bg-red-100 text-danger'
                }`}>
                  {getIcon(check.icon)}
                </div>
                <div>
                  <h4 className="font-semibold text-primary">{check.name}</h4>
                  <p className="text-sm text-secondary mt-1">{check.details}</p>
                  <div className={`text-xs font-medium mt-2 inline-block px-2 py-0.5 rounded-full ${
                    check.status === 'Operational' ? 'bg-green-50 text-success border border-green-200' : 
                    check.status === 'Degraded' ? 'bg-orange-50 text-warning border border-orange-200' : 
                    'bg-red-50 text-danger border border-red-200'
                  }`}>
                    {check.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-danger">Failed to fetch health data. Please check if the backend server is running.</div>
      )}
    </div>
  );
};

export default PlatformSystemHealth;
