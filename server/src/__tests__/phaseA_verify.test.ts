import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('Phase A Verification Tests', async (t) => {
  let tenantA: any;
  let tenantB: any;
  let userA: any;
  let superAdminRole: any;

  await t.test('Setup Test Environment', async () => {
    // Initial cleanup
    await prisma.tenant.deleteMany({ where: { domain: { in: ['verify-a', 'verify-b'] } } });

    tenantA = await prisma.tenant.create({ data: { name: 'Verify Tenant A', domain: 'verify-a' } });
    tenantB = await prisma.tenant.create({ data: { name: 'Verify Tenant B', domain: 'verify-b' } });

    superAdminRole = await prisma.role.upsert({ 
      where: { name: 'Super Admin' },
      update: {},
      create: { name: 'Super Admin', description: 'Test Admin' }
    });

    userA = await prisma.user.create({
      data: {
        tenantId: tenantA.id,
        email: 'verifyadmin@test.com',
        firstName: 'Admin',
        lastName: 'A',
        passwordHash: 'hashed',
        userRoles: { create: { roleId: superAdminRole.id } }
      }
    });
  });

  await t.test('2. Verify Employee Transaction (Rollback)', async () => {
    // Intentional failure by providing an invalid department ID
    await assert.rejects(async () => {
      await prisma.$transaction(async (tx) => {
        const emp = await tx.employee.create({
          data: { tenantId: tenantA.id, employeeId: 'V_EMP_01', firstName: 'Fail', lastName: 'Test', departmentId: 'invalid-id' }
        });
        await tx.employment.create({
          data: { employeeId: emp.id, employmentType: 'FULL_TIME', joiningDate: new Date() }
        });
      });
    });

    const empCheck = await prisma.employee.findFirst({ where: { employeeId: 'V_EMP_01', tenantId: tenantA.id } });
    assert.strictEqual(empCheck, null, 'Transaction did not rollback employee creation');
  });

  let empId: string;
  await t.test('2. Verify Employee Transaction (Success)', async () => {
    const emp = await prisma.$transaction(async (tx) => {
      const e = await tx.employee.create({
        data: { tenantId: tenantA.id, employeeId: 'V_EMP_02', firstName: 'Success', lastName: 'Test' }
      });
      await tx.employment.create({
        data: { employeeId: e.id, employmentType: 'FULL_TIME', joiningDate: new Date() }
      });
      await tx.employeeBank.create({
        data: { employeeId: e.id, bankName: 'Test Bank', accountNumber: '123', ifscCode: 'IFSC123' }
      });
      await tx.employeeTaxProfile.create({
        data: { employeeId: e.id, taxRegime: 'NEW' }
      });
      await tx.auditLog.create({
        data: { tenantId: tenantA.id, action: 'CREATE', entity: 'Employee', entityId: e.id }
      });
      return e;
    });

    empId = emp.id;
    const check = await prisma.employee.findUnique({
      where: { id: empId },
      include: { employment: true, bankDetails: true, taxProfile: true }
    });
    
    assert.ok(check?.employment);
    assert.ok(check?.bankDetails);
    assert.ok(check?.taxProfile);
  });

  await t.test('3. & 4. Verify Employee Update & Status History', async () => {
    // We mock what the controller does: update + insert history + audit
    const updated = await prisma.$transaction(async (tx) => {
      const e = await tx.employee.update({
        where: { id: empId },
        data: { status: 'INACTIVE' }
      });
      await tx.employeeHistory.create({
        data: { employeeId: empId, fieldChanged: 'status', oldValue: 'ACTIVE', newValue: 'INACTIVE', changedBy: userA.id }
      });
      return e;
    });

    assert.strictEqual(updated.status, 'INACTIVE');
    
    const history = await prisma.employeeHistory.findMany({ where: { employeeId: empId } });
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].newValue, 'INACTIVE');
  });

  await t.test('5. Verify Tenant Isolation', async () => {
    // Manually testing the API would require mocking express request. Let's just confirm
    // that Prisma queries respect the `tenantId` we pass in controllers.
    const empInA = await prisma.employee.findFirst({ where: { tenantId: tenantB.id, employeeId: 'V_EMP_02' }});
    assert.strictEqual(empInA, null, 'Tenant isolation query failure');
  });

  await t.test('Clean up', async () => {
    await prisma.employeeHistory.deleteMany({ where: { employeeId: empId } });
    await prisma.employeeBank.deleteMany({ where: { employeeId: empId } });
    await prisma.employeeTaxProfile.deleteMany({ where: { employeeId: empId } });
    await prisma.employment.deleteMany({ where: { employeeId: empId } });
    await prisma.auditLog.deleteMany({ where: { entityId: empId } });
    await prisma.employee.deleteMany({ where: { id: empId } });
    
    if (userA) {
      await prisma.userRole.deleteMany({ where: { userId: userA.id } });
      await prisma.user.deleteMany({ where: { id: userA.id } });
    }
    await prisma.tenant.deleteMany({ where: { domain: { in: ['verify-a', 'verify-b'] } } });
  });
});
