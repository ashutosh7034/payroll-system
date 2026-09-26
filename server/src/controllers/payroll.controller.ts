import { Request, Response } from 'express';
import { PayrollRunService } from '../services/payroll-run.service';
import { PayrollEngine } from '../services/payroll.engine';

export const createRun = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const month = parseInt(req.body.month);
    const year = parseInt(req.body.year);

    const run = await PayrollRunService.createRun(tenantId, month, year, userId);
    res.status(201).json({ success: true, data: run });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE_RUN', message: error.message } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const calculateRun = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const runId = req.params.id as string;
    
    // Asynchronous calculation can be run in the background. Here we await it for simplicity.
    await PayrollEngine.calculateRun(tenantId, runId);
    
    const run = await PayrollRunService.getRunById(tenantId, runId);
    res.json({ success: true, data: run });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CALCULATION_ERROR', message: error.message } });
  }
};

export const getPayrollRuns = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const runs = await PayrollRunService.getRuns(tenantId);
    res.json({ success: true, data: runs });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const getRunById = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const run = await PayrollRunService.getRunById(tenantId, req.params.id as string);
    if (!run) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Run not found' } });
    
    res.json({ success: true, data: run });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const approveRun = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const runId = req.params.id as string;
    const run = await PayrollRunService.approveRun(tenantId, runId, userId);
    res.json({ success: true, data: run });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'APPROVAL_ERROR', message: error.message } });
  }
};

export const lockRun = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const runId = req.params.id as string;
    const run = await PayrollRunService.lockRun(tenantId, runId, userId);
    res.json({ success: true, data: run });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'LOCK_ERROR', message: error.message } });
  }
};

export const finalizeRun = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const runId = req.params.id as string;
    const run = await PayrollRunService.finalizeRun(tenantId, runId, userId);
    res.json({ success: true, data: run });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'FINALIZE_ERROR', message: error.message } });
  }
};
