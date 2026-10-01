import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EssService {
  static async getDashboard(tenantId: string, employeeId: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId, tenantId } });
    if (!employee) throw new Error('Employee not found or access denied');
    
    // 1. Current salary / latest net pay
    const latestPayslip = await prisma.payslip.findFirst({
      where: { employeeId, payrollRun: { tenantId, status: 'FINALIZED' } },
      orderBy: { createdAt: 'desc' },
      include: { payrollRun: { select: { runPeriodMonth: true, runPeriodYear: true } } }
    });

    // 2. Attendance summary (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const attendance = await prisma.attendanceRecord.findMany({
      where: { employeeId, date: { gte: startOfMonth } }
    });
    
    // 3. Leave balance
    const currentYear = now.getFullYear();
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: { employeeId, year: currentYear },
      include: { policy: { select: { name: true } } }
    });

    // 4. Pending leave requests
    const pendingLeaves = await prisma.leaveRequest.findMany({
      where: { employeeId, status: 'PENDING' },
      include: { policy: { select: { name: true } } }
    });

    // 5. Active loans
    const activeLoans = await prisma.loan.findMany({
      where: { employeeId, tenantId, status: 'ACTIVE' }
    });

    // 6. Recent reimbursements
    const recentReimbursements = await prisma.reimbursementClaim.findMany({
      where: { employeeId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return {
      latestPayslip,
      attendanceSummary: {
        present: attendance.filter(a => a.status === 'PRESENT').length,
        absent: attendance.filter(a => a.status === 'ABSENT').length,
        halfDay: attendance.filter(a => a.status === 'HALF_DAY').length
      },
      leaveBalances,
      pendingLeaves,
      activeLoans,
      recentReimbursements
    };
  }

  static async getSalaryDetails(tenantId: string, employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        salaryRevisions: {
          orderBy: { effectiveDate: 'desc' }
        }
      }
    });

    if (!employee || employee.tenantId !== tenantId) {
      throw new Error('Not found');
    }

    const currentRevision = employee.salaryRevisions[0] || null;

    return {
      currentCTC: currentRevision?.newCTC || 0,
      revisions: employee.salaryRevisions
    };
  }
}
