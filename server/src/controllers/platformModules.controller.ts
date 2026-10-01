import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List of all available enterprise modules in Payflow
const AVAILABLE_MODULES = [
  { id: 'PAYROLL', name: 'Payroll Engine', description: 'Core payroll calculation and processing' },
  { id: 'ATTENDANCE', name: 'Attendance', description: 'Time tracking, shifts, and punches' },
  { id: 'LEAVE', name: 'Leave Administration', description: 'Leave policies, requests, and balances' },
  { id: 'LOANS', name: 'Loans & Advances', description: 'Employee loan scheduling and recovery' },
  { id: 'REIMBURSEMENTS', name: 'Reimbursements', description: 'Expense claims and approvals' },
  { id: 'TAX', name: 'Tax & Statutory', description: 'TDS, PF, ESI, and statutory compliance' },
  { id: 'REPORTS', name: 'Advanced Reports', description: 'Enterprise reporting and analytics' },
  { id: 'ACCOUNTING', name: 'Accounting / GL', description: 'General ledger mapping and journals' },
  { id: 'PAYMENTS', name: 'Payments', description: 'Bank integrations and automated payouts' },
  { id: 'ESS', name: 'Employee Self Service', description: 'Employee portal access' },
];

export const getPlatformModules = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: AVAILABLE_MODULES });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const getTenantModules = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { enabledModules: true } as any as any
    });

    if (!tenant) {
      return res.status(404).json({ success: false, error: { message: 'Tenant not found' } });
    }

    // Default to basic modules if enabledModules is somehow undefined or empty
    const modules = (tenant as any).enabledModules && (tenant as any).enabledModules.length > 0 
      ? (tenant as any).enabledModules 
      : ['PAYROLL', 'ESS'];

    res.json({ success: true, data: modules });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updateTenantModules = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { modules } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ success: false, error: { message: 'Tenant not found' } });
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { enabledModules: modules } as any as any
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: (req as any).user.id,
        action: 'UPDATE_MODULES',
        entity: 'Tenant',
        entityId: tenantId,
        details: { modules }
      }
    });

    res.json({ success: true, message: 'Tenant modules updated successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
