import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- HOLIDAYS ---

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const holidays = await prisma.holiday.findMany({ 
      where: { tenantId },
      include: { location: true },
      orderBy: { date: 'asc' }
    });
    res.json({ success: true, data: holidays });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { name, date, type, description, locationId } = req.body;
    
    // Duplicate date check
    const existing = await prisma.holiday.findFirst({
      where: { tenantId, date: new Date(date), locationId: locationId || null }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE_HOLIDAY', message: 'Holiday already exists on this date for this scope' } });
    }

    const holiday = await prisma.holiday.create({
      data: { tenantId, name, date: new Date(date), type: type || 'COMPANY', description, locationId }
    });
    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

// --- WORK CALENDARS ---

export const getWorkCalendars = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const calendars = await prisma.workCalendar.findMany({ where: { tenantId } });
    res.json({ success: true, data: calendars });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const createWorkCalendar = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { name, description, isMondayWorking, isTuesdayWorking, isWednesdayWorking, isThursdayWorking, isFridayWorking, isSaturdayWorking, isSundayWorking } = req.body;
    
    const calendar = await prisma.workCalendar.create({
      data: {
        tenantId, name, description,
        isMondayWorking: isMondayWorking ?? true,
        isTuesdayWorking: isTuesdayWorking ?? true,
        isWednesdayWorking: isWednesdayWorking ?? true,
        isThursdayWorking: isThursdayWorking ?? true,
        isFridayWorking: isFridayWorking ?? true,
        isSaturdayWorking: isSaturdayWorking ?? false,
        isSundayWorking: isSundayWorking ?? false
      }
    });
    res.status(201).json({ success: true, data: calendar });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const assignWorkCalendar = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const { employeeId, workCalendarId, effectiveFrom } = req.body;

    const mapping = await prisma.employeeWorkCalendar.create({
      data: { employeeId, workCalendarId, effectiveFrom: new Date(effectiveFrom) }
    });

    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};
