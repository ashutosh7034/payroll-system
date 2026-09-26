import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReportService {
  /**
   * Payroll Register - gets all payslips with components in a tabular structure for a given run
   */
  static async getPayrollRegister(tenantId: string, runPeriodMonth: number, runPeriodYear: number) {
    const run = await prisma.payrollRun.findFirst({
      where: { tenantId, runPeriodMonth, runPeriodYear, status: 'FINALIZED' },
      include: {
        payslips: {
          include: {
            employee: { select: { employeeId: true, firstName: true, lastName: true, department: { select: { name: true } } } },
            components: true
          }
        }
      }
    });

    if (!run) return [];

    return run.payslips.map(slip => {
      const components: any = {};
      slip.components.forEach(c => {
        components[c.code || c.name] = c.amount;
      });
      return {
        employeeId: slip.employee.employeeId,
        name: slip.employee.firstName + ' ' + slip.employee.lastName,
        department: slip.employee.department?.name || 'N/A',
        grossPay: slip.grossPay,
        totalDeductions: slip.totalDeductions,
        netPay: slip.netPay,
        ...components
      };
    });
  }

  static async getDepartmentPayrollCost(tenantId: string, runPeriodMonth: number, runPeriodYear: number) {
    const run = await prisma.payrollRun.findFirst({
      where: { tenantId, runPeriodMonth, runPeriodYear, status: 'FINALIZED' },
      include: {
        payslips: {
          include: { employee: { include: { department: true } } }
        }
      }
    });

    if (!run) return [];

    const deptCost: Record<string, { gross: number, net: number, deductions: number, headcount: number }> = {};
    
    run.payslips.forEach(slip => {
      const dept = slip.employee.department?.name || 'Unassigned';
      if (!deptCost[dept]) deptCost[dept] = { gross: 0, net: 0, deductions: 0, headcount: 0 };
      deptCost[dept].gross += Number(slip.grossPay);
      deptCost[dept].net += Number(slip.netPay);
      deptCost[dept].deductions += Number(slip.totalDeductions);
      deptCost[dept].headcount += 1;
    });

    return Object.entries(deptCost).map(([dept, cost]) => ({ department: dept, ...cost }));
  }

  static async getPaymentReport(tenantId: string, paymentBatchId: string) {
    const batch = await prisma.paymentBatch.findUnique({
      where: { id: paymentBatchId },
      include: {
        instructions: {
          include: { employee: { select: { employeeId: true, firstName: true, lastName: true } } }
        }
      }
    });

    if (!batch || batch.tenantId !== tenantId) throw new Error('Not found');

    return batch.instructions.map(i => ({
      employee: i.employee.firstName + ' ' + i.employee.lastName,
      accountNumber: i.accountNumber,
      ifscCode: i.ifscCode,
      amount: i.amount,
      status: i.status,
      failureReason: i.failureReason,
      transactionRef: i.transactionReference
    }));
  }
}
