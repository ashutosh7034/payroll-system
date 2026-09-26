import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

export class AccountingService {
  
  static async getGLMappings(tenantId: string) {
    return prisma.gLMapping.findMany({ where: { tenantId } });
  }

  static async saveGLMapping(tenantId: string, component: string, name: string, number: string, type: string) {
    return prisma.gLMapping.upsert({
      where: { tenantId_payrollComponent: { tenantId, payrollComponent: component } },
      update: { accountName: name, accountNumber: number, type },
      create: { tenantId, payrollComponent: component, accountName: name, accountNumber: number, type }
    });
  }

  static async generateJournal(tenantId: string, payrollRunId: string, userId: string) {
    const run = await prisma.payrollRun.findFirst({
      where: { tenantId, id: payrollRunId },
      include: { payslips: { include: { components: true } } }
    });

    if (!run) throw new Error('Payroll run not found');
    if (run.status !== 'FINALIZED') throw new Error('Run must be finalized to generate journal');

    const existingJournal = await prisma.accountingJournal.findFirst({
      where: { tenantId, payrollRunId }
    });
    if (existingJournal) throw new Error('Journal already generated for this payroll run');

    const mappings = await prisma.gLMapping.findMany({ where: { tenantId, isActive: true } });
    const mappingMap = new Map(mappings.map(m => [m.payrollComponent, m]));

    const aggregated = new Map<string, Decimal>();

    // Aggregate values
    for (const slip of run.payslips) {
      // 1. Gross Salary mapping (we'll break it down by component code)
      for (const comp of slip.components) {
        if (!comp.code) continue;
        const current = aggregated.get(comp.code) || new Decimal(0);
        aggregated.set(comp.code, current.plus(comp.amount));
      }
      
      const currentNet = aggregated.get('NET_PAY') || new Decimal(0);
      aggregated.set('NET_PAY', currentNet.plus(slip.netPay));
    }

    const lines = [];
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);
    const missingMappings = [];

    for (const [code, amount] of aggregated.entries()) {
      if (amount.isZero()) continue;
      const mapping = mappingMap.get(code);
      if (!mapping) {
        missingMappings.push(code);
        continue;
      }

      const isDebit = mapping.type === 'DEBIT';
      if (isDebit) {
        totalDebit = totalDebit.plus(amount);
      } else {
        totalCredit = totalCredit.plus(amount);
      }

      lines.push({
        accountName: mapping.accountName,
        accountNumber: mapping.accountNumber,
        debit: isDebit ? amount.toNumber() : 0,
        credit: isDebit ? 0 : amount.toNumber(),
        source: code,
        description: `Payroll ${run.runPeriodMonth}/${run.runPeriodYear} - ${code}`
      });
    }

    if (missingMappings.length > 0) {
      throw new Error(`ACCOUNTING_MAPPING_MISSING: Missing GL Mappings for components: ${missingMappings.join(', ')}`);
    }

    // Money Precision fix
    totalDebit = totalDebit.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    totalCredit = totalCredit.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    if (totalDebit.minus(totalCredit).abs().greaterThan(1)) { // 1 rupee tolerance for rounding
      throw new Error(`Journal does not balance. Debit: ${totalDebit.toNumber()}, Credit: ${totalCredit.toNumber()}`);
    }

    const journal = await prisma.$transaction(async (tx) => {
      const j = await tx.accountingJournal.create({
        data: {
          tenantId,
          payrollRunId,
          date: new Date(),
          status: 'VALIDATED',
          totalDebit: totalDebit.toNumber(),
          totalCredit: totalCredit.toNumber(),
          createdBy: userId,
          lines: {
            create: lines
          }
        }
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'CREATE', entity: 'AccountingJournal', entityId: j.id, newValue: 'VALIDATED' }
      });
      return j;
    });

    return journal;
  }

  static async postJournal(tenantId: string, journalId: string, userId: string) {
    const journal = await prisma.accountingJournal.findFirst({
      where: { tenantId, id: journalId }
    });

    if (!journal) throw new Error('Journal not found');
    if (journal.status !== 'VALIDATED') throw new Error('Journal not validated for posting');

    const updated = await prisma.$transaction(async (tx) => {
      const j = await tx.accountingJournal.update({
        where: { id: journalId },
        data: { status: 'POSTED', reference: 'JRN-' + Math.random().toString(36).substr(2, 6).toUpperCase() }
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'UPDATE', entity: 'AccountingJournal', entityId: journalId, newValue: 'POSTED' }
      });
      return j;
    });

    return updated;
  }
}
