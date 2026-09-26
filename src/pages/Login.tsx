import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [domain, setDomain] = useState('demo');
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
        body: JSON.stringify({ email, password, domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user, data.tenant);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDemo = async () => {
    setError('');
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/auth/setup', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Setup failed');
      }
      alert('Demo tenant created! You can now log in.');
    } catch (err: any) {
      setError(err.message || 'Failed to setup demo tenant');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="card w-full max-w-[400px]" style={{ padding: 'var(--space-8)' }}>
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ backgroundColor: 'var(--primary-dark)', color: 'white' }}>
            <Building size={24} />
          </div>
          <h1 className="page-title text-center">PAYFLOW</h1>
          <p className="text-secondary text-center mt-2">Enterprise Payroll Management</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', fontSize: 'var(--font-size-secondary)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="domain">Company Domain</label>
            <input
              id="domain"
              type="text"
              className="form-input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. demo"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            style={{ padding: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            className="btn btn-ghost text-small"
            onClick={handleSetupDemo}
          >
            Initialize Demo Tenant
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
