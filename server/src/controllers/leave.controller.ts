import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Leave Policies
export const getLeavePolicies = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const policies = await prisma.leavePolicy.findMany({ where: { tenantId } });
    res.json({ success: true, data: policies });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const createLeavePolicy = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { name, type, daysPerYear, canCarryForward, maxCarryForward, isEncashable, maxEncashment } = req.body;

    const policy = await prisma.leavePolicy.create({
      data: { tenantId, name, type, daysPerYear, canCarryForward, maxCarryForward, isEncashable, maxEncashment }
    });
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// Leave Balance & Requests
export const getEmployeeLeaveBalance = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const employeeId = req.params.employeeId as string;
    const year = parseInt(req.params.year as string) || new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year, employee: { tenantId } },
      include: { policy: true }
    });
    res.json({ success: true, data: balances });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const employeeId = req.params.employeeId as string;
    const { leavePolicyId, startDate, endDate, days, reason } = req.body;

    // Validate balance
    const year = new Date(startDate).getFullYear();
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leavePolicyId, year }
    });

    if (!balance || balance.balance < days) {
      return res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient leave balance' } });
    }

    const request = await prisma.leaveRequest.create({
      data: { employeeId, leavePolicyId, startDate: new Date(startDate), endDate: new Date(endDate), days, reason, status: 'PENDING' }
    });

    // Audit
    await prisma.auditLog.create({
      data: { tenantId, userId: (req as any).user.id, action: 'CREATE', entity: 'LeaveRequest', entityId: request.id, newValue: JSON.stringify({ startDate, days }) }
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const reviewLeaveRequest = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const requestId = req.params.requestId as string;
    const { status, remarks } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be APPROVED or REJECTED' } });
    }

    if (status === 'REJECTED' && !remarks) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_REMARKS', message: 'Rejection requires remarks' } });
    }

    const request = await prisma.leaveRequest.findFirst({ where: { id: requestId, employee: { tenantId } } });
    if (!request || request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Request is not pending or not found' } });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status, remarks, approverId: userId, approvedAt: new Date() }
      });

      if (status === 'APPROVED') {
        const year = request.startDate.getFullYear();
        const balance = await tx.leaveBalance.findFirst({
          where: { employeeId: request.employeeId, leavePolicyId: request.leavePolicyId, year }
        });
        
        if (balance && balance.balance >= request.days) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { consumed: balance.consumed + request.days, balance: balance.balance - request.days }
          });
        } else {
          throw new Error('Insufficient balance detected during approval');
        }
      }

      await tx.auditLog.create({
        data: { tenantId, userId, action: 'UPDATE', entity: 'LeaveRequest', entityId: requestId, newValue: JSON.stringify({ status, remarks }) }
      });

      return updated;
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'Insufficient balance detected during approval') {
      return res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_BALANCE', message: error.message } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const getEmployeeLeaveRequests = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const employeeId = req.params.employeeId;
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId, employee: { tenantId } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const getAllLeaveRequests = async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const requests = await prisma.leaveRequest.findMany({
      where: { employee: { tenantId } },
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};
