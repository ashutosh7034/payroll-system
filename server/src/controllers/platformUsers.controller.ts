import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getPlatformUsers = async (req: Request, res: Response) => {
  try {
    const platformTenant = await prisma.tenant.findFirst({
      where: { name: 'PAYFLOW_PLATFORM' }
    });

    const users = await prisma.user.findMany({
      where: { tenantId: platformTenant!.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    res.json({ success: true, data: users });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const createPlatformUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, roles } = req.body;
    
    const platformTenant = await prisma.tenant.findFirst({
      where: { name: 'PAYFLOW_PLATFORM' }
    });

    if (!platformTenant) {
      return res.status(500).json({ success: false, error: { message: 'Platform tenant not found' } });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: platformTenant.id,
          email: email
        }
      }
    });
    if (existingUser) {
      return res.status(400).json({ success: false, error: { message: 'User with this email already exists' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email,
        passwordHash: passwordHash,
        firstName: firstName || 'Platform',
        lastName: lastName || 'User',
        isActive: true,
        tenant: {
          connect: { id: platformTenant.id }
        },
        userRoles: {
          create: roles.map((roleId: string) => ({
            role: { connect: { id: roleId } }
          }))
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: platformTenant.id,
        userId: (req as any).user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: newUser.id,
        details: { email, roles }
      }
    });

    const { passwordHash: _, ...sanitizedUser } = newUser;
    res.json({ success: true, data: sanitizedUser });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updatePlatformUserStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { isActive } = req.body;

    const platformTenant = await prisma.tenant.findFirst({
      where: { name: 'PAYFLOW_PLATFORM' }
    });

    const userToUpdate = await prisma.user.findFirst({
      where: { id: userId, tenantId: platformTenant!.id }
    });

    if (!userToUpdate) {
      return res.status(404).json({ success: false, error: { message: 'Platform user not found' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: platformTenant!.id,
        userId: (req as any).user.id,
        action: 'UPDATE_STATUS',
        entity: 'User',
        entityId: updatedUser.id,
        details: { isActive }
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updatePlatformUserRoles = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { roles } = req.body;

    const platformTenant = await prisma.tenant.findFirst({
      where: { name: 'PAYFLOW_PLATFORM' }
    });

    const userToUpdate = await prisma.user.findFirst({
      where: { id: userId, tenantId: platformTenant!.id }
    });

    if (!userToUpdate) {
      return res.status(404).json({ success: false, error: { message: 'Platform user not found' } });
    }

    // Delete existing roles
    await prisma.userRole.deleteMany({
      where: { userId: userId }
    });

    // Create new roles
    await prisma.userRole.createMany({
      data: roles.map((roleId: string) => ({
        userId: userId,
        roleId
      }))
    });

    await prisma.auditLog.create({
      data: {
        tenantId: platformTenant!.id,
        userId: (req as any).user.id,
        action: 'UPDATE_ROLES',
        entity: 'User',
        entityId: userId,
        details: { roles }
      }
    });

    res.json({ success: true, message: 'Roles updated successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
