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
      if (user.roles?.includes('Super Admin') || user.roles?.includes('COMPANY_ADMIN')) {
        return next();
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
        if (ur.role.name === 'Super Admin' || ur.role.name === 'COMPANY_ADMIN') {
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
