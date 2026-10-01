import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlatformRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      where: {
        name: {
          in: ['PLATFORM_SUPER_ADMIN', 'AUDITOR']
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    res.json({ success: true, data: roles });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: permissions });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const roleId = req.params.roleId as string;
    const { permissionIds } = req.body;

    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({ success: false, error: { message: 'Role not found' } });
    }

    if (role.name !== 'PLATFORM_SUPER_ADMIN' && role.name !== 'AUDITOR') {
      return res.status(403).json({ success: false, error: { message: 'Cannot modify non-platform roles from here' } });
    }

    // Update permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    await prisma.rolePermission.createMany({
      data: permissionIds.map((permId: string) => ({
        roleId,
        permissionId: permId
      }))
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: (req as any).user.tenantId, // Should be platform tenant
        userId: (req as any).user.id,
        action: 'UPDATE_ROLE_PERMISSIONS',
        entity: 'Role',
        entityId: roleId,
        details: { permissionIds }
      }
    });

    res.json({ success: true, message: 'Role permissions updated successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

