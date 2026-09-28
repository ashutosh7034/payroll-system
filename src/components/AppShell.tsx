import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';

const AppShell = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.roles?.includes('PLATFORM_SUPER_ADMIN') && (location.pathname === '/dashboard' || location.pathname === '/')) {
      navigate('/platform/dashboard', { replace: true });
    } else if (!user?.roles?.includes('PLATFORM_SUPER_ADMIN') && location.pathname.startsWith('/platform')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location, navigate]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <div className="app-content-wrapper">
          <div className="app-content-inner">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
