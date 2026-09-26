import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { PayrollRunService } from '../services/payroll-run.service';
import { PaymentService } from '../services/payment.service';
import { AccountingService } from '../services/accounting.service';
import { ReconciliationService } from '../services/reconciliation.service';

const prisma = new PrismaClient();

test('Phase E Integration Tests', async (t) => {
  let tenant: any;
  let tenantB: any;
  let employee: any;
  let employee2: any;
  let run: any;
  let paymentBatch: any;

  await t.test('Setup', async () => {
    tenant = await prisma.tenant.create({ data: { name: 'Tenant E Phase' } });
    tenantB = await prisma.tenant.create({ data: { name: 'Tenant EB Phase' } });
    
    employee = await prisma.employee.create({ data: { tenantId: tenant.id, employeeId: 'E1', firstName: 'E1', lastName: 'Test', status: 'ACTIVE' } });
    employee2 = await prisma.employee.create({ data: { tenantId: tenant.id, employeeId: 'E2', firstName: 'E2', lastName: 'Test', status: 'ACTIVE' } });
    
    // Add bank details
    await prisma.employeeBank.create({
      data: { employeeId: employee.id, bankName: 'HDFC', accountNumber: '123456789', ifscCode: 'HDFC0001', accountType: 'SAVINGS' }
    });
    // E2 has missing bank details deliberately

    // Mock finalized payroll run
    run = await prisma.payrollRun.create({
      data: { tenantId: tenant.id, runPeriodMonth: 10, runPeriodYear: 2026, status: 'FINALIZED', totalGross: 100000, totalNet: 90000, totalDeductions: 10000 }
    });

    const slip1 = await prisma.payslip.create({
      data: { payrollRunId: run.id, employeeId: employee.id, grossPay: 60000, netPay: 55000, totalDeductions: 5000 }
    });
    await prisma.payslipComponent.create({ data: { payslipId: slip1.id, name: 'Basic', type: 'EARNING', code: 'BASIC', amount: 60000 } });
    await prisma.payslipComponent.create({ data: { payslipId: slip1.id, name: 'PF', type: 'DEDUCTION', code: 'PF', amount: 5000 } });

    const slip2 = await prisma.payslip.create({
      data: { payrollRunId: run.id, employeeId: employee2.id, grossPay: 40000, netPay: 35000, totalDeductions: 5000 }
    });
    await prisma.payslipComponent.create({ data: { payslipId: slip2.id, name: 'Basic', type: 'EARNING', code: 'BASIC', amount: 40000 } });
    await prisma.payslipComponent.create({ data: { payslipId: slip2.id, name: 'PF', type: 'DEDUCTION', code: 'PF', amount: 5000 } });
  });

  await t.test('1. Payment Eligibility and Immutability', async () => {
    // Creating batch for finalized run
    paymentBatch = await PaymentService.createPaymentBatch(tenant.id, run.id, 'TESTER');
    
    assert.strictEqual(paymentBatch.status, 'READY');
    assert.strictEqual(paymentBatch.totalEmployees, 2);
    assert.strictEqual(paymentBatch.pendingPayments, 1);
    assert.strictEqual(paymentBatch.failedPayments, 1);
    
    const instructions = await prisma.paymentInstruction.findMany({ where: { paymentBatchId: paymentBatch.id } });
    assert.strictEqual(instructions.length, 2);
    
    const failedInst = instructions.find(i => i.status === 'FAILED');
    assert.strictEqual(failedInst?.failureReason, 'BANK_DETAILS_MISSING');
  });

  await t.test('2. Payment Idempotency', async () => {
    await assert.rejects(
      async () => PaymentService.createPaymentBatch(tenant.id, run.id, 'TESTER'),
      /Payment batch already exists/
    );
  });

  await t.test('3. Payment Submission and Status', async () => {
    const res = await PaymentService.submitPaymentBatch(tenant.id, paymentBatch.id, 'TESTER');
    const batch = await prisma.paymentBatch.findFirst({ where: { id: paymentBatch.id } });
    assert.strictEqual(['PARTIALLY_COMPLETED', 'COMPLETED', 'FAILED'].includes(batch?.status as string), true);
  });

  await t.test('4. Reconciliation & Exceptions', async () => {
    // Manually push an instruction to SUCCESS for testing reconciliation
    const inst = await prisma.paymentInstruction.findFirst({ where: { paymentBatchId: paymentBatch.id, status: { not: 'FAILED' } } });
    if (inst) {
      await prisma.paymentInstruction.update({ where: { id: inst.id }, data: { status: 'SUCCESS', transactionReference: 'TXN-123', amount: 55000 } });
    }

    const mockBankData = [
      { transactionReference: 'TXN-123', amount: 50000 } // amount mismatch
    ];

    const rec = await ReconciliationService.reconcileBatch(tenant.id, paymentBatch.id, 'TESTER', mockBankData);
    assert.strictEqual(rec.status, 'EXCEPTIONS');
    assert.strictEqual(rec.mismatched, 1);
    assert.strictEqual(rec.unresolved, 1);
  });

  await t.test('5. Accounting GL Mapping Missing Exception', async () => {
    await assert.rejects(
      async () => AccountingService.generateJournal(tenant.id, run.id, 'TESTER'),
      /ACCOUNTING_MAPPING_MISSING/
    );
  });

  await t.test('6. Journal Generation & Balance', async () => {
    await AccountingService.saveGLMapping(tenant.id, 'BASIC', 'Basic Salary Exp', '5001', 'DEBIT');
    await AccountingService.saveGLMapping(tenant.id, 'PF', 'PF Payable', '2001', 'CREDIT');
    await AccountingService.saveGLMapping(tenant.id, 'NET_PAY', 'Salary Payable', '2002', 'CREDIT');

    const journal = await AccountingService.generateJournal(tenant.id, run.id, 'TESTER');
    assert.strictEqual(journal.status, 'VALIDATED');
    assert.strictEqual(Number(journal.totalDebit), 100000); // 60k + 40k Basic
    assert.strictEqual(Number(journal.totalCredit), 100000); // 90k net + 10k PF

    const lines = await prisma.journalLine.findMany({ where: { journalId: journal.id } });
    assert.strictEqual(lines.length, 3);
  });

  await t.test('7. Accounting Idempotency', async () => {
    await assert.rejects(
      async () => AccountingService.generateJournal(tenant.id, run.id, 'TESTER'),
      /Journal already generated/
    );
  });

  await t.test('8. Tenant Isolation', async () => {
    const b = await PaymentService.getBatchById(tenantB.id, paymentBatch.id);
    assert.strictEqual(b, null);
  });

  await t.test('Teardown', async () => {
    await prisma.journalLine.deleteMany({ where: { journal: { tenantId: { in: [tenant.id, tenantB.id] } } } });
    await prisma.accountingJournal.deleteMany({ where: { tenantId: { in: [tenant.id, tenantB.id] } } });
    await prisma.gLMapping.deleteMany({ where: { tenantId: { in: [tenant.id, tenantB.id] } } });
    await prisma.reconciliationBatch.deleteMany({ where: { tenantId: { in: [tenant.id, tenantB.id] } } });
    await prisma.paymentInstruction.deleteMany({ where: { paymentBatch: { tenantId: { in: [tenant.id, tenantB.id] } } } });
    await prisma.paymentBatch.deleteMany({ where: { tenantId: { in: [tenant.id, tenantB.id] } } });
    await prisma.payslipComponent.deleteMany({ where: { payslip: { payrollRunId: run.id } } });
    await prisma.payslip.deleteMany({ where: { payrollRunId: run.id } });
    await prisma.payrollRun.deleteMany({ where: { id: run.id } });
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: [tenant.id, tenantB.id] } } });
    await prisma.employeeBank.deleteMany({ where: { employeeId: { in: [employee.id, employee2.id] } } });
    await prisma.employee.deleteMany({ where: { id: { in: [employee.id, employee2.id] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant.id, tenantB.id] } } });
  });
});
