import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { ReimbursementService } from '../services/reimbursement.service';

const prisma = new PrismaClient();
const tenantId = 'test-tenant-' + Math.random().toString(36).substr(2, 9);
let employeeId: string;
let categoryId: string;

before(async () => {
  await prisma.tenant.create({ data: { id: tenantId, name: 'Test Tenant' } });
  const e = await prisma.employee.create({
    data: {
      tenantId,
      firstName: 'Reimbursement',
      lastName: 'Tester',
      employeeId: 'R-101',
      email: 'reimb@test.com',
      
    }
  });
  employeeId = e.id;
  
  const rc = await prisma.reimbursementCategory.create({
    data: { tenantId, name: 'Travel', limitPerYear: 5000, isTaxable: false }
  });
  categoryId = rc.id;
});

after(async () => {
  await prisma.reimbursementClaim.deleteMany({ where: { tenantId } });
  await prisma.reimbursementCategory.deleteMany({ where: { tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
});

describe('Reimbursement Engine - Phase 5', () => {
  it('creates claim successfully', async () => {
    const data = {
      categoryId,
      amount: 1500,
      claimDate: new Date(),
      description: 'Flight ticket'
    };
    const claim = await ReimbursementService.submitClaim(tenantId, employeeId, data);
    assert.strictEqual(Number(claim.amount), 1500);
    assert.strictEqual(claim.status, 'PENDING');
  });

  it('allows HR and Finance approval', async () => {
    const data = { categoryId, amount: 2000, claimDate: new Date(), description: 'Hotel' };
    const claim = await ReimbursementService.submitClaim(tenantId, employeeId, data);
    
    // HR Approval
    let updated = await ReimbursementService.approveClaimHR(tenantId, claim.id, 'hr-user');
    assert.strictEqual(updated.status, 'APPROVED_HR');
    
    // Finance Approval (Final)
    updated = await ReimbursementService.verifyClaimFinance(tenantId, claim.id, 'fin-user');
    assert.strictEqual(updated.status, 'APPROVED_FINANCE');
    assert.strictEqual(Number(updated.approvedAmount), 2000); // Auto sets if not provided
  });
  
  it('allows partial approval', async () => {
    const data = { categoryId, amount: 3000, claimDate: new Date(), description: 'Meals' };
    const claim = await ReimbursementService.submitClaim(tenantId, employeeId, data);
    
    const updated = await ReimbursementService.approveClaimHR(tenantId, claim.id, 'hr-user', '2500');
    assert.strictEqual(updated.status, 'APPROVED_HR');
    assert.strictEqual(Number(updated.approvedAmount), 2500);
  });

  it('allows rejection', async () => {
    const data = { categoryId, amount: 1000, claimDate: new Date(), description: 'Invalid' };
    const claim = await ReimbursementService.submitClaim(tenantId, employeeId, data);
    
    const updated = await ReimbursementService.rejectClaim(tenantId, claim.id, 'hr-user', 'No receipt');
    assert.strictEqual(updated.status, 'REJECTED');
    assert.strictEqual(updated.rejectionReason, 'No receipt');
  });

  it('prevents cross-tenant access', async () => {
    const data = { categoryId, amount: 1000, claimDate: new Date(), description: 'Test' };
    const claim = await ReimbursementService.submitClaim(tenantId, employeeId, data);
    
    await assert.rejects(async () => { await ReimbursementService.approveClaimHR('wrong-tenant', claim.id, 'test'); }, { message: 'Claim not found' });
  });
});
