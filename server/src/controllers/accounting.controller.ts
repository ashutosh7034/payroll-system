import { Request, Response } from 'express';
import { AccountingService } from '../services/accounting.service';

export const getGLMappings = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const mappings = await AccountingService.getGLMappings(tenantId);
    res.json({ success: true, data: mappings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const saveGLMapping = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const { component, accountName, accountNumber, type } = req.body;
    const mapping = await AccountingService.saveGLMapping(tenantId, component, accountName, accountNumber, type);
    res.json({ success: true, data: mapping });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const generateJournal = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    const { payrollRunId } = req.body;
    
    if (!tenantId || !userId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const journal = await AccountingService.generateJournal(tenantId, payrollRunId, userId);
    res.json({ success: true, data: journal });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const postJournal = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    const { id } = req.params;
    
    if (!tenantId || !userId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const journal = await AccountingService.postJournal(tenantId, id as string, userId);
    res.json({ success: true, data: journal });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};
