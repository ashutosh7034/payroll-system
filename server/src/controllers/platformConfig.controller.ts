import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTenantConfiguration = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const module = req.params.module as string;
    
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { profile: true } });
    if (!tenant) return res.status(404).json({ success: false, error: { message: 'Company not found' } });

    switch(module) {
      case 'payroll':
        return res.json({ success: true, data: { financialYear: tenant.profile?.financialYear || '' } });
      case 'attendance':
        const calendars = await prisma.workCalendar.findMany({ where: { tenantId } });
        const shifts = await prisma.shift.findMany({ where: { tenantId } });
        return res.json({ success: true, data: { calendars, shifts } });
      case 'leave':
        const policies = await prisma.leavePolicy.findMany({ where: { tenantId } });
        return res.json({ success: true, data: { policies } });
      case 'tax':
        const rules = await prisma.statutoryRule.findMany({ where: { tenantId } });
        return res.json({ success: true, data: { rules } });
      case 'approval':
        return res.json({ success: true, data: {} });
      default:
        return res.status(400).json({ success: false, error: { message: 'Invalid module' } });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updateTenantConfiguration = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const module = req.params.module as string;
    const payload = req.body;
    
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { profile: true } });
    if (!tenant) return res.status(404).json({ success: false, error: { message: 'Company not found' } });

    switch(module) {
      case 'payroll':
        if (payload.financialYear) {
          await prisma.tenantProfile.upsert({
            where: { tenantId },
            create: { tenantId, financialYear: payload.financialYear },
            update: { financialYear: payload.financialYear }
          });
        }
        return res.json({ success: true });
        
      case 'attendance':
        if (payload.calendars && payload.calendars.length > 0) {
          for (const cal of payload.calendars) {
            if (cal.id) {
               const { id, tenantId_, createdAt, updatedAt, ...updateData } = cal;
               await prisma.workCalendar.update({ where: { id }, data: updateData });
            } else {
               await prisma.workCalendar.create({ data: { tenantId, ...cal, name: cal.name || 'Default' } });
            }
          }
        }
        return res.json({ success: true });
        
      case 'leave':
        if (payload.policies && payload.policies.length > 0) {
           for (const p of payload.policies) {
             if (p.id) {
               const { id, tenantId_, createdAt, updatedAt, balances, requests, ...updateData } = p;
               updateData.effectiveFrom = new Date(updateData.effectiveFrom);
               updateData.daysPerYear = parseFloat(updateData.daysPerYear);
               updateData.maxCarryForward = parseFloat(updateData.maxCarryForward || 0);
               updateData.maxEncashment = updateData.maxEncashment ? parseFloat(updateData.maxEncashment) : null;
               await prisma.leavePolicy.update({ where: { id }, data: updateData });
             } else {
               p.effectiveFrom = new Date(p.effectiveFrom || new Date());
               p.daysPerYear = parseFloat(p.daysPerYear);
               p.maxCarryForward = parseFloat(p.maxCarryForward || 0);
               p.maxEncashment = p.maxEncashment ? parseFloat(p.maxEncashment) : null;
               await prisma.leavePolicy.create({ data: { tenantId, ...p } });
             }
           }
        }
        return res.json({ success: true });
        
      case 'tax':
        if (payload.rules && payload.rules.length > 0) {
           for (const r of payload.rules) {
             if (r.id) {
                const { id, tenantId_, createdAt, updatedAt, ...updateData } = r;
                if (updateData.effectiveFrom) updateData.effectiveFrom = new Date(updateData.effectiveFrom);
                if (updateData.effectiveTo) updateData.effectiveTo = new Date(updateData.effectiveTo);
                
                updateData.employeeRate = parseFloat(updateData.employeeRate || 0);
                updateData.employerRate = parseFloat(updateData.employerRate || 0);
                updateData.wageCeiling = parseFloat(updateData.wageCeiling || 0);
                updateData.wageThreshold = parseFloat(updateData.wageThreshold || 0);
                
                await prisma.statutoryRule.update({ where: { id }, data: updateData });
             } else {
                r.effectiveFrom = new Date(r.effectiveFrom || new Date());
                if (r.effectiveTo) r.effectiveTo = new Date(r.effectiveTo);
                
                r.employeeRate = parseFloat(r.employeeRate || 0);
                r.employerRate = parseFloat(r.employerRate || 0);
                r.wageCeiling = parseFloat(r.wageCeiling || 0);
                r.wageThreshold = parseFloat(r.wageThreshold || 0);
                
                await prisma.statutoryRule.create({ data: { tenantId, ...r } });
             }
           }
        }
        return res.json({ success: true });
        
      case 'approval':
        return res.json({ success: true });
        
        return res.json({ success: true });
        
      default:
        return res.status(400).json({ success: false, error: { message: 'Invalid module' } });
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const createStatutoryRule = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId);
    const { statutoryType, effectiveFrom, employeeRate, employerRate, wageCeiling, wageThreshold, isActive, type, componentType, amount, description } = req.body as any;
    
    if (!statutoryType || !effectiveFrom) {
      return res.status(400).json({ success: false, error: { message: 'Statutory type and effective date are required.' } });
    }

    const rule = await prisma.statutoryRule.create({
      data: {
        tenantId,
        statutoryType,
        effectiveFrom: new Date(effectiveFrom),
        employeeRate: parseFloat(employeeRate || 0),
        employerRate: parseFloat(employerRate || 0),
        wageCeiling: parseFloat(wageCeiling || 0),
        wageThreshold: parseFloat(wageThreshold || 0),
        isActive: isActive !== undefined ? isActive : true
      }
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: { tenantId, action: 'TAX_RULE_CREATED', entity: 'StatutoryRule', entityId: rule.id, userId: (req as any).user?.id || 'SYSTEM' }
    });

    res.json({ success: true, data: rule });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updateStatutoryRule = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId); const ruleId = String(req.params.ruleId);
    const { statutoryType, effectiveFrom, employeeRate, employerRate, wageCeiling, wageThreshold, isActive, type, componentType, amount, description } = req.body as any;
    
    const existing = await prisma.statutoryRule.findUnique({ where: { id: ruleId } });
    if (!existing || existing.tenantId !== tenantId) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }

    const rule = await prisma.statutoryRule.update({
      where: { id: ruleId },
      data: {
        statutoryType,
        effectiveFrom: new Date(effectiveFrom),
        employeeRate: parseFloat(employeeRate || 0),
        employerRate: parseFloat(employerRate || 0),
        wageCeiling: parseFloat(wageCeiling || 0),
        wageThreshold: parseFloat(wageThreshold || 0),
        isActive: isActive !== undefined ? isActive : true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: { tenantId, action: 'TAX_RULE_UPDATED', entity: 'StatutoryRule', entityId: rule.id, userId: (req as any).user?.id || 'SYSTEM' }
    });

    res.json({ success: true, data: rule });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updateStatutoryRuleStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId); const ruleId = String(req.params.ruleId);
    const { statutoryType, effectiveFrom, employeeRate, employerRate, wageCeiling, wageThreshold, isActive, type, componentType, amount, description } = req.body as any;
    
    const existing = await prisma.statutoryRule.findUnique({ where: { id: ruleId } });
    if (!existing || existing.tenantId !== tenantId) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }

    const rule = await prisma.statutoryRule.update({
      where: { id: ruleId },
      data: { isActive }
    });

    res.json({ success: true, data: rule });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const deleteStatutoryRule = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.params.tenantId); const ruleId = String(req.params.ruleId);
    
    const existing = await prisma.statutoryRule.findUnique({ where: { id: ruleId } });
    if (!existing || existing.tenantId !== tenantId) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }

    await prisma.statutoryRule.delete({ where: { id: ruleId } });
    
    // Audit log
    await prisma.auditLog.create({
      data: { tenantId, action: 'TAX_RULE_DELETED', entity: 'StatutoryRule', entityId: ruleId, userId: (req as any).user?.id || 'SYSTEM' }
    });

    res.json({ success: true, message: 'Statutory rule deleted successfully.' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
