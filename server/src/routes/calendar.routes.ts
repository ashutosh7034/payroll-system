import { Router } from 'express';
import { getHolidays, createHoliday, getWorkCalendars, createWorkCalendar, assignWorkCalendar } from '../controllers/calendar.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(requireAuth);

router.get('/holidays', requirePermission('calendar.view'), getHolidays);
router.post('/holidays', requirePermission('calendar.manage'), createHoliday);

router.get('/work-calendars', requirePermission('calendar.view'), getWorkCalendars);
router.post('/work-calendars', requirePermission('calendar.manage'), createWorkCalendar);
router.post('/work-calendars/assign', requirePermission('calendar.manage'), assignWorkCalendar);

export default router;
