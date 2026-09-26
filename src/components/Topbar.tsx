import React from 'react';
import { Search, Bell, HelpCircle, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <header className="app-header">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            placeholder="Search employees, payroll runs, reports..." 
            className="form-input" 
            style={{ paddingLeft: '36px', height: '36px', fontSize: '13px' }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="btn-ghost" style={{ padding: '8px', color: 'var(--text-secondary)' }}>
          <HelpCircle size={18} />
        </button>
        <button className="btn-ghost" style={{ padding: '8px', color: 'var(--text-secondary)', position: 'relative' }}>
          <Bell size={18} />
          <span style={{ position: 'absolute', top: '8px', right: '8px', width: '6px', height: '6px', backgroundColor: 'var(--error-color)', borderRadius: '50%' }}></span>
        </button>
        
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-light)', margin: '0 8px' }}></div>
        
        <div className="flex items-center gap-2 text-secondary" style={{ fontSize: '13px', fontWeight: 500 }}>
          <div className="flex flex-col items-end mr-2">
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.firstName} {user?.lastName}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{tenant?.name}</span>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-active border border-light">
            <UserIcon size={16} />
          </div>
          
          <button 
            onClick={handleLogout}
            className="btn-ghost ml-2" 
            style={{ padding: '8px', color: 'var(--text-secondary)' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
