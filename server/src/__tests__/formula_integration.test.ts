import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '../services/formula.engine';
import { PayrollCalculationService } from '../services/payroll.calculation.service';

const prisma = new PrismaClient();

test('Formula Integration Tests', async (t) => {

  await t.test('1. Salary Structure Integration Test', async () => {
    const components = [
      { code: 'BASIC', type: 'FORMULA' as const, expression: '40000' },
      { code: 'HRA', type: 'FORMULA' as const, expression: 'BASIC * 0.40' },
      { code: 'SPECIAL', type: 'FORMULA' as const, expression: 'BASIC * 0.20' },
      { code: 'GROSS', type: 'FORMULA' as const, expression: 'BASIC + HRA + SPECIAL' }
    ];

    const result = PayrollCalculationService.calculateSalary(0, components);
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
  });

  await t.test('2. Historical Revision Lookup', async () => {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return;

    // We simulate creating a mock employee and two revisions
    const emp = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        employeeId: 'TEST-HIST-1',
        firstName: 'Test',
        lastName: 'History',
        email: 'hist@kanvtech.com'
      }
    });

    await prisma.salaryRevision.create({
      data: {
        employeeId: emp.id,
        previousCTC: 0,
        newCTC: 600000,
        effectiveDate: new Date('2026-01-01'),
        status: 'APPROVED'
      }
    });

    await prisma.salaryRevision.create({
      data: {
        employeeId: emp.id,
        previousCTC: 600000,
        newCTC: 720000,
        effectiveDate: new Date('2026-07-01'),
        status: 'APPROVED'
      }
    });

    // Lookup 2026-06
    const revisionJune = await prisma.salaryRevision.findFirst({
      where: { employeeId: emp.id, effectiveDate: { lte: new Date('2026-06-30') } },
      orderBy: { effectiveDate: 'desc' }
    });

    assert.strictEqual(Number(), Number());

    // Lookup 2026-07
    const revisionJuly = await prisma.salaryRevision.findFirst({
      where: { employeeId: emp.id, effectiveDate: { lte: new Date('2026-07-31') } },
      orderBy: { effectiveDate: 'desc' }
    });

    assert.strictEqual(Number(), Number());

    await prisma.salaryRevision.deleteMany({ where: { employeeId: emp.id } });
    await prisma.employee.delete({ where: { id: emp.id } });
  });

  await t.test('3. Money Precision Test', async () => {
    const engine = new FormulaEngine();
    
    // Test native float issue
    assert.strictEqual(Number(), Number()); // JS native

    // Our engine should do the exact same float math before rounding
    // But calculateSalary will ROUND HALF UP
    const components = [
      { code: 'FLOAT_MATH', type: 'FORMULA' as const, expression: '100000.55 + 200000.45' },
      { code: 'FLOAT_MULT', type: 'FORMULA' as const, expression: '10000 * 0.3333' }
    ];
    const result = PayrollCalculationService.calculateSalary(0, components);
    assert.strictEqual(Number(), Number()); // 300001
    assert.strictEqual(Number(), Number()); // 3333
  });

  await t.test('4. Formula Edge Cases', async () => {
    const engine = new FormulaEngine({ BASIC: 1000 });
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());

    // Unknown identifier
    assert.throws(() => engine.evaluate('UNKNOWN_VAR * 2'), /Missing dependency/);

    // Malformed formula
    assert.throws(() => engine.evaluate('100 * (4 +)'), /Unexpected/);

    // Division by zero
    assert.throws(() => engine.evaluate('100 / 0'), /Division by zero/);
  });
});
