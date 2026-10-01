import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

const requireLinkedEmployee = (req: any, res: any, next: any) => {
  if (!(req.user as any)?.employeeId) {
    return res.status(403).json({ error: 'No linked employee record found for this user.' });
  }
  next();
};

router.use(requireLinkedEmployee);

// GET /api/me
router.get('/', async (req: any, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.user.employeeId },
      include: { department: true, designation: true, location: true }
    });
    res.json({ data: employee });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me/attendance
router.get('/attendance', async (req: any, res) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { employeeId: req.user.employeeId, tenantId: req.user.tenantId },
      orderBy: { date: 'desc' }
    });
    res.json({ data: records });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/me/attendance
router.post('/attendance', async (req: any, res) => {
  try {
    const { date, status, punchIn } = req.body;
    let record = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: req.user.employeeId, date: new Date(date) } }
    });

    if (record) {
      record = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: { status, punchIn: punchIn ? new Date(punchIn) : null }
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          employeeId: req.user.employeeId,
          date: new Date(date),
          status,
          punchIn: punchIn ? new Date(punchIn) : null
        }
      });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me/leave
router.get('/leave', async (req: any, res) => {
  try {
    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: req.user.employeeId, employee: { tenantId: req.user.tenantId } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me/leave/balance
router.get('/leave/balance/:year', async (req: any, res) => {
  try {
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: req.user.employeeId, year: parseInt(req.params.year) },
      include: { policy: true }
    });
    res.json({ data: balances });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/me/leave
router.post('/leave', async (req: any, res) => {
  try {
    const { leavePolicyId, startDate, endDate, days, reason } = req.body;
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: req.user.employeeId,
        leavePolicyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason,
        status: 'PENDING'
      }
    });
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me/payslips
router.get('/payslips', async (req: any, res) => {
  try {
    const payslips = await prisma.payslip.findMany({
      where: { employeeId: req.user.employeeId, payrollRun: { tenantId: req.user.tenantId, status: 'FINALIZED' } },
      include: { payrollRun: true },
      orderBy: { payrollRun: { runPeriodYear: 'desc' } }
    });
    res.json({ data: payslips });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me/payslips/:id
router.get('/payslips/:id', async (req: any, res) => {
  try {
    const payslip = await prisma.payslip.findFirst({
      where: { id: req.params.id as string, employeeId: req.user.employeeId, payrollRun: { tenantId: req.user.tenantId } },
      include: { components: true, payrollRun: true, employee: true }
    });
    if (!payslip) return res.status(404).json({ error: 'Payslip not found' });
    res.json({ data: payslip });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me/payslips/:id/download
router.get('/payslips/:id/download', async (req: any, res) => {
  try {
    const payslip = await prisma.payslip.findFirst({
      where: { id: req.params.id as string, employeeId: req.user.employeeId, payrollRun: { tenantId: req.user.tenantId } }
    });
    if (!payslip) return res.status(403).json({ error: 'Forbidden' });
    
    // Simulating PDF generation
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${payslip.id}.pdf`);
    res.send('%PDF-1.4 Mock PDF Content');
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
