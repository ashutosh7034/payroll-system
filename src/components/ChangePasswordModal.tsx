import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    
    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing password.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setError('');
    setSuccess(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleModalClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', position: 'fixed', inset: 0 }}>
      <div className="modal-content card" style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-modal)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center" style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-secondary" />
            <h2 className="section-title" style={{ margin: 0 }}>Change Password</h2>
          </div>
          <button className="btn-ghost flex items-center justify-center" onClick={handleModalClose} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-5)' }}>
          {success ? (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <CheckCircle2 size={48} style={{ color: 'var(--success-color)', marginBottom: 'var(--space-4)' }} />
              <h3 className="card-title">Password Changed Successfully</h3>
              <p className="text-secondary mt-2">Your password has been securely updated.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-start gap-2" style={{ padding: 'var(--space-3)', borderRadius: '4px', backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', fontSize: 'var(--font-size-secondary)' }}>
                  <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="flex items-center justify-center"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: '4px', top: 0, bottom: 0, width: '36px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0 }}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="flex items-center justify-center"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: '4px', top: 0, bottom: 0, width: '36px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0 }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="flex items-center justify-center"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: '4px', top: 0, bottom: 0, width: '36px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0 }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3" style={{ marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" onClick={handleModalClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
