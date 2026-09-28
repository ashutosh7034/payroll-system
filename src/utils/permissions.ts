export const ROLE_PERMISSIONS: Record<string, string[]> = {
  PLATFORM_SUPER_ADMIN: ['platform.manage', 'platform.view'],
  TENANT_SUPER_ADMIN: [
    'organization.manage', 'organization.view', 
    'employee.manage', 'employee.view', 
    'attendance.manage', 'attendance.view',
    'leave.manage', 'leave.view',
    'compensation.manage', 'compensation.view',
    'payroll.manage', 'payroll.run', 'payroll.view', 
    'finance.manage', 'finance.view', 
    'reports.view', 
    'settings.manage'
  ],
  COMPANY_SUPER_ADMIN: [
    'organization.manage', 'organization.view', 
    'employee.manage', 'employee.view', 
    'attendance.manage', 'attendance.view',
    'leave.manage', 'leave.view',
    'compensation.manage', 'compensation.view',
    'payroll.manage', 'payroll.run', 'payroll.view', 
    'finance.manage', 'finance.view', 
    'reports.view', 
    'settings.manage'
  ],
  COMPANY_ADMIN: [
    'organization.manage', 'organization.view', 
    'employee.manage', 'employee.view', 
    'attendance.manage', 'attendance.view',
    'leave.manage', 'leave.view',
    'compensation.manage', 'compensation.view',
    'payroll.manage', 'payroll.run', 'payroll.view', 
    'finance.manage', 'finance.view', 
    'reports.view', 
    'settings.manage'
  ],
  HR: [
    'organization.view', 
    'employee.manage', 'employee.view', 
    'attendance.manage', 'attendance.view', 
    'leave.manage', 'leave.view', 
    'reports.view'
  ],
  PAYROLL: [
    'employee.view', 
    'attendance.view', 
    'leave.view', 
    'compensation.manage', 'compensation.view', 
    'payroll.manage', 'payroll.run', 'payroll.view', 
    'reports.view'
  ],
  PAYROLL_MANAGER: [
    'employee.view', 
    'attendance.view', 
    'leave.view', 
    'compensation.manage', 'compensation.view', 
    'payroll.manage', 'payroll.run', 'payroll.view', 
    'reports.view'
  ],
  FINANCE: [
    'payroll.view', 
    'finance.manage', 'finance.view', 
    'reports.view'
  ],
  COMPLIANCE: [
    'organization.view', 
    'employee.view', 
    'payroll.view', 
    'reports.view'
  ],
  MANAGER: [
    'employee.view', 
    'attendance.view', 
    'leave.view', 
    'reports.view'
  ],
  AUDITOR: [
    'organization.view', 
    'employee.view', 
    'attendance.view', 
    'leave.view', 
    'compensation.view', 
    'payroll.view', 
    'finance.view', 
    'reports.view'
  ],
  EMPLOYEE: [] // Employee self-service doesn't need specific cross-tenant module permissions
};

export const checkPermission = (userRoles: string[], permission: string): boolean => {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  for (const role of userRoles) {
    if (ROLE_PERMISSIONS[role]?.includes(permission)) {
      return true;
    }
  }
  return false;
};
