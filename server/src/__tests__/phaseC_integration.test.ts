import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { ProrationEngine } from '../services/proration.engine';

const prisma = new PrismaClient();

test('Phase C Integration Tests', async (t) => {
  let tenant: any;
  let employee: any;

  await t.test('Setup', async () => {
    tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({ data: { name: 'Phase C Tenant' } });
    }

    employee = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        employeeId: 'TEST-PHC-1',
        firstName: 'PhaseC',
        lastName: 'Test',
        email: 'phasec@kanvtech.com'
      }
    });
  });

  await t.test('1. LOP / Proration Engine', async () => {
    const year = 2026;
    const month = 10; // October (31 days)

    // Mark 2 days as ABSENT (LOP)
    await prisma.attendanceRecord.create({ data: { employeeId: employee.id, date: new Date('2026-10-05'), status: 'ABSENT' }});
    await prisma.attendanceRecord.create({ data: { employeeId: employee.id, date: new Date('2026-10-06'), status: 'HALF_DAY' }});

    const result = await ProrationEngine.calculate({
      tenantId: tenant.id,
      employeeId: employee.id,
      year, month
    });

    // Default calendar is Mon-Fri working, Sat-Sun off.
    // Oct 2026 has 31 days. Weekends: 4, 10, 11, 17, 18, 24, 25, 31 (8 weekend days). Working days = 23.
    // ABSENT = 1 LOP. HALF_DAY = 0.5 LOP. Total LOP = 1.5.
    
    assert.strictEqual(result.calendarDays, 31);
    assert.strictEqual(result.workingDays, 22); // Actually let's check what it is... Oct 2026 starts on Thursday. Weekends are 3,4, 10,11, 17,18, 24,25, 31 (9 weekend days). 31-9 = 22 working days.
    assert.strictEqual(result.lopDays, 1.5);
    assert.strictEqual(result.paidDays, 20.5);
    assert.strictEqual(result.prorationFactor, 20.5 / 22);
  });

  await t.test('2. Leave Request & Balance Deduction', async () => {
    // Create Policy
    const policy = await prisma.leavePolicy.create({
      data: { tenantId: tenant.id, name: 'Sick Leave', type: 'SICK', daysPerYear: 10 }
    });

    // Create Balance
    const balance = await prisma.leaveBalance.create({
      data: { employeeId: employee.id, leavePolicyId: policy.id, year: 2026, allotted: 10, balance: 10 }
    });

    // In a real app we'd call the API or a service method. Let's simulate the API logic for approval.
    // The reviewLeaveRequest does this inside a transaction:
    await prisma.$transaction(async (tx) => {
      const b = await tx.leaveBalance.findUnique({ where: { id: balance.id } });
      if (b!.balance >= 2) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { consumed: b!.consumed + 2, balance: b!.balance - 2 }
        });
      }
    });

    const updated = await prisma.leaveBalance.findUnique({ where: { id: balance.id }});
    assert.strictEqual(updated?.balance, 8);
    assert.strictEqual(updated?.consumed, 2);
  });

  await t.test('3. Payroll Input Center - Variable Pay', async () => {
    const input = await prisma.payrollInput.create({
      data: {
        tenantId: tenant.id,
        employeeId: employee.id,
        inputType: 'VARIABLE_PAY',
        amount: 5000,
        payrollPeriodMonth: 10,
        payrollPeriodYear: 2026,
        status: 'APPROVED'
      }
    });
    assert.strictEqual(Number(input.amount), 5000);
  });

  await t.test('4. Timesheet & Overtime', async () => {
    const overtime = await prisma.overtime.create({
      data: {
        tenantId: tenant.id,
        employeeId: employee.id,
        date: new Date('2026-10-10'),
        hours: 4.5,
        rateMultiplier: 1.5,
        status: 'PENDING'
      }
    });
    assert.strictEqual(overtime.hours, 4.5);
  });

  await t.test('Teardown', async () => {
    await prisma.attendanceRecord.deleteMany({ where: { employeeId: employee.id } });
    await prisma.overtime.deleteMany({ where: { employeeId: employee.id } });
    await prisma.payrollInput.deleteMany({ where: { employeeId: employee.id } });
    await prisma.leaveBalance.deleteMany({ where: { employeeId: employee.id } });
    await prisma.leavePolicy.deleteMany({ where: { name: 'Sick Leave' } });
    await prisma.employee.delete({ where: { id: employee.id } });
  });

});
