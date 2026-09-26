import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { ReconciliationService } from '../services/reconciliation.service';

export const createPaymentBatch = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    const { payrollRunId } = req.body;
    
    if (!tenantId || !userId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const batch = await PaymentService.createPaymentBatch(tenantId, payrollRunId, userId);
    res.json({ success: true, data: batch });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const submitPaymentBatch = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    const { id } = req.params;
    
    if (!tenantId || !userId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const result = await PaymentService.submitPaymentBatch(tenantId, id as string, userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const reconcileBatch = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    const { id } = req.params;
    
    if (!tenantId || !userId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const result = await ReconciliationService.reconcileBatch(tenantId, id as string, userId, req.body.mockData);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getBatches = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const batches = await PaymentService.getBatches(tenantId);
    res.json({ success: true, data: batches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getBatchById = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const batch = await PaymentService.getBatchById(tenantId, req.params.id as string);
    if (!batch) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    res.json({ success: true, data: batch });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
