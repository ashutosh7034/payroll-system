import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PayrollRunService } from '../services/payroll-run.service';

const prisma = new PrismaClient();

export const getTimesheets = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const employeeId = req.query.employeeId ? String(req.query.employeeId) : undefined;
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;

    const timesheets = await prisma.timesheet.findMany({ where, orderBy: { date: 'desc' } });
    res.json({ success: true, data: timesheets });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const createTimesheet = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { employeeId, date, projectId, taskId, hours, overtimeHours } = req.body;
    
    const tsDate = new Date(date);
    await PayrollRunService.checkPeriodLock(tenantId, tsDate.getMonth() + 1, tsDate.getFullYear());

    const timesheet = await prisma.$transaction(async (tx) => {
      const ts = await tx.timesheet.create({
        data: { tenantId, employeeId, date: new Date(date), projectId, taskId, hours, overtimeHours, status: 'PENDING' }
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'CREATE', entity: 'Timesheet', entityId: ts.id, newValue: JSON.stringify({ hours, overtimeHours, date }) }
      });
      return ts;
    });

    res.status(201).json({ success: true, data: timesheet });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const approveTimesheet = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const id = req.params.id as string;
    const { status } = req.body; // APPROVED, REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
       return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status' } });
    }

    const timesheet = await prisma.$transaction(async (tx) => {
      const ts = await tx.timesheet.update({
        where: { id },
        data: { status }
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'UPDATE', entity: 'Timesheet', entityId: ts.id, newValue: JSON.stringify({ status }) }
      });
      return ts;
    });

    res.json({ success: true, data: timesheet });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};
