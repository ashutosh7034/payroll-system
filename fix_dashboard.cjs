const fs = require('fs');

let controller = fs.readFileSync('server/src/controllers/dashboard.controller.ts', 'utf8');

// Inject roles
controller = controller.replace(
  'const tenantId = (req as any).user?.tenantId;',
  'const tenantId = (req as any).user?.tenantId;\n    const roles = (req as any).user?.roles || [];'
);

// Inject isEmployeeOnly logic
let employeeLogic = `
    const isEmployeeOnly = req.query.isEmployeeOnly === 'true';
    if (isEmployeeOnly) {
      const employeeId = (req as any).user?.employeeId;
      if (!employeeId) return res.status(401).json({ error: 'No employee record linked' });

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId }
      });
      if (!employee || employee.tenantId !== tenantId) return res.status(404).json({ error: 'Employee not found' });

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Real Attendance
      const totalDays = new Date(currentYear, currentMonth, 0).getDate();
      const presentDays = await prisma.attendanceRecord.count({
        where: { employeeId, date: { gte: new Date(currentYear, currentMonth - 1, 1) }, status: 'PRESENT' }
      });
      const attendancePercent = Math.round((presentDays / totalDays) * 100) || 0;

      // Real Leave
      const leaveBalances = await prisma.leaveBalance.findMany({
        where: { employeeId, year: currentYear }
      });
      const totalBalance = leaveBalances.reduce((sum: number, b: any) => sum + b.balance, 0);

      // Latest Payslips
      const recentPayslipsDb = await prisma.payslip.findMany({
        where: { employeeId, status: 'FINALIZED' },
        include: { payrollRun: true },
        orderBy: { payrollRun: { runPeriodYear: 'desc' } },
        take: 3
      });

      const recentPayslips = recentPayslipsDb.map((p: any) => ({
        month: p.payrollRun.runPeriodMonth,
        year: p.payrollRun.runPeriodYear,
        netPay: Number(p.netPay)
      }));

      const latestNetPay = recentPayslips.length > 0 ? recentPayslips[0].netPay : 0;

      return res.json({
        type: 'EMPLOYEE',
        employee,
        metrics: {
          latestNetPay,
          leaveBalance: totalBalance,
          attendancePercent
        },
        recentPayslips
      });
    }
`;

controller = controller.replace(
  'const { period, entity, location, department } = req.query;',
  'const { period, entity, location, department } = req.query;\n' + employeeLogic
);

fs.writeFileSync('server/src/controllers/dashboard.controller.ts', controller);
console.log('done');
