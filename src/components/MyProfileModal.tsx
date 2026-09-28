import React from 'react';
import { X, Mail, Phone, Hash, Building2, MapPin, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyProfileModal: React.FC<MyProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, tenant } = useAuth();

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', position: 'fixed', inset: 0 }}>
      <div className="modal-content card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-modal)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center" style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>My Profile</h2>
          <button className="btn-ghost flex items-center justify-center" onClick={onClose} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-6)' }}>
          {/* Header Card */}
          <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="flex items-center justify-center" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-active)', color: 'var(--text-primary)', fontSize: '24px', fontWeight: 600 }}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h3 className="card-title" style={{ fontSize: '18px', margin: 0 }}>{user.firstName} {user.lastName}</h3>
              <p className="text-secondary" style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={14} /> {tenant?.name || 'Platform'}
              </p>
              <div style={{ marginTop: '4px', display: 'inline-flex', padding: '2px 8px', backgroundColor: 'var(--success-bg)', color: 'var(--success-color)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                {user.roles?.[0] || 'EMPLOYEE'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-4)' }}>
            <div>
              <p className="text-small text-tertiary" style={{ marginBottom: '4px' }}>Email Address</p>
              <div className="flex items-center gap-2 text-body">
                <Mail size={16} className="text-secondary" />
                <span>{user.email}</span>
              </div>
            </div>
            
            <div>
              <p className="text-small text-tertiary" style={{ marginBottom: '4px' }}>Phone Number</p>
              <div className="flex items-center gap-2 text-body">
                <Phone size={16} className="text-secondary" />
                <span>N/A</span>
              </div>
            </div>
            
            <div>
              <p className="text-small text-tertiary" style={{ marginBottom: '4px' }}>Employee ID</p>
              <div className="flex items-center gap-2 text-body">
                <Hash size={16} className="text-secondary" />
                <span>N/A</span>
              </div>
            </div>
            
            <div>
              <p className="text-small text-tertiary" style={{ marginBottom: '4px' }}>Location</p>
              <div className="flex items-center gap-2 text-body">
                <MapPin size={16} className="text-secondary" />
                <span>Primary</span>
              </div>
            </div>
            
            <div>
              <p className="text-small text-tertiary" style={{ marginBottom: '4px' }}>Account Status</p>
              <div className="flex items-center gap-2 text-body">
                <CheckCircle size={16} className="text-success" style={{ color: 'var(--success-color)' }} />
                <span>Active</span>
              </div>
            </div>
            
            <div>
              <p className="text-small text-tertiary" style={{ marginBottom: '4px' }}>Last Login</p>
              <div className="flex items-center gap-2 text-body">
                <Clock size={16} className="text-secondary" />
                <span>Just now</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3" style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-app)', borderBottomLeftRadius: 'var(--radius-modal)', borderBottomRightRadius: 'var(--radius-modal)' }}>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
        
      </div>
    </div>
  );
};

export default MyProfileModal;
