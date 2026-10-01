import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ArrearService } from '../services/arrear.service';
import { successResponse, errorResponse } from '../utils/response';

export const createArrear = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ArrearService.createArrear(req.user!.tenantId, req.body.employeeId, req.body);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('ARREAR_ERROR', err.message));
  }
};

export const getArrears = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ArrearService.getArrears(req.user!.tenantId, req.query);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('ARREAR_ERROR', err.message));
  }
};

export const getMyArrears = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = (req.user as any).employeeId;
    if (!employeeId) return res.status(400).json(errorResponse('AUTH_ERROR', 'Employee ID missing'));
    const rec = await ArrearService.getArrears(req.user!.tenantId, { employeeId });
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('ARREAR_ERROR', err.message));
  }
};

export const approveArrear = async (req: AuthRequest, res: Response) => {
  try {
    const rec = await ArrearService.approveArrear(req.user!.tenantId, req.params.id as string, req.user!.id);
    res.json(successResponse(rec));
  } catch (err: any) {
    res.status(400).json(errorResponse('ARREAR_ERROR', err.message));
  }
};
