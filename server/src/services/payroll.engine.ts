import { PrismaClient } from '@prisma/client';
import { ProrationEngine } from './proration.engine';
import { PayrollCalculationService, ComponentConfig } from './payroll.calculation.service';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

export class PayrollEngine {
  
  static async calculateRun(tenantId: string, runId: string) {
    const run = await prisma.payrollRun.findFirst({ where: { tenantId, id: runId } });
    if (!run) throw new Error('Run not found');
    if (run.status !== 'DRAFT' && run.status !== 'VALIDATION_FAILED' && run.status !== 'CALCULATED') {
      throw new Error(`Cannot calculate run in status ${run.status}`);
    }

    // Set to calculating
    await prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'CALCULATING', calculationStart: new Date() }
    });

    const employees = await prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE' },
      include: { taxProfile: true }
    });

    let successCount = 0;
    let exceptionCount = 0;
    let failedCount = 0;
    let totalGross = new Decimal(0);
    let totalDeductions = new Decimal(0);
    let totalNet = new Decimal(0);
    let totalEmployerCost = new Decimal(0);

    const endDate = new Date(run.runPeriodYear, run.runPeriodMonth, 0);

    const structures = await prisma.salaryStructure.findMany({
      where: { tenantId, isActive: true },
      include: { components: { include: { component: { include: { formulas: true } } } } }
    });

    await prisma.payslipComponent.deleteMany({ where: { payslip: { payrollRunId: runId } } });
    await prisma.payslip.deleteMany({ where: { payrollRunId: runId } });
    await prisma.payrollException.deleteMany({ where: { payrollRunId: runId } });

    for (const emp of employees) {
      try {
        const revisions = await prisma.salaryRevision.findMany({
          where: { employeeId: emp.id, status: 'APPROVED', effectiveDate: { lte: endDate } },
          orderBy: { effectiveDate: 'desc' },
          take: 1
        });

        if (revisions.length === 0) {
          await this.createException(runId, emp.id, 'ERROR', 'NO_SALARY_REVISION', 'No active salary revision found for period');
          failedCount++;
          continue;
        }

        const revision = revisions[0];
        const ctc = revision.newCTC;

        const structure = structures[0];
        if (!structure) {
          await this.createException(runId, emp.id, 'ERROR', 'NO_STRUCTURE', 'No active salary structure found');
          failedCount++;
          continue;
        }

        const proration = await ProrationEngine.calculate({
          tenantId, employeeId: emp.id, year: run.runPeriodYear, month: run.runPeriodMonth
        });

        const inputs = await prisma.payrollInput.findMany({
          where: { employeeId: emp.id, payrollPeriodMonth: run.runPeriodMonth, payrollPeriodYear: run.runPeriodYear, status: 'APPROVED' }
        });

        const overtimes = await prisma.overtime.findMany({
          where: { employeeId: emp.id, payrollPeriodMonth: run.runPeriodMonth, payrollPeriodYear: run.runPeriodYear, status: 'APPROVED' }
        });

        let variablePay = 0;
        let bonus = 0;
        let arrears = 0;
        inputs.forEach(i => {
          if (i.inputType === 'VARIABLE_PAY') variablePay += Number(i.amount);
          if (i.inputType === 'BONUS') bonus += Number(i.amount);
          if (i.inputType === 'ARREARS') arrears += Number(i.amount);
        });

        let overtimeAmount = overtimes.reduce((acc, curr) => acc + (curr.hours * curr.rateMultiplier * 500), 0);

        // Convert Prisma components to ComponentConfig for calculation service
        const calcComponents: ComponentConfig[] = structure.components.map(sc => {
          const c = sc.component;
          let formula = c.formulas[0]?.expression || '';
          if (formula) {
            // inject variables statically or dynamically
            // FormulaEngine already accepts variables, but our old calc Salary expects expressions.
            // Actually, we should just let PRORATION_FACTOR etc pass in through a context, but calculateSalary only takes CTC right now.
            // Let's replace PRORATION_FACTOR in the formula string as a hack for now, or just pass context variables.
            // Since calculateSalary only takes CTC, I'll replace keywords in the string before passing.
            formula = formula.replace('PRORATION_FACTOR', `${proration.prorationFactor}`);
            formula = formula.replace('WORKING_DAYS', `${proration.workingDays}`);
            formula = formula.replace('PAID_DAYS', `${proration.paidDays}`);
          }
          return {
            code: c.code,
            type: c.formulas[0]?.expression === 'FIXED' ? 'FIXED' : (c.type === 'STATUTORY' ? 'STATUTORY' : 'FORMULA'),
            expression: formula !== 'FIXED' ? formula : undefined,
            value: formula === 'FIXED' ? 0 : undefined // Needs actual handling for fixed, but our engine calculates mostly
          };
        });

        // Add special dynamic components for calculation so they resolve properly
        calcComponents.push({ code: 'VARIABLE_PAY', type: 'FIXED', value: variablePay });
        calcComponents.push({ code: 'BONUS', type: 'FIXED', value: bonus });
        calcComponents.push({ code: 'ARREARS', type: 'FIXED', value: arrears });
        calcComponents.push({ code: 'OVERTIME_AMOUNT', type: 'FIXED', value: overtimeAmount });

        const computedVars = PayrollCalculationService.calculateSalary(ctc, calcComponents);
        
        let empGross = new Decimal(0);
        let empDeductions = new Decimal(0);
        let empNet = new Decimal(0);
        
        const componentRecords: any[] = [];

        for (const sc of structure.components) {
          const comp = sc.component;
          const amount = (computedVars[comp.code] || new Decimal(0)).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

          if (comp.type === 'EARNING') {
            empGross = empGross.plus(amount);
          } else if (comp.type === 'DEDUCTION' || comp.type === 'STATUTORY') {
            empDeductions = empDeductions.plus(amount);
          }

          componentRecords.push({
            salaryComponentId: comp.id,
            name: comp.name,
            code: comp.code,
            type: comp.type,
            amount: amount,
            source: 'Salary Structure',
            calculationBasis: comp.formulas[0]?.expression
          });
        }

        if (variablePay > 0) {
          empGross = empGross.plus(variablePay);
          componentRecords.push({ name: 'Variable Pay', type: 'EARNING', amount: variablePay, source: 'Payroll Input' });
        }
        if (bonus > 0) {
          empGross = empGross.plus(bonus);
          componentRecords.push({ name: 'Bonus', type: 'EARNING', amount: bonus, source: 'Payroll Input' });
        }
        if (arrears > 0) {
          empGross = empGross.plus(arrears);
          componentRecords.push({ name: 'Arrears', type: 'EARNING', amount: arrears, source: 'Payroll Input' });
        }
        if (overtimeAmount > 0) {
          empGross = empGross.plus(overtimeAmount);
          componentRecords.push({ name: 'Overtime', type: 'EARNING', amount: overtimeAmount, source: 'Timesheet' });
        }

        empNet = empGross.minus(empDeductions);

        if (empNet.isNegative()) {
          await this.createException(runId, emp.id, 'ERROR', 'NEGATIVE_NET', 'Net pay is less than 0');
          failedCount++;
          continue;
        }

        const payslip = await prisma.payslip.create({
          data: {
            payrollRunId: runId,
            employeeId: emp.id,
            workingDays: proration.workingDays,
            paidDays: proration.paidDays,
            lopDays: proration.lopDays,
            grossPay: empGross.toNumber(),
            totalDeductions: empDeductions.toNumber(),
            netPay: empNet.toNumber(),
            employerContribution: 0,
            employerCost: empGross.toNumber(),
            status: 'SUCCESS'
          }
        });

        await prisma.payslipComponent.createMany({
          data: componentRecords.map(c => ({
            payslipId: payslip.id,
            ...c,
            amount: c.amount instanceof Decimal ? c.amount.toNumber() : c.amount
          }))
        });

        totalGross = totalGross.plus(empGross);
        totalDeductions = totalDeductions.plus(empDeductions);
        totalNet = totalNet.plus(empNet);
        totalEmployerCost = totalEmployerCost.plus(empGross);
        successCount++;

      } catch (err: any) {
        await this.createException(runId, emp.id, 'ERROR', 'CALC_ERROR', err.message);
        failedCount++;
      }
    }

    await prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: failedCount > 0 ? 'VALIDATION_FAILED' : 'CALCULATED',
        calculationEnd: new Date(),
        employeeCount: employees.length,
        successCount,
        exceptionCount: failedCount,
        failedCount,
        totalGross: totalGross.toNumber(),
        totalDeductions: totalDeductions.toNumber(),
        totalNet: totalNet.toNumber(),
        totalEmployerCost: totalEmployerCost.toNumber()
      }
    });
  }

  static async createException(runId: string, employeeId: string, severity: string, code: string, message: string) {
    return prisma.payrollException.create({
      data: { payrollRunId: runId, employeeId, severity, code, message, status: 'OPEN' }
    });
  }
}
