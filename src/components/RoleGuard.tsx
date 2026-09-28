import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { checkPermission } from '../utils/permissions';

interface RoleGuardProps {
  allowedRoles?: string[];
  forbidEmployeeOnly?: boolean;
  requiredPermission?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, forbidEmployeeOnly, requiredPermission }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const userRoles = user.roles || [];

  const isPlatformAdmin = userRoles.includes('PLATFORM_SUPER_ADMIN');
  const isEmployeeOnly = !isPlatformAdmin && !userRoles.some(r => ['TENANT_SUPER_ADMIN', 'COMPANY_SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'PAYROLL', 'PAYROLL_MANAGER', 'FINANCE', 'COMPLIANCE', 'MANAGER', 'AUDITOR'].includes(r)) && userRoles.includes('EMPLOYEE');

  // Specific Permission check (New)
  if (requiredPermission) {
    if (!checkPermission(userRoles, requiredPermission) && !isPlatformAdmin) {
      return <Navigate to={isPlatformAdmin ? "/platform/dashboard" : "/dashboard"} replace />;
    }
  }

  // If a route explicitly forbids employee-only access
  if (forbidEmployeeOnly && isEmployeeOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  // If a route specifies exact roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = userRoles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      // Send them to their appropriate dashboard
      return <Navigate to={isPlatformAdmin ? "/platform/dashboard" : "/dashboard"} replace />;
    }
  }

  return <Outlet />;
};

export default RoleGuard;
