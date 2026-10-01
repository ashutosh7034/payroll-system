import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentService {
  // 1. Payment Eligibility and Batch Creation
  static async createPaymentBatch(tenantId: string, payrollRunId: string, userId: string) {
    const run = await prisma.payrollRun.findFirst({
      where: { tenantId, id: payrollRunId },
      include: { payslips: { include: { employee: { include: { bankDetails: true } } } } }
    });

    if (!run) throw new Error('Payroll run not found');
    if (run.status !== 'FINALIZED') throw new Error('Only FINALIZED payrolls are eligible for payment');

    // Idempotency constraint check
    const existingBatch = await prisma.paymentBatch.findFirst({
      where: { tenantId, payrollRunId }
    });
    if (existingBatch) throw new Error('Payment batch already exists for this payroll run');

    let successfulPayments = 0;
    let failedPayments = 0;
    let totalAmount = 0;
    const instructions = [];

    for (const slip of run.payslips) {
      if (Number(slip.netPay) <= 0) continue; // Skip zero or negative net pay

      const bank = slip.employee.bankDetails;
      const hasValidBank = bank && bank.accountNumber && bank.ifscCode;
      
      const status = hasValidBank ? 'PENDING' : 'FAILED';
      const reason = hasValidBank ? null : 'BANK_DETAILS_MISSING';
      
      if (hasValidBank) successfulPayments++;
      else failedPayments++;
      
      totalAmount += Number(slip.netPay);

      instructions.push({
        employeeId: slip.employeeId,
        payslipId: slip.id,
        amount: slip.netPay,
        accountName: slip.employee.firstName + ' ' + slip.employee.lastName,
        accountNumber: bank?.accountNumber || null,
        ifscCode: bank?.ifscCode || null,
        bankName: bank?.bankName || null,
        status: status,
        failureReason: reason
      });
    }

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.paymentBatch.create({
        data: {
          tenantId,
          payrollRunId,
          status: 'READY',
          totalEmployees: instructions.length,
          successfulPayments: 0,
          pendingPayments: successfulPayments,
          failedPayments: failedPayments,
          totalAmount: totalAmount,
          createdBy: userId,
          instructions: {
            create: instructions
          }
        }
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'CREATE', entity: 'PaymentBatch', entityId: b.id, newValue: 'READY' }
      });
      return b;
    });

    return batch;
  }

  // 2. Submit Payments (Provider Abstraction)
  static async submitPaymentBatch(tenantId: string, batchId: string, userId: string) {
    const batch = await prisma.paymentBatch.findFirst({
      where: { tenantId, id: batchId },
      include: { instructions: true }
    });

    if (!batch) throw new Error('Payment batch not found');
    if (batch.status !== 'READY' && batch.status !== 'PARTIALLY_COMPLETED' && batch.status !== 'FAILED') {
      throw new Error('Batch cannot be submitted in its current state');
    }

    const pending = batch.instructions.filter(i => i.status === 'PENDING' || i.status === 'FAILED' && i.failureReason !== 'BANK_DETAILS_MISSING');
    if (pending.length === 0) throw new Error('No eligible pending payments to submit');

    // INTEGRATION: Real provider submission logic (e.g. RazorpayX / ICICI Bank)
    let newSuccess = 0;
    let newFail = 0;

    await prisma.$transaction(async (tx) => {
      for (const inst of pending) {
        // Validate Bank Details before payout
        const hasValidAccount = inst.accountNumber && inst.accountNumber.length >= 8;
        const hasValidIfsc = inst.ifscCode && inst.ifscCode.length >= 4;
        
        let success = false;
        let newReason = null;
        let txnRef = null;

        if (!hasValidAccount) {
          success = false;
          newReason = 'INVALID_ACCOUNT_NUMBER';
        } else if (!hasValidIfsc) {
          success = false;
          newReason = 'INVALID_IFSC_CODE';
        } else {
          // Simulated Bank API response for valid inputs
          success = true;
          txnRef = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        }

        const newStatus = success ? 'SUCCESS' : 'FAILED';
        
        await tx.paymentInstruction.update({
          where: { id: inst.id },
          data: { 
            status: newStatus, 
            failureReason: newReason, 
            submittedAt: new Date(), 
            transactionReference: txnRef 
          }
        });

        if (success) newSuccess++;
        else newFail++;
      }

      const totalPending = batch.pendingPayments - newSuccess - newFail;
      const totalSuccess = batch.successfulPayments + newSuccess;
      const totalFailed = batch.failedPayments + newFail;

      let bStatus = 'PARTIALLY_COMPLETED';
      if (totalSuccess === batch.totalEmployees) bStatus = 'COMPLETED';
      else if (totalSuccess > 0 && totalFailed > 0) bStatus = 'PARTIALLY_COMPLETED';
      else if (totalSuccess === 0 && totalFailed > 0) bStatus = 'FAILED';

      await tx.paymentBatch.update({
        where: { id: batchId },
        data: {
          status: bStatus,
          successfulPayments: totalSuccess,
          failedPayments: totalFailed,
          pendingPayments: totalPending,
          submittedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: { tenantId, userId, action: 'SUBMIT', entity: 'PaymentBatch', entityId: batchId, newValue: bStatus }
      });
    });

    return { message: 'Submission complete', newSuccess, newFail };
  }

  static async getBatches(tenantId: string) {
    return prisma.paymentBatch.findMany({
      where: { tenantId },
      include: { payrollRun: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getBatchById(tenantId: string, id: string) {
    return prisma.paymentBatch.findFirst({
      where: { tenantId, id },
      include: { instructions: { include: { employee: true } }, payrollRun: true }
    });
  }
}
