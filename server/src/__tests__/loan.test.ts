import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { LoanService } from '../services/loan.service';

const prisma = new PrismaClient();
const tenantId = 'test-tenant-' + Math.random().toString(36).substr(2, 9);
let employeeId: string;
let loanTypeId: string;

before(async () => {
  const t = await prisma.tenant.create({ data: { id: tenantId, name: 'Test Tenant' } });
  const e = await prisma.employee.create({
    data: {
      tenantId,
      firstName: 'Loan',
      lastName: 'Tester',
      employeeId: 'L-101',
      email: 'loan@test.com',
      
    }
  });
  employeeId = e.id;
  
  const lt = await prisma.loanType.create({
    data: { tenantId, name: 'Personal Loan', interestRate: 10 }
  });
  loanTypeId = lt.id;
});

after(async () => {
  await prisma.loanInstallment.deleteMany({ where: { loan: { tenantId } } });
  await prisma.loan.deleteMany({ where: { tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  await prisma.loanType.deleteMany({ where: { tenantId } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
});

describe('Loan Engine - Phase 5', () => {
  it('calculates zero-interest EMI correctly', async () => {
    const data = {
      loanTypeId,
      principalAmount: 10000,
      tenureMonths: 10,
      startDate: new Date(),
      interestRate: 0
    };
    const loan = await LoanService.requestLoan(tenantId, employeeId, data);
    assert.strictEqual(Number(loan.totalAmount), 10000);
    assert.strictEqual(Number(loan.totalInterest), 0);
    assert.strictEqual(Number(loan.emiAmount), 1000); // 10000 / 10 = 1000
    
    // We update status to approved to trigger installment generation if it's there
    const updated = await LoanService.approveLoan(tenantId, loan.id, 'test-user');
    
    const installments = await prisma.loanInstallment.findMany({ where: { loanId: loan.id } });
    assert.strictEqual(installments.length, 10);
    assert.strictEqual(Number(installments[0].principalPart), 1000);
    assert.strictEqual(Number(installments[0].interestPart), 0);
    assert.strictEqual(Number(installments[0].totalAmount), 1000);
  });

  it('calculates interest-bearing EMI correctly (Compound Rate)', async () => {
    // 100,000 principal, 10% rate per year, 12 months tenure
    const data = {
      loanTypeId,
      principalAmount: 100000,
      tenureMonths: 12,
      startDate: new Date(),
      interestRate: 10
    };
    const loan = await LoanService.requestLoan(tenantId, employeeId, data);
    
    // EMI = 100000 * (0.10/12) * (1+0.10/12)^12 / ((1+0.10/12)^12 - 1) = 8791.59
    assert(Math.abs(Number(loan.emiAmount) - 8791.59) < 1);
    
    const updated = await LoanService.approveLoan(tenantId, loan.id, 'test-user');
    const installments = await prisma.loanInstallment.findMany({ where: { loanId: loan.id } });
    assert.strictEqual(installments.length, 12);
  });
  
  it('maintains outstanding balance and allows approval', async () => {
    const data = {
      loanTypeId,
      principalAmount: 10000,
      tenureMonths: 5,
      startDate: new Date(),
      interestRate: 0
    };
    const loan = await LoanService.requestLoan(tenantId, employeeId, data);
    assert.strictEqual(Number(loan.outstandingBalance), 10000);
    
    const updated = await LoanService.approveLoan(tenantId, loan.id, 'test-user');
    assert.strictEqual(updated.status, 'ACTIVE');
  });
  
  it('prevents cross-tenant access', async () => {
    const data = {
      loanTypeId,
      principalAmount: 5000,
      tenureMonths: 5,
      startDate: new Date(),
      interestRate: 0
    };
    const loan = await LoanService.requestLoan(tenantId, employeeId, data);
    
    await assert.rejects(async () => { await LoanService.approveLoan('wrong-tenant', loan.id, 'test'); }, { message: 'Loan not found' });
  });
});
