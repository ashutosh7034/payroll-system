import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class LoanService {
  // --- LOAN TYPES ---
  static async createLoanType(tenantId: string, data: any) {
    return prisma.loanType.create({
      data: { ...data, tenantId }
    });
  }

  static async getLoanTypes(tenantId: string) {
    return prisma.loanType.findMany({ where: { tenantId } });
  }

  // --- LOAN REQUESTS ---
  static async requestLoan(tenantId: string, employeeId: string, data: any) {
    const principalAmount = new Decimal(data.principalAmount);
    const interestRate = new Decimal(data.interestRate || 0);
    const tenureMonths = Number(data.tenureMonths);

    let emiAmount = new Decimal(0);
    let totalInterest = new Decimal(0);
    let totalAmount = new Decimal(0);

    if (interestRate.greaterThan(0)) {
      // Simple EMI Calculation (Principal * Rate * Tenure) / 100 + Principal / Tenure
      // Or proper compound: P * R * (1+R)^N / ((1+R)^N - 1)
      // Let's use simple interest for advances and loans in payroll usually
      const ratePerMonth = interestRate.dividedBy(12).dividedBy(100);
      
      if (ratePerMonth.greaterThan(0)) {
        // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
        const onePlusRToN = Math.pow(1 + ratePerMonth.toNumber(), tenureMonths);
        const emi = (principalAmount.toNumber() * ratePerMonth.toNumber() * onePlusRToN) / (onePlusRToN - 1);
        emiAmount = new Decimal(emi.toFixed(2));
      }
    } else {
      emiAmount = principalAmount.dividedBy(tenureMonths);
    }
    
    totalAmount = emiAmount.mul(tenureMonths);
    totalInterest = totalAmount.sub(principalAmount);

    return prisma.loan.create({
      data: {
        tenantId,
        employeeId,
        loanTypeId: data.loanTypeId,
        principalAmount,
        interestRate,
        tenureMonths,
        emiAmount,
        startDate: new Date(data.startDate),
        totalInterest,
        totalAmount,
        outstandingBalance: totalAmount,
        status: 'PENDING'
      }
    });
  }

  static async getLoans(tenantId: string, filters: any) {
    return prisma.loan.findMany({
      where: { tenantId, ...filters },
      include: {
        loanType: true,
        employee: { select: { firstName: true, lastName: true, employeeId: true } },
        installments: {
          orderBy: { installmentNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getEmployeeLoans(tenantId: string, employeeId: string) {
    return this.getLoans(tenantId, { employeeId });
  }

  // --- LOAN APPROVAL ---
  static async approveLoan(tenantId: string, loanId: string, approverId: string) {
    const loan = await prisma.loan.findFirst({ where: { id: loanId, tenantId } });
    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'PENDING') throw new Error('Loan cannot be approved in its current state');

    // Generate Schedule
    const installments = [];
    let currentStartDate = new Date(loan.startDate);

    for (let i = 1; i <= loan.tenureMonths; i++) {
      installments.push({
        installmentNumber: i,
        dueDate: new Date(currentStartDate),
        principalPart: loan.principalAmount.dividedBy(loan.tenureMonths), // Simple division for demo
        interestPart: loan.totalInterest.dividedBy(loan.tenureMonths),
        totalAmount: loan.emiAmount,
        status: 'PENDING'
      });
      // Increment month
      currentStartDate.setMonth(currentStartDate.getMonth() + 1);
    }

    const [updatedLoan] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: {
          status: 'ACTIVE',
          approvedBy: approverId,
          approvalDate: new Date(),
          installments: {
            create: installments
          }
        }
      }),
      prisma.auditLog.create({
        data: {
          tenantId,
          userId: approverId,
          action: 'APPROVE',
          entity: 'Loan',
          entityId: loanId,
          newValue: 'ACTIVE'
        }
      })
    ]);

    return updatedLoan;
  }

  static async rejectLoan(tenantId: string, loanId: string, approverId: string, reason: string) {
    return prisma.loan.update({
      where: { id: loanId, tenantId },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        rejectionReason: reason
      }
    });
  }
}
