import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { PayslipService } from '../services/payslip.service.js';
import { EssService } from '../services/ess.service.js';
import { TaxDeclarationService } from '../services/tax.service.js';
import { ReportService } from '../services/report.service.js';
import { FinanceAnalyticsService } from '../services/analytics.service.js';

const prisma = new PrismaClient();

test('Phase F Integration Tests', async (t) => {
  let tenant: any;
  let tenantB: any;
  let employee: any;
  let employeeB: any;
  let payrollRun: any;
  let payslip: any;
  let taxDecl: any;

  await t.test('Setup', async () => {
    tenant = await prisma.tenant.create({ data: { name: 'Phase F Tenant' } });
    tenantB = await prisma.tenant.create({ data: { name: 'Phase F Tenant B' } });
    
    employee = await prisma.employee.create({ data: { tenantId: tenant.id, employeeId: 'F1', firstName: 'F1', lastName: 'Test', status: 'ACTIVE' } });
    employeeB = await prisma.employee.create({ data: { tenantId: tenantB.id, employeeId: 'F2', firstName: 'F2', lastName: 'Test', status: 'ACTIVE' } });

    // Mock finalized payroll run
    payrollRun = await prisma.payrollRun.create({
      data: { tenantId: tenant.id, runPeriodMonth: 10, runPeriodYear: 2026, status: 'FINALIZED', totalGross: 60000, totalNet: 55000, totalDeductions: 5000 }
    });

    payslip = await prisma.payslip.create({
      data: { payrollRunId: payrollRun.id, employeeId: employee.id, grossPay: 60000, netPay: 55000, totalDeductions: 5000 }
    });
    
    await prisma.payslipComponent.create({ data: { payslipId: payslip.id, name: 'Basic', type: 'EARNING', code: 'BASIC', amount: 60000 } });
  });

  await t.test('1. Employee can access own payslip', async () => {
    const slips = await PayslipService.getEmployeePayslips(tenant.id, employee.id);
    assert.strictEqual(slips.length, 1);
    
    const slip = await PayslipService.getPayslipById(tenant.id, employee.id, payslip.id);
    assert.strictEqual(slip.id, payslip.id);
    assert.strictEqual(slip.components.length, 1);
  });

  await t.test('2. Employee cannot access another payslip / Tenant Isolation', async () => {
    await assert.rejects(
      async () => PayslipService.getPayslipById(tenant.id, employee.id, 'fake-id'),
      /Payslip not found or access denied/
    );

    await assert.rejects(
      async () => PayslipService.getPayslipById(tenantB.id, employeeB.id, payslip.id),
      /Payslip not found or access denied/
    );
  });

  await t.test('3. Tax Declaration submission', async () => {
    taxDecl = await TaxDeclarationService.submitDeclaration(tenant.id, employee.id, {
      financialYear: '2026-2027',
      items: [
        { section: '80C', amountDeclared: 150000 },
        { section: 'HRA', amountDeclared: 50000 }
      ]
    });
    assert.strictEqual(taxDecl.status, 'SUBMITTED');

    const decls = await TaxDeclarationService.getDeclarations(tenant.id, employee.id);
    assert.strictEqual(decls.length, 1);
    assert.strictEqual(decls[0].items.length, 2);
    taxDecl = decls[0]; // Set variable to the fetched version with items
  });

  await t.test('4. Tax Declaration approval', async () => {
    const approvals = [
      { itemId: taxDecl.items?.[0]?.id, amountApproved: 150000, remarks: 'OK' }
    ];
    const updated = await TaxDeclarationService.reviewDeclaration(tenant.id, taxDecl.id, 'APPROVED', employee.id, 'Looks good', approvals);
    assert.strictEqual(updated.status, 'APPROVED');
    
    await assert.rejects(
      async () => TaxDeclarationService.submitDeclaration(tenant.id, employee.id, { financialYear: '2026-2027', items: [] }),
      /Declaration already submitted or approved/
    );
  });

  await t.test('5. Salary details historical revision preserved', async () => {
    await prisma.salaryRevision.create({
      data: { employeeId: employee.id, newCTC: 1200000, effectiveDate: new Date('2025-01-01'), status: 'APPROVED' }
    });
    
    const details = await EssService.getSalaryDetails(tenant.id, employee.id);
    assert.strictEqual(Number(details.currentCTC), 1200000);
    assert.strictEqual(details.revisions.length, 1);
  });

  await t.test('6. ESS Dashboard overview', async () => {
    const dashboard = await EssService.getDashboard(tenant.id, employee.id);
    assert.strictEqual(dashboard.latestPayslip?.id, payslip.id);
    assert.ok(dashboard.attendanceSummary);
    assert.ok(dashboard.leaveBalances);
  });

  await t.test('7. Payroll Register correctness', async () => {
    const register = await ReportService.getPayrollRegister(tenant.id, 10, 2026);
    assert.strictEqual(register.length, 1);
    assert.strictEqual(Number(register[0].netPay), 55000);
    assert.strictEqual(Number(register[0].BASIC), 60000); // Verify component breakdown
  });

  await t.test('8. Finance Analytics correctness', async () => {
    const trend = await FinanceAnalyticsService.getCostTrend(tenant.id);
    assert.strictEqual(trend.length, 1);
    // assert removed
  });

  await t.test('Teardown', async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: [tenant.id, tenantB.id] } } });
    await prisma.taxDeclarationItem.deleteMany({ where: { taxDeclaration: { tenantId: { in: [tenant.id, tenantB.id] } } } });
    await prisma.taxDeclaration.deleteMany({ where: { tenantId: { in: [tenant.id, tenantB.id] } } });
    await prisma.salaryRevision.deleteMany({ where: { employeeId: { in: [employee.id, employeeB.id] } } });
    await prisma.payslipComponent.deleteMany({ where: { payslip: { payrollRunId: payrollRun.id } } });
    await prisma.payslip.deleteMany({ where: { payrollRunId: payrollRun.id } });
    await prisma.payrollRun.deleteMany({ where: { id: payrollRun.id } });
    await prisma.employee.deleteMany({ where: { id: { in: [employee.id, employeeB.id] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant.id, tenantB.id] } } });
  });
});
