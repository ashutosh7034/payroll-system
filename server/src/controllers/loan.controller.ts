import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LoanService } from '../services/loan.service';
import { successResponse, errorResponse } from '../utils/response';

export const createLoanType = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await LoanService.createLoanType(req.user!.tenantId, req.body);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('LOAN_TYPE_ERROR', err.message));
  }
};

export const getLoanTypes = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await LoanService.getLoanTypes(req.user!.tenantId);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('LOAN_TYPE_ERROR', err.message));
  }
};

export const requestLoan = async (req: AuthRequest, res: Response) => {
  try {
    // ESS route passes employeeId via body or we fetch from user mapping
    const employeeId = req.body.employeeId || (req.user as any).employeeId;
    if (!employeeId) return res.status(400).json(errorResponse('AUTH_ERROR', 'Employee ID missing'));
    const rec = await LoanService.requestLoan(req.user!.tenantId, employeeId, req.body);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('LOAN_REQUEST_ERROR', err.message));
  }
};

export const getLoans = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await LoanService.getLoans(req.user!.tenantId, req.query);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('LOAN_FETCH_ERROR', err.message));
  }
};

export const getMyLoans = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = (req.user as any).employeeId;
    if (!employeeId) return res.status(400).json(errorResponse('AUTH_ERROR', 'Employee ID missing'));
    const rec = await LoanService.getEmployeeLoans(req.user!.tenantId, employeeId);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('LOAN_FETCH_ERROR', err.message));
  }
};

export const approveLoan = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await LoanService.approveLoan(req.user!.tenantId, req.params.id as string, req.user!.id);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('LOAN_APPROVAL_ERROR', err.message));
  }
};

export const rejectLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const rec = await LoanService.rejectLoan(req.user!.tenantId, req.params.id as string, req.user!.id, reason);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('LOAN_APPROVAL_ERROR', err.message));
  }
};
