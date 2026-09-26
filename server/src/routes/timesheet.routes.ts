import { Router } from 'express';
import { getTimesheets, createTimesheet, approveTimesheet } from '../controllers/timesheet.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', requirePermission('timesheet.view'), getTimesheets);
router.post('/', requirePermission('timesheet.manage'), createTimesheet);
router.post('/:id/approve', requirePermission('timesheet.approve'), approveTimesheet);

export default router;
