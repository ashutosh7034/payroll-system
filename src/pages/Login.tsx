import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building, Mail, Eye, EyeOff, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user, data.tenant);
      
      if (data.user.roles.includes('PLATFORM_SUPER_ADMIN')) {
        navigate('/platform/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: 'var(--space-8)' }}>
        
        {/* Branding */}
        <div className="flex flex-col items-center" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="flex items-center justify-center" style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--primary-dark)', color: 'white', marginBottom: 'var(--space-4)' }}>
            <Building size={24} strokeWidth={1.5} />
          </div>
          <h1 className="page-title">PAYFLOW</h1>
          <p className="text-secondary" style={{ marginTop: 'var(--space-1)', fontWeight: 500 }}>Enterprise Payroll Management</p>
        </div>

        {/* Welcome Section */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="card-title" style={{ fontSize: '18px' }}>Welcome back</h2>
          <p className="text-secondary" style={{ marginTop: '2px' }}>Sign in to your account to continue</p>
        </div>

        {/* Error State */}
        {error && (
          <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-3)', borderRadius: '6px', backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', fontSize: 'var(--font-size-secondary)' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          {/* Email */}
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <div className="flex items-center" style={{ position: 'absolute', top: 0, bottom: 0, left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <div className="flex items-center" style={{ position: 'absolute', top: 0, bottom: 0, left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                <Lock size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="flex items-center justify-center"
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  bottom: 0, 
                  right: '4px', 
                  width: '36px', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-tertiary)', 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
            <label className="flex items-center gap-2 text-small text-secondary" style={{ cursor: 'pointer' }}>
              <input type="checkbox" style={{ cursor: 'pointer' }} />
              <span>Remember me</span>
            </label>
            <a href="#" className="text-small" style={{ color: 'var(--primary-dark)', fontWeight: 500, textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary w-full justify-center"
            style={{ height: '42px', marginTop: 'var(--space-1)' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
        </form>

        {/* Footer */}
        <div style={{ marginTop: 'var(--space-8)', textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-6)' }}>
          <p className="text-small text-secondary" style={{ color: 'var(--text-tertiary)' }}>Secure enterprise payroll management</p>
        </div>
        
      </div>
    </div>
  );
};

export default Login;
