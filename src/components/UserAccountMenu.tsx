import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User as UserIcon, LockKeyhole, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import MyProfileModal from './MyProfileModal';
import ChangePasswordModal from './ChangePasswordModal';

const UserAccountMenu = () => {
  const { user, tenant, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Close dropdown on navigation
  useEffect(() => {
    return () => setIsOpen(false);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const getInitials = () => {
    return `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`;
  };

  const getRoleInitials = () => {
    const role = user?.roles?.[0] || 'EMPLOYEE';
    if (role === 'PLATFORM_SUPER_ADMIN') return 'PA';
    if (role === 'COMPANY_SUPER_ADMIN' || role === 'TENANT_SUPER_ADMIN') return 'SA';
    if (role === 'HR') return 'HR';
    if (role === 'PAYROLL_MANAGER') return 'PM';
    if (role === 'FINANCE') return 'FI';
    if (role === 'COMPLIANCE') return 'CO';
    if (role === 'MANAGER') return 'MGR';
    return 'SE';
  };

  const formatRoleName = () => {
    const role = user?.roles?.[0] || 'EMPLOYEE';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <>
      <div ref={menuRef} style={{ marginLeft: '16px', position: 'relative' }}>
        <button 
          className="flex items-center gap-3 bg-transparent border-none cursor-pointer"
          style={{ padding: '4px 8px', borderRadius: '6px', transition: 'background-color 0.2s ease' }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open account menu"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center justify-center" style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-active)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
            {getRoleInitials()}
          </div>
          
          <div className="flex flex-col items-start text-left ml-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {formatRoleName()}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: '1.2' }}>
              {tenant?.name || 'Platform Admin'}
            </span>
          </div>

          <ChevronDown size={16} className="text-secondary ml-1" style={{ color: 'var(--text-tertiary)' }} />
        </button>

        {isOpen && (
          <div 
            role="menu"
            className="bg-surface card" 
            style={{ 
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)', 
              width: '260px', 
              padding: '0', 
              boxShadow: 'var(--shadow-lg)', 
              borderRadius: 'var(--radius-card)', 
              zIndex: 1000,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-app)' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-dark)', color: 'white', fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>
                  {getInitials()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ padding: 'var(--space-2) 0' }}>
              <button 
                role="menuitem"
                className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer"
                style={{ padding: 'var(--space-2) var(--space-4)', fontSize: '13px', color: 'var(--text-primary)', transition: 'background-color 0.2s', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => {
                  setIsOpen(false);
                  setShowProfileModal(true);
                }}
              >
                <UserIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                My Profile
              </button>
              
              <button 
                role="menuitem"
                className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer"
                style={{ padding: 'var(--space-2) var(--space-4)', fontSize: '13px', color: 'var(--text-primary)', transition: 'background-color 0.2s', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => {
                  setIsOpen(false);
                  setShowPasswordModal(true);
                }}
              >
                <LockKeyhole size={16} style={{ color: 'var(--text-secondary)' }} />
                Change Password
              </button>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-light)', padding: 'var(--space-2) 0' }}>
              <button 
                role="menuitem"
                className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer"
                style={{ padding: 'var(--space-2) var(--space-4)', fontSize: '13px', color: 'var(--error-color)', transition: 'background-color 0.2s', textAlign: 'left' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--error-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <MyProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </>
  );
};

export default UserAccountMenu;
