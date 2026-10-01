import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { ArrearService } from '../services/arrear.service';

const prisma = new PrismaClient();
const tenantId = 'test-tenant-' + Math.random().toString(36).substr(2, 9);
let employeeId: string;

before(async () => {
  await prisma.tenant.create({ data: { id: tenantId, name: 'Test Tenant' } });
  const e = await prisma.employee.create({
    data: {
      tenantId,
      firstName: 'Arrear',
      lastName: 'Tester',
      employeeId: 'A-101',
      email: 'arrear@test.com',
      
    }
  });
  employeeId = e.id;
});

after(async () => {
  await prisma.arrear.deleteMany({ where: { tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
});

describe('Arrears Engine - Phase 5', () => {
  it('calculates total correctly', async () => {
    const data = {
      arrearType: 'RETROACTIVE_SALARY',
      effectiveDate: new Date(),
      basicArrear: 5000,
      daArrear: 2000,
      hraArrear: 1500,
      otherArrears: 500,
      notes: 'Test arrear'
    };
    
    const arrear = await ArrearService.createArrear(tenantId, employeeId, data);
    
    assert.strictEqual(Number(arrear.basicArrear), 5000);
    assert.strictEqual(Number(arrear.daArrear), 2000);
    assert.strictEqual(Number(arrear.totalAmount), 9000); // 5000 + 2000 + 1500 + 500
    
    // Tax impact should be logged as well
    assert(Number(arrear.taxImpact) >= 0);
  });

  it('allows approval', async () => {
    const data = {
      arrearType: 'PROMOTION',
      effectiveDate: new Date(),
      basicArrear: 10000,
      daArrear: 0,
      hraArrear: 0,
      otherArrears: 0,
      notes: 'Promo'
    };
    
    const arrear = await ArrearService.createArrear(tenantId, employeeId, data);
    assert.strictEqual(arrear.status, 'PENDING');
    
    const updated = await ArrearService.approveArrear(tenantId, arrear.id, 'approver');
    assert.strictEqual(updated.status, 'APPROVED');
  });

  it('prevents cross-tenant access', async () => {
    const data = {
      arrearType: 'BONUS',
      effectiveDate: new Date(),
      basicArrear: 1000,
      daArrear: 0,
      hraArrear: 0,
      otherArrears: 0
    };
    
    const arrear = await ArrearService.createArrear(tenantId, employeeId, data);
    
    await assert.rejects(async () => { await ArrearService.approveArrear('wrong-tenant', arrear.id, 'approver'); }, { message: 'Arrear not found' });
  });
});
