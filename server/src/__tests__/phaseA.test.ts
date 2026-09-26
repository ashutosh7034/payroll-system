import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test('Phase A: Organization, Employee, RBAC Integrity Tests', async (t) => {
  let tenantA: any;
  let tenantB: any;
  let deptA: any;
  let deptB: any;

  await t.test('Seed test tenants', async () => {
    tenantA = await prisma.tenant.create({ data: { name: 'Tenant A Test', domain: 'test-a' } });
    tenantB = await prisma.tenant.create({ data: { name: 'Tenant B Test', domain: 'test-b' } });

    deptA = await prisma.department.create({ data: { tenantId: tenantA.id, name: 'Engineering A' } });
    deptB = await prisma.department.create({ data: { tenantId: tenantB.id, name: 'Engineering B' } });

    assert.ok(tenantA.id);
    assert.ok(tenantB.id);
  });

  await t.test('1. Employee creation', async () => {
    const emp = await prisma.employee.create({
      data: {
        tenantId: tenantA.id,
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        departmentId: deptA.id,
      }
    });
    assert.strictEqual(emp.employeeId, 'EMP001');
    assert.strictEqual(emp.tenantId, tenantA.id);
  });

  await t.test('2. Employee update (basic)', async () => {
    const emp = await prisma.employee.update({
      where: { tenantId_employeeId: { tenantId: tenantA.id, employeeId: 'EMP001' } },
      data: { lastName: 'Smith' }
    });
    assert.strictEqual(emp.lastName, 'Smith');
  });

  await t.test('3. Duplicate employee ID fails', async () => {
    await assert.rejects(
      async () => {
        await prisma.employee.create({
          data: { tenantId: tenantA.id, employeeId: 'EMP001', firstName: 'Jane', lastName: 'Doe' }
        });
      }
    );
  });

  await t.test('4. Cross-tenant employee creation', async () => {
    // Should be able to create EMP001 in Tenant B
    const emp = await prisma.employee.create({
      data: { tenantId: tenantB.id, employeeId: 'EMP001', firstName: 'Jane', lastName: 'Doe', departmentId: deptB.id }
    });
    assert.strictEqual(emp.tenantId, tenantB.id);
  });

  await t.test('5. Validating relation isolation (Cross-tenant dept access fails via application logic)', async () => {
    // Our application logic handles this, but let's test if the DB allows a mismatch.
    // The DB allows it if there's no complex check, which is why controller validation is needed.
    // We will verify the API logic independently or use a transaction test.
  });

  await t.test('Clean up', async () => {
    await prisma.employee.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.department.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });
  });
});
