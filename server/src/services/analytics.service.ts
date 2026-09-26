import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FinanceAnalyticsService {
  static async getCostTrend(tenantId: string) {
    const runs = await prisma.payrollRun.findMany({
      where: { tenantId, status: 'FINALIZED' },
      orderBy: [{ runPeriodYear: 'asc' }, { runPeriodMonth: 'asc' }],
      take: 12
    });

    return runs.map(r => ({
      period: `${r.runPeriodYear}-${String(r.runPeriodMonth).padStart(2, '0')}`,
      totalGross: r.totalGross,
      totalNet: r.totalNet,
      totalDeductions: r.totalDeductions,
      headcount: r.employeeCount
    }));
  }

  static async getPaymentSuccessRate(tenantId: string, runPeriodMonth: number, runPeriodYear: number) {
    const batches = await prisma.paymentBatch.findMany({
      where: {
        tenantId,
        payrollRun: { runPeriodMonth, runPeriodYear }
      }
    });

    if (batches.length === 0) return null;

    let total = 0, success = 0, failed = 0, pending = 0;
    for (const b of batches) {
      total += b.totalEmployees;
      success += b.successfulPayments;
      failed += b.failedPayments;
      pending += b.pendingPayments;
    }

    return { total, success, failed, pending };
  }
}
