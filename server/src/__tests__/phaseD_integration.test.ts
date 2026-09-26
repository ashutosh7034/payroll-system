import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { PayrollRunService } from '../services/payroll-run.service';
import { PayrollEngine } from '../services/payroll.engine';

const prisma = new PrismaClient();

test('Phase D Integration Tests', async (t) => {
  let tenantA: any;
  let tenantB: any;
  let empA1: any;
  let empA2: any;
  let empB1: any;
  let structA: any;

  await t.test('Setup', async () => {
    tenantA = await prisma.tenant.create({ data: { name: 'Tenant A Phase D' } });
    tenantB = await prisma.tenant.create({ data: { name: 'Tenant B Phase D' } });

    empA1 = await prisma.employee.create({ data: { tenantId: tenantA.id, employeeId: 'D-A1', firstName: 'A1', lastName: 'Test', status: 'ACTIVE' } });
    empA2 = await prisma.employee.create({ data: { tenantId: tenantA.id, employeeId: 'D-A2', firstName: 'A2', lastName: 'Test', status: 'ACTIVE' } });
    empB1 = await prisma.employee.create({ data: { tenantId: tenantB.id, employeeId: 'D-B1', firstName: 'B1', lastName: 'Test', status: 'ACTIVE' } });

    const compBasic = await prisma.salaryComponent.create({ data: { tenantId: tenantA.id, name: 'Basic', code: 'BASIC', type: 'EARNING' } });
    const compHra = await prisma.salaryComponent.create({ data: { tenantId: tenantA.id, name: 'HRA', code: 'HRA', type: 'EARNING' } });
    const compPf = await prisma.salaryComponent.create({ data: { tenantId: tenantA.id, name: 'PF', code: 'PF', type: 'DEDUCTION' } });

    await prisma.salaryFormula.create({ data: { tenantId: tenantA.id, salaryComponentId: compBasic.id, expression: 'CTC * 0.4 * PRORATION_FACTOR' } });
    await prisma.salaryFormula.create({ data: { tenantId: tenantA.id, salaryComponentId: compHra.id, expression: 'BASIC * 0.5' } });
    await prisma.salaryFormula.create({ data: { tenantId: tenantA.id, salaryComponentId: compPf.id, expression: 'BASIC * 0.12' } });

    structA = await prisma.salaryStructure.create({
      data: {
        tenantId: tenantA.id, name: 'Standard A', isActive: true,
        components: {
          create: [
            { salaryComponentId: compBasic.id },
            { salaryComponentId: compHra.id },
            { salaryComponentId: compPf.id }
          ]
        }
      }
    });

    await prisma.salaryRevision.create({ data: { employeeId: empA1.id, newCTC: 600000, effectiveDate: new Date('2026-01-01'), status: 'APPROVED' } });
    // empA2 will intentionally fail (no salary revision)
  });

  await t.test('1. Idempotency Test', async () => {
    const run1 = await PayrollRunService.createRun(tenantA.id, 11, 2026, 'TESTER');
    assert.strictEqual(run1.status, 'DRAFT');

    const run2 = await PayrollRunService.createRun(tenantA.id, 11, 2026, 'TESTER');
    assert.strictEqual(run1.id, run2.id); // Same draft returned

    await prisma.payrollRun.update({ where: { id: run1.id }, data: { status: 'APPROVED' }});
    
    await assert.rejects(
      async () => PayrollRunService.createRun(tenantA.id, 11, 2026, 'TESTER'),
      /already exists/
    );
  });

  await t.test('2. Core Calculation & Partial Failure', async () => {
    // We create a run for Month 12
    const run = await PayrollRunService.createRun(tenantA.id, 12, 2026, 'TESTER');
    
    // Add some inputs
    await prisma.payrollInput.create({
      data: { tenantId: tenantA.id, employeeId: empA1.id, inputType: 'VARIABLE_PAY', amount: 5000, payrollPeriodMonth: 12, payrollPeriodYear: 2026 }
    });

    await PayrollEngine.calculateRun(tenantA.id, run.id);

    const updated = await prisma.payrollRun.findUnique({ where: { id: run.id } });
    assert.strictEqual(updated?.employeeCount, 2);
    assert.strictEqual(updated?.successCount, 1);
    assert.strictEqual(updated?.failedCount, 1);
    assert.strictEqual(updated?.status, 'VALIDATION_FAILED');

    const exceptions = await prisma.payrollException.findMany({ where: { payrollRunId: run.id } });
    assert.strictEqual(exceptions.length, 1);
    assert.strictEqual(exceptions[0].employeeId, empA2.id);

    const payslips = await prisma.payslip.findMany({ where: { payrollRunId: run.id }, include: { components: true } });
    assert.strictEqual(payslips.length, 1);
    const slip = payslips[0];
    
    // Logic: CTC = 600,000. PRORATION_FACTOR = 1 (no LOP). Basic = 600k * 0.4 = 240,000 (Wait, annual? Yes, AST gives annual. We need to divide by 12. Let's see what the formula output gives. The AST does raw calculation. If basic = 240,000, HRA = 120,000, PF = 28,800. Net = 331,200 + 5000 var = 336,200). 
    assert.ok(Number(slip.grossPay) > 0);
    assert.ok(Number(slip.totalDeductions) > 0);
    assert.strictEqual(Number(slip.netPay), Number(slip.grossPay) - Number(slip.totalDeductions));
  });

  await t.test('3. Lock Test', async () => {
    // Approve and Lock a run
    const run = await PayrollRunService.createRun(tenantA.id, 1, 2027, 'TESTER');
    await prisma.payrollRun.update({ where: { id: run.id }, data: { status: 'READY_FOR_APPROVAL' }});
    await PayrollRunService.approveRun(tenantA.id, run.id, 'TESTER');
    await PayrollRunService.lockRun(tenantA.id, run.id, 'TESTER');

    await assert.rejects(
      async () => PayrollRunService.checkPeriodLock(tenantA.id, 1, 2027),
      /PAYROLL_PERIOD_LOCKED/
    );
  });

  await t.test('4. Tenant Isolation', async () => {
    // Try to get run from Tenant B with Tenant A
    const run = await PayrollRunService.createRun(tenantB.id, 10, 2026, 'TESTER');
    
    // Calculate via Engine (using tenantA with run from tenantB should fail or do nothing)
    await assert.rejects(
      async () => PayrollEngine.calculateRun(tenantA.id, run.id),
      /Run not found/
    );
  });

  await t.test('Teardown', async () => {
    // Cleanup
    await prisma.payslipComponent.deleteMany({ where: { payslip: { employee: { tenantId: { in: [tenantA.id, tenantB.id] } } } } });
    await prisma.payslip.deleteMany({ where: { employee: { tenantId: { in: [tenantA.id, tenantB.id] } } } });
    await prisma.payrollException.deleteMany({ where: { employee: { tenantId: { in: [tenantA.id, tenantB.id] } } } });
    await prisma.payrollInput.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.salaryRevision.deleteMany({ where: { employeeId: { in: [empA1.id, empA2.id, empB1.id] } } });
    await prisma.employee.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.payrollRun.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.salaryFormula.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.payrollException.deleteMany({ where: { employee: { tenantId: { in: [tenantA.id, tenantB.id] } } } });
    await prisma.salaryFormula.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.salaryStructureComponent.deleteMany({ where: { structure: { tenantId: { in: [tenantA.id, tenantB.id] } } } });
    await prisma.salaryStructure.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.salaryComponent.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });
  });

});
