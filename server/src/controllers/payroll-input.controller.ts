import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PayrollRunService } from '../services/payroll-run.service';

const prisma = new PrismaClient();

// --- PAYROLL INPUTS ---

export const getPayrollInputs = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const inputs = await prisma.payrollInput.findMany({ where: { tenantId } });
    res.json({ success: true, data: inputs });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const createPayrollInput = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { employeeId, inputType, amount, payrollPeriodMonth, payrollPeriodYear, remarks } = req.body;

    await PayrollRunService.checkPeriodLock(tenantId, payrollPeriodMonth, payrollPeriodYear);

    const input = await prisma.$transaction(async (tx) => {
      // Period lock check can go here in Phase D. Currently just create.
      

      const newInput = await tx.payrollInput.create({
        data: { tenantId, employeeId, inputType, amount, payrollPeriodMonth, payrollPeriodYear, remarks, status: 'APPROVED' }
      });

      await tx.auditLog.create({
        data: { tenantId, userId, action: 'CREATE', entity: 'PayrollInput', entityId: newInput.id, newValue: JSON.stringify({ amount, inputType }) }
      });

      return newInput;
    });

    res.status(201).json({ success: true, data: input });
  } catch (error: any) {
    if (error.message === 'PAYROLL_PERIOD_LOCKED') {
      return res.status(400).json({ success: false, error: { code: 'PERIOD_LOCKED', message: 'Payroll period is locked' } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// --- OVERTIME ---

export const createOvertime = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { employeeId, date, hours, rateMultiplier, remarks, payrollPeriodMonth, payrollPeriodYear } = req.body;

    if (payrollPeriodMonth && payrollPeriodYear) await PayrollRunService.checkPeriodLock(tenantId, payrollPeriodMonth, payrollPeriodYear);

    if (hours < 0) return res.status(400).json({ success: false, error: { code: 'INVALID_HOURS', message: 'Hours cannot be negative' } });

    const overtime = await prisma.$transaction(async (tx) => {
      const ot = await tx.overtime.create({
        data: { tenantId, employeeId, date: new Date(date), hours, rateMultiplier: rateMultiplier || 1.0, remarks, payrollPeriodMonth, payrollPeriodYear, status: 'PENDING' }
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'CREATE', entity: 'Overtime', entityId: ot.id, newValue: JSON.stringify({ hours, date }) }
      });
      return ot;
    });
    res.status(201).json({ success: true, data: overtime });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// --- REIMBURSEMENTS ---

export const createReimbursement = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { employeeId, category, amount, claimDate, remarks, payrollPeriodMonth, payrollPeriodYear } = req.body;

    if (payrollPeriodMonth && payrollPeriodYear) await PayrollRunService.checkPeriodLock(tenantId, payrollPeriodMonth, payrollPeriodYear);

    const claim = await prisma.reimbursement.create({
      data: { tenantId, employeeId, category, amount, claimDate: new Date(claimDate), remarks, payrollPeriodMonth, payrollPeriodYear, status: 'PENDING' }
    });
    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// --- LOANS ---

export const createLoan = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { employeeId, principalAmount, installmentAmount, startDate } = req.body;

    const loan = await prisma.loan.create({
      data: { tenantId, employeeId, principalAmount, outstandingAmount: principalAmount, installmentAmount, startDate: new Date(startDate), status: 'ACTIVE' }
    });
    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};
