import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReconciliationService {
  static async reconcileBatch(tenantId: string, paymentBatchId: string, userId: string, mockBankData?: any[]) {
    const batch = await prisma.paymentBatch.findFirst({
      where: { tenantId, id: paymentBatchId },
      include: { instructions: true }
    });

    if (!batch) throw new Error('Payment batch not found');
    if (batch.status === 'DRAFT' || batch.status === 'READY') throw new Error('Cannot reconcile unsubmitted batch');

    const existingRec = await prisma.reconciliationBatch.findFirst({
      where: { tenantId, paymentBatchId }
    });
    if (existingRec) throw new Error('Reconciliation already exists for this batch');

    let totalExpected = 0;
    let totalActual = 0;
    let matched = 0;
    let mismatched = 0;
    let unresolved = 0;

    for (const inst of batch.instructions) {
      if (inst.status === 'SUCCESS') totalExpected += Number(inst.amount);
    }

    // MOCK reconciliation logic
    if (mockBankData) {
      for (const inst of batch.instructions) {
        if (inst.status !== 'SUCCESS') continue;
        const bankRecord = mockBankData.find(m => m.transactionReference === inst.transactionReference);
        if (bankRecord) {
          totalActual += bankRecord.amount;
          if (bankRecord.amount === inst.amount) {
            matched++;
          } else {
            mismatched++;
            unresolved++;
          }
        } else {
          unresolved++; // missing payment
        }
      }
    } else {
      // Auto-match for success demo
      totalActual = totalExpected;
      matched = batch.successfulPayments;
    }

    const recStatus = (mismatched === 0 && unresolved === 0) ? 'MATCHED' : 'EXCEPTIONS';

    const rec = await prisma.$transaction(async (tx) => {
      const r = await tx.reconciliationBatch.create({
        data: {
          tenantId,
          paymentBatchId,
          totalExpected,
          totalActual,
          matched,
          mismatched,
          unresolved,
          status: recStatus,
          createdBy: userId,
          completedAt: recStatus === 'MATCHED' ? new Date() : null
        }
      });
      if (recStatus === 'MATCHED') {
        await tx.paymentBatch.update({
          where: { id: paymentBatchId },
          data: { status: 'RECONCILED' }
        });
      }
      return r;
    });

    return rec;
  }
}
