import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantProvisioningService } from '../services/tenant.service';

const prisma = new PrismaClient();

export const getTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { name: { not: 'PAYFLOW_PLATFORM' } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { company, primaryAdmin, secondaryAdmin } = req.body;
    
    // Backwards compatibility for the old basic payload
    if (!company && req.body.name) {
      return res.status(400).json({ success: false, error: { message: 'Invalid payload structure, expected company, primaryAdmin, secondaryAdmin' } });
    }

    const result = await TenantProvisioningService.createTenant({
      company, primaryAdmin, secondaryAdmin
    });
    res.json({ success: true, data: result.tenant });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message || 'Error creating tenant' } });
  }
};

export const getTenantById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        profile: true,
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        },
        employees: {
          select: { id: true, status: true }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ success: false, error: { message: 'Company not found' } });
    }

    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updateTenantStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: { message: 'isActive must be a boolean' } });
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive }
    });
    
    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
export const updateTenantProfile = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { name, profile } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ success: false, error: { message: 'Company not found' } });
    }

    if (name) {
      await prisma.tenant.update({ where: { id: tenantId }, data: { name } });
    }

    if (profile) {
      await prisma.tenantProfile.upsert({
        where: { tenantId },
        create: { tenantId, ...profile },
        update: { ...profile }
      });
    }

    const updatedTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { profile: true }
    });

    res.json({ success: true, data: updatedTenant });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
import bcrypt from 'bcryptjs';

export const resetSuperAdmin = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { userId } = req.body;
    
    // Find the super admin role
    const role = await prisma.role.findFirst({
      where: { name: 'TENANT_SUPER_ADMIN' }
    });

    if (!role) {
      return res.status(404).json({ success: false, error: { message: 'Super admin role not found in system' } });
    }

    // Find the users with that role in the tenant
    const superAdmins = await prisma.userRole.findMany({
      where: {
        roleId: role.id,
        user: { tenantId }
      },
      include: { user: true }
    });

    if (superAdmins.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Super admin user not found for this company' } });
    }

    let targetAdmin = superAdmins[0];
    if (superAdmins.length > 1) {
      if (!userId) {
         return res.status(400).json({ success: false, error: { message: 'Multiple super admins exist. Please provide userId.' } });
      }
      const found = superAdmins.find(sa => sa.userId === userId);
      if (!found) {
         return res.status(404).json({ success: false, error: { message: 'Provided userId is not a super admin for this company' } });
      }
      targetAdmin = found;
    }

    const newPassword = 'Payflow@Reset2026!';
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: targetAdmin.userId },
      data: { passwordHash }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: { tenantId: tenantId, userId: (req as any).user.id, action: 'SUPER_ADMIN_RESET', entity: 'User', entityId: targetAdmin.userId }
    });

    res.json({ success: true, message: 'Super admin password has been reset successfully.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
export const getPlatformDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const totalTenants = await prisma.tenant.count({ where: { name: { not: 'PAYFLOW_PLATFORM' } } });
    const activeTenants = await prisma.tenant.count({ where: { name: { not: 'PAYFLOW_PLATFORM' }, isActive: true } });
    const suspendedTenants = await prisma.tenant.count({ where: { name: { not: 'PAYFLOW_PLATFORM' }, isActive: false } });
    
    const totalUsers = await prisma.user.count({
      where: {
        tenant: {
          name: { not: 'PAYFLOW_PLATFORM' }
        }
      }
    });

    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        tenant: {
          name: { not: 'PAYFLOW_PLATFORM' }
        }
      }
    });
    
    const totalEmployees = await prisma.employee.count();

    const activePayrollRuns = await prisma.payrollRun.count({
      where: {
        status: { in: ['DRAFT', 'CALCULATING', 'PENDING_APPROVAL'] }
      }
    });

    const failedPayrollRuns = await prisma.payrollRun.count({
      where: {
        status: { in: ['EXCEPTION', 'VALIDATION_FAILED'] }
      }
    });

    // Chart Data (Tenants created per month)
    const tenants = await prisma.tenant.findMany({
      where: { name: { not: 'PAYFLOW_PLATFORM' } },
      select: { createdAt: true }
    });

    // Recent Companies
    const recentTenants = await prisma.tenant.findMany({
      where: { name: { not: 'PAYFLOW_PLATFORM' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { users: true, employees: true }
        }
      }
    });

    // Employee Distribution by Company (Top 5)
    const employeesByCompany = await prisma.tenant.findMany({
      where: { name: { not: 'PAYFLOW_PLATFORM' } },
      select: {
        name: true,
        _count: {
          select: { employees: true }
        }
      },
      orderBy: {
        employees: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // System Users by Role
    const userRoles = await prisma.userRole.groupBy({
      by: ['roleId'],
      _count: { userId: true }
    });

    const roles = await prisma.role.findMany();
    const systemUsersByRole = userRoles.map(ur => {
      const role = roles.find(r => r.id === ur.roleId);
      return {
        role: role ? role.name : 'Unknown',
        count: ur._count.userId
      };
    });

    // Recent Activity (Audit Logs)
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        tenant: { select: { name: true } }
      }
    });

    res.json({
      success: true,
      data: {
        kpi: {
          totalTenants,
          activeTenants,
          suspendedTenants,
          totalUsers,
          activeUsers,
          totalEmployees,
          activePayrollRuns,
          failedPayrollRuns
        },
        health: 'Operational',
        tenants,
        recentTenants,
        employeesByCompany,
        systemUsersByRole,
        recentActivity
      }
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch platform metrics' } });
  }
};
