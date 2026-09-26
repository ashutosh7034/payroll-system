import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PayrollRunService } from '../services/payroll-run.service';

const prisma = new PrismaClient();

// Leave Policies
import { ProrationEngine } from "../services/proration.engine";

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const employeeId = (req.params.employeeId as string) as string;
    const { date, status, punchIn, punchOut } = req.body;
    
    const attDate = new Date(date);
    const tenantId = (req as any).user?.tenantId;
    if (tenantId) await PayrollRunService.checkPeriodLock(tenantId, attDate.getMonth() + 1, attDate.getFullYear());

    const attendance = await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      update: { status, punchIn: punchIn ? new Date(punchIn) : null, punchOut: punchOut ? new Date(punchOut) : null },
      create: { employeeId, date: new Date(date), status, punchIn: punchIn ? new Date(punchIn) : null, punchOut: punchOut ? new Date(punchOut) : null }
    });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const employeeId = (req.params.employeeId as string) as string;
    const { startDate, endDate } = req.query;

    const whereClause: any = { employeeId };
    if (startDate && endDate) {
      whereClause.date = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }

    const records = await prisma.attendanceRecord.findMany({ where: whereClause, orderBy: { date: 'asc' } });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getProration = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const employeeId = (req.params.employeeId as string);
    const year = parseInt((req.params.year as string));
    const month = parseInt((req.params.month as string));

    const result = await ProrationEngine.calculate({ tenantId, employeeId, year, month });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};
