import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import UserAccountMenu from './UserAccountMenu';

const Topbar = () => {
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
      
      <div className="flex items-center gap-2">
        <button className="btn-ghost flex items-center justify-center" style={{ padding: '8px', color: 'var(--text-secondary)' }}>
          <HelpCircle size={18} />
        </button>
        <button className="btn-ghost flex items-center justify-center" style={{ padding: '8px', color: 'var(--text-secondary)', position: 'relative' }}>
          <Bell size={18} />
          <span style={{ position: 'absolute', top: '8px', right: '8px', width: '6px', height: '6px', backgroundColor: 'var(--error-color)', borderRadius: '50%' }}></span>
        </button>
        
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-light)', margin: '0 8px' }}></div>
        
        <UserAccountMenu />
      </div>
    </header>
  );
};

export default Topbar;
