import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PayslipService } from '../services/payslip.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const successResponse = (data: any) => ({ success: true, data });
const errorResponse = (code: string, message: string) => ({ success: false, error: { code, message } });

const getAuthenticatedEmployee = async (tenantId: string, email: string) => {
  const employee = await prisma.employee.findFirst({
    where: { tenantId, email }
  });
  return employee;
};

export const getMyPayslips = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const email = req.user?.email;
    if (!tenantId || !email) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));

    const employee = await getAuthenticatedEmployee(tenantId, email);
    if (!employee) return res.status(404).json(errorResponse('NOT_FOUND', 'Employee profile not found'));

    const payslips = await PayslipService.getEmployeePayslips(tenantId, employee.id);
    res.json(successResponse(payslips));
  } catch (error: any) {
    res.status(500).json(errorResponse('SERVER_ERROR', error.message || 'Internal server error'));
  }
};

export const getMyPayslipById = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const email = req.user?.email;
    const id = req.params.id as string;
    
    if (!tenantId || !email) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));

    const employee = await getAuthenticatedEmployee(tenantId, email);
    if (!employee) return res.status(404).json(errorResponse('NOT_FOUND', 'Employee profile not found'));

    const payslip = await PayslipService.getPayslipById(tenantId, employee.id, id);
    res.json(successResponse(payslip));
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
       return res.status(404).json(errorResponse('NOT_FOUND', 'Payslip not found'));
    }
    res.status(500).json(errorResponse('SERVER_ERROR', error.message || 'Internal server error'));
  }
};

export const downloadMyPayslip = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const email = req.user?.email;
    const id = req.params.id as string;
    
    if (!tenantId || !email) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));

    const employee = await getAuthenticatedEmployee(tenantId, email);
    if (!employee) return res.status(404).json(errorResponse('NOT_FOUND', 'Employee profile not found'));

    const result = await PayslipService.downloadPayslip(tenantId, employee.id, id);
    res.json(successResponse(result));
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
       return res.status(404).json(errorResponse('NOT_FOUND', 'Payslip not found'));
    }
    res.status(500).json(errorResponse('SERVER_ERROR', error.message || 'Internal server error'));
  }
};
