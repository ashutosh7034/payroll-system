import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PayrollRunService {
  static async createRun(tenantId: string, month: number, year: number, userId: string) {
    const existing = await prisma.payrollRun.findFirst({
      where: { tenantId, runPeriodMonth: month, runPeriodYear: year }
    });

    if (existing) {
      if (existing.status === 'FINALIZED') {
        throw new Error('PAYROLL_PERIOD_LOCKED: Cannot create run for finalized period');
      }
      if (existing.status === 'DRAFT' || existing.status === 'VALIDATION_FAILED') {
        // Reset to DRAFT if it was failed, so user can restart
        if (existing.status === 'VALIDATION_FAILED') {
          return prisma.payrollRun.update({
            where: { id: existing.id },
            data: { status: 'DRAFT', processedBy: userId }
          });
        }
        return existing;
      }
      throw new Error(`An active payroll run already exists for ${month}/${year}`);
    }

    const run = await prisma.payrollRun.create({
      data: {
        tenantId, runPeriodMonth: month, runPeriodYear: year,
        status: 'DRAFT', processedBy: userId
      }
    });

    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entity: 'PayrollRun', entityId: run.id }
    });

    return run;
  }

  static async getRuns(tenantId: string) {
    return prisma.payrollRun.findMany({
      where: { tenantId },
      orderBy: [{ runPeriodYear: 'desc' }, { runPeriodMonth: 'desc' }]
    });
  }

  static async getRunById(tenantId: string, id: string) {
    return prisma.payrollRun.findFirst({
      where: { tenantId, id },
      include: {
        payslips: { include: { employee: true, components: true } },
        exceptions: { include: { employee: true } }
      }
    });
  }

  static async lockRun(tenantId: string, id: string, userId: string) {
    const run = await prisma.payrollRun.findFirst({ where: { tenantId, id } });
    if (!run) throw new Error('Run not found');
    if (run.status !== 'APPROVED') throw new Error('Run must be APPROVED to be locked');

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.payrollRun.update({
        where: { id },
        data: { status: 'LOCKED', lockedBy: userId, lockedAt: new Date() }
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'UPDATE', entity: 'PayrollRun', entityId: id, newValue: 'LOCKED' }
      });
      return u;
    });

    return updated;
  }

  static async approveRun(tenantId: string, id: string, userId: string) {
    const run = await prisma.payrollRun.findFirst({ where: { tenantId, id } });
    if (!run) throw new Error('Run not found');
    if (run.status !== 'READY_FOR_APPROVAL' && run.status !== 'CALCULATED') throw new Error('Run not ready for approval');

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.payrollRun.update({
        where: { id },
        data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() }
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'UPDATE', entity: 'PayrollRun', entityId: id, newValue: 'APPROVED' }
      });
      return u;
    });

    return updated;
  }

  static async finalizeRun(tenantId: string, id: string, userId: string) {
    const run = await prisma.payrollRun.findFirst({ where: { tenantId, id } });
    if (!run) throw new Error('Run not found');
    if (run.status !== 'LOCKED') throw new Error('Run must be LOCKED to be finalized');

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.payrollRun.update({
        where: { id },
        data: { status: 'FINALIZED' }
      });
      
      await tx.payslip.updateMany({
        where: { payrollRunId: id },
        data: { status: 'FINALIZED' }
      });

      await tx.auditLog.create({
        data: { tenantId, userId, action: 'UPDATE', entity: 'PayrollRun', entityId: id, newValue: 'FINALIZED' }
      });
      return u;
    });

    return updated;
  }

  static async checkPeriodLock(tenantId: string, month: number, year: number) {
    const run = await prisma.payrollRun.findFirst({
      where: { tenantId, runPeriodMonth: month, runPeriodYear: year }
    });
    if (run && ['LOCKED', 'FINALIZED'].includes(run.status)) {
      throw new Error('PAYROLL_PERIOD_LOCKED');
    }
  }
}
