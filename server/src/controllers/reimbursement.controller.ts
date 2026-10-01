import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ReimbursementService } from '../services/reimbursement.service';
import { successResponse, errorResponse } from '../utils/response';

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ReimbursementService.createCategory(req.user!.tenantId, req.body);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('REIMBURSEMENT_ERROR', err.message));
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ReimbursementService.getCategories(req.user!.tenantId);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('REIMBURSEMENT_ERROR', err.message));
  }
};

export const submitClaim = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.body.employeeId || (req.user as any).employeeId;
    if (!employeeId) return res.status(400).json(errorResponse('AUTH_ERROR', 'Employee ID missing'));
    const rec = await ReimbursementService.submitClaim(req.user!.tenantId, employeeId, req.body);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('REIMBURSEMENT_ERROR', err.message));
  }
};

export const getClaims = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ReimbursementService.getClaims(req.user!.tenantId, req.query);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('REIMBURSEMENT_ERROR', err.message));
  }
};

export const getMyClaims = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = (req.user as any).employeeId;
    if (!employeeId) return res.status(400).json(errorResponse('AUTH_ERROR', 'Employee ID missing'));
    const rec = await ReimbursementService.getEmployeeClaims(req.user!.tenantId, employeeId);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('REIMBURSEMENT_ERROR', err.message));
  }
};

export const approveClaimHR = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ReimbursementService.approveClaimHR(req.user!.tenantId, req.params.id as string, req.user!.id, req.body.approvedAmount);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('REIMBURSEMENT_ERROR', err.message));
  }
};

export const verifyClaimFinance = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ReimbursementService.verifyClaimFinance(req.user!.tenantId, req.params.id as string, req.user!.id);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('REIMBURSEMENT_ERROR', err.message));
  }
};

export const rejectClaim = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ReimbursementService.rejectClaim(req.user!.tenantId, req.params.id as string, req.user!.id, req.body.reason);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('REIMBURSEMENT_ERROR', err.message));
  }
};
