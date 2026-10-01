import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PayslipService } from '../services/payslip.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const successResponse = (data: any) => ({ success: true, data });
const errorResponse = (code: string, message: string) => ({ success: false, error: { code, message } });

const checkPayslipAccess = async (req: AuthRequest, requestedEmployeeId?: string) => {
  const tenantId = req.user?.tenantId;
  const email = req.user?.email;
  const roles = req.user?.roles || [];
  
  if (!tenantId || !email) return { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };

  // If user has payroll.view permission (or HR/PAYROLL role), they can access any payslip in their tenant
  const isAdmin = roles.includes('HR') || roles.includes('FINANCE') || roles.includes('PAYROLL_MANAGER') || roles.includes('TENANT_SUPER_ADMIN');

  let employee = null;
  if (!isAdmin) {
    employee = await prisma.employee.findFirst({
      where: { tenantId, email }
    });
    if (!employee) return { error: { code: 'NOT_FOUND', message: 'Employee profile not found' } };
    
    // If they requested a specific employeeId and it doesn't match theirs, deny
    if (requestedEmployeeId && employee.id !== requestedEmployeeId) {
      return { error: { code: 'FORBIDDEN', message: 'Access denied' } };
    }
  }

  return { tenantId, isAdmin, employee };
};

export const getMyPayslips = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, isAdmin, employee, error } = await checkPayslipAccess(req);
    if (error) return res.status(error.code === 'UNAUTHORIZED' ? 401 : error.code === 'NOT_FOUND' ? 404 : 403).json(errorResponse(error.code, error.message));

    if (isAdmin && !employee) {
      return res.json(successResponse([]));
    }

    const payslips = await PayslipService.getEmployeePayslips(tenantId, employee!.id);
    res.json(successResponse(payslips));
  } catch (error: any) {
    res.status(500).json(errorResponse('SERVER_ERROR', error.message || 'Internal server error'));
  }
};

export const getMyPayslipById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { tenantId, isAdmin, employee, error } = await checkPayslipAccess(req);
    if (error) return res.status(403).json(errorResponse(error.code, error.message));

    let payslip;
    if (isAdmin) {
      payslip = await prisma.payslip.findFirst({
        where: { id, tenantId }
      });
    } else {
      payslip = await PayslipService.getPayslipById(tenantId, employee!.id, id);
    }
    
    if (!payslip) return res.status(404).json(errorResponse('NOT_FOUND', 'Payslip not found'));
    res.json(successResponse(payslip));
  } catch (error: any) {
    res.status(500).json(errorResponse('SERVER_ERROR', error.message || 'Internal server error'));
  }
};

export const downloadMyPayslip = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { tenantId, isAdmin, employee, error } = await checkPayslipAccess(req);
    if (error) return res.status(403).json(errorResponse(error.code, error.message));

    let result;
    if (isAdmin) {
      const payslip = await prisma.payslip.findFirst({ where: { id, tenantId } });
      if (!payslip) return res.status(404).json(errorResponse('NOT_FOUND', 'Payslip not found'));
      result = await PayslipService.downloadPayslip(tenantId, payslip.employeeId, id);
    } else {
      result = await PayslipService.downloadPayslip(tenantId, employee!.id, id);
    }
    
    res.json(successResponse(result));
  } catch (error: any) {
    res.status(500).json(errorResponse('SERVER_ERROR', error.message || 'Internal server error'));
  }
};
