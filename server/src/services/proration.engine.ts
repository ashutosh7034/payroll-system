import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProrationInput {
  employeeId: string;
  year: number;
  month: number;
  tenantId: string;
}

export interface ProrationResult {
  calendarDays: number;
  workingDays: number;
  paidDays: number;
  unpaidDays: number;
  lopDays: number;
  prorationFactor: number; // e.g., 24/26
  attendanceSummary: {
    present: number;
    absent: number;
    halfDay: number;
    onLeave: number;
    holiday: number;
    weekoff: number;
  };
}

export class ProrationEngine {
  
  static async calculate(input: ProrationInput): Promise<ProrationResult> {
    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 0); // Last day of month
    const calendarDays = endDate.getDate();

    // Fetch calendar mappings
    const mapping = await prisma.employeeWorkCalendar.findFirst({
      where: { employeeId: input.employeeId, effectiveFrom: { lte: endDate } },
      orderBy: { effectiveFrom: 'desc' },
      include: { workCalendar: true }
    });

    const workCalendar = mapping?.workCalendar;

    // Fetch holidays
    const holidays = await prisma.holiday.findMany({
      where: { tenantId: input.tenantId, date: { gte: startDate, lte: endDate }, isActive: true }
    });
    const holidayDates = holidays.map(h => h.date.toISOString().split('T')[0]);

    // Fetch attendance
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { employeeId: input.employeeId, date: { gte: startDate, lte: endDate } }
    });

    // Compute expected working days
    let workingDays = 0;
    let expectedWeekoffs = 0;
    
    for (let d = 1; d <= calendarDays; d++) {
      const current = new Date(input.year, input.month - 1, d);
      const isoDate = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon ...

      let isWorkingDay = true;
      if (workCalendar) {
        if (dayOfWeek === 0 && !workCalendar.isSundayWorking) isWorkingDay = false;
        if (dayOfWeek === 1 && !workCalendar.isMondayWorking) isWorkingDay = false;
        if (dayOfWeek === 2 && !workCalendar.isTuesdayWorking) isWorkingDay = false;
        if (dayOfWeek === 3 && !workCalendar.isWednesdayWorking) isWorkingDay = false;
        if (dayOfWeek === 4 && !workCalendar.isThursdayWorking) isWorkingDay = false;
        if (dayOfWeek === 5 && !workCalendar.isFridayWorking) isWorkingDay = false;
        if (dayOfWeek === 6 && !workCalendar.isSaturdayWorking) isWorkingDay = false;
      } else {
        // Default to Mon-Fri if no calendar
        if (dayOfWeek === 0 || dayOfWeek === 6) isWorkingDay = false;
      }

      if (holidayDates.includes(isoDate)) {
        isWorkingDay = false;
      }

      if (isWorkingDay) {
        workingDays++;
      } else {
        expectedWeekoffs++;
      }
    }

    const summary = { present: 0, absent: 0, halfDay: 0, onLeave: 0, holiday: 0, weekoff: 0 };
    let lopDays = 0;
    
    for (const record of attendanceRecords) {
      if (record.status === 'PRESENT') summary.present++;
      if (record.status === 'ABSENT') { summary.absent++; lopDays += 1; }
      if (record.status === 'HALF_DAY') { summary.halfDay++; lopDays += 0.5; }
      if (record.status === 'ON_LEAVE') summary.onLeave++; // Paid leave
      if (record.status === 'LOP') { summary.absent++; lopDays += 1; }
      if (record.status === 'HOLIDAY') summary.holiday++;
      if (record.status === 'WEEKOFF') summary.weekoff++;
    }

    // Unrecorded working days are treated as LOPs if the period is over, 
    // but for proration, LOPs are explicitly mapped from absent/half-day.
    const paidDays = workingDays - lopDays;
    const unpaidDays = lopDays;
    const prorationFactor = workingDays > 0 ? (paidDays / workingDays) : 1;

    return {
      calendarDays,
      workingDays,
      paidDays: Math.max(0, paidDays),
      unpaidDays,
      lopDays,
      prorationFactor: Math.max(0, Math.min(1, prorationFactor)),
      attendanceSummary: summary
    };
  }
}
