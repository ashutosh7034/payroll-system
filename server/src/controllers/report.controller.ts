import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const exportPayrollRegisterCsv = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const { runPeriodMonth, runPeriodYear } = req.query;
    if (!runPeriodMonth || !runPeriodYear) return res.status(400).json({ error: 'Missing period' });

    const run = await prisma.payrollRun.findFirst({
      where: { 
        tenantId, 
        runPeriodMonth: parseInt(runPeriodMonth as string), 
        runPeriodYear: parseInt(runPeriodYear as string),
        status: 'FINALIZED'
      }
    });

    if (!run) return res.status(404).json({ error: 'Finalized payroll run not found' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payroll_register_${runPeriodMonth}_${runPeriodYear}.csv"`);
    
    // Write headers
    res.write('Employee ID,Name,Department,Gross Pay,Total Deductions,Net Pay\n');

    const CHUNK_SIZE = 500;
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const payslips = await prisma.payslip.findMany({
        where: { payrollRunId: run.id },
        take: CHUNK_SIZE,
        skip: cursor ? 1 : 0,
        ...(cursor ? { cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        include: {
          employee: {
            include: { department: true }
          }
        }
      });

      if (payslips.length === 0) {
        hasMore = false;
        break;
      }

      // Stream chunk
      for (const slip of payslips) {
        const empId = `"${slip.employee.employeeId}"`;
        const name = `"${slip.employee.firstName} ${slip.employee.lastName}"`;
        const dept = `"${slip.employee.department?.name || 'N/A'}"`;
        const gross = slip.grossPay;
        const ded = slip.totalDeductions;
        const net = slip.netPay;
        
        res.write(`${empId},${name},${dept},${gross},${ded},${net}\n`);
      }

      if (payslips.length === CHUNK_SIZE) {
        cursor = payslips[payslips.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.end();
    }
  }
};
