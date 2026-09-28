import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

import authRoutes from './routes/auth.routes';
import platformRoutes from './routes/platform.routes';
import employeeRoutes from './routes/employee.routes';
import compensationRoutes from './routes/compensation.routes';
import attendanceRoutes from './routes/attendance.routes';
import payrollRoutes from './routes/payroll.routes';
import paymentRoutes from './routes/payment.routes';
import accountingRoutes from './routes/accounting.routes';
import dashboardRoutes from './routes/dashboard.routes';
import orgRoutes from './routes/org.routes';
import calendarRoutes from './routes/calendar.routes';
import leaveRoutes from './routes/leave.routes';
import payrollInputRoutes from './routes/payroll-input.routes';
import timesheetRoutes from './routes/timesheet.routes';
import reportRoutes from './routes/report.routes';
import payslipRoutes from './routes/payslip.routes';

const app = express();
const port = process.env.PORT || 4000;
const prisma = new PrismaClient();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || false) 
    : '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/compensation', compensationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll-inputs', payrollInputRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payslips', payslipRoutes);

// Basic health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port as number, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

