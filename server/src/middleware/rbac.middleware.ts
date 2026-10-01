import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requirePermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has the permission directly or via roles
      // For Phase A, since role claims might be in token, check if token has SUPER_ADMIN or specific permission
      if (user.roles?.includes('PLATFORM_SUPER_ADMIN')) {
        return next();
      }

      if (permissionName === 'PLATFORM_SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Requires Platform Admin' });
      }

      if (user.roles?.includes('TENANT_SUPER_ADMIN') || user.roles?.includes('COMPANY_ADMIN')) {
        return next();
      }

      // Auditors have read-only access
      if (user.roles?.includes('AUDITOR') && permissionName.endsWith('.view')) {
        return next();
      }

      // Static role fallback (to match frontend)
      const staticRolePermissions: Record<string, string[]> = {
        HR: ['organization.view', 'employee.manage', 'employee.view', 'attendance.manage', 'attendance.view', 'leave.manage', 'leave.view', 'reports.view'],
        PAYROLL: ['employee.view', 'attendance.view', 'leave.view', 'compensation.manage', 'compensation.view', 'payroll.manage', 'payroll.run', 'payroll.view', 'reports.view'],
        PAYROLL_MANAGER: ['employee.view', 'attendance.view', 'leave.view', 'compensation.manage', 'compensation.view', 'payroll.manage', 'payroll.run', 'payroll.view', 'reports.view'],
        FINANCE: ['payroll.view', 'finance.manage', 'finance.view', 'reports.view'],
        COMPLIANCE: ['organization.view', 'employee.view', 'payroll.view', 'reports.view'],
        MANAGER: ['employee.view', 'attendance.view', 'leave.view', 'reports.view'],
      };

      for (const role of user.roles || []) {
        if (staticRolePermissions[role]?.includes(permissionName)) {
          return next();
        }
      }

      // Query database for permissions if needed, or rely on token.
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!dbUser) return res.status(401).json({ error: 'Unauthorized' });

      let hasPermission = false;
      for (const ur of dbUser.userRoles) {
        if (ur.role.name === 'PLATFORM_SUPER_ADMIN' || ur.role.name === 'TENANT_SUPER_ADMIN' || ur.role.name === 'COMPANY_ADMIN') {
          hasPermission = true;
          break;
        }
        for (const rp of ur.role.permissions) {
          if (rp.permission.name === permissionName) {
            hasPermission = true;
            break;
          }
        }
      }

      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const requireSelfOrPermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Allow if requesting own data (requires employeeId in route params and JWT)
    if (req.params.employeeId && req.params.employeeId === user.employeeId) {
      return next();
    }

    // Otherwise, check regular permissions
    return requirePermission(permissionName)(req, res, next);
  };
};
