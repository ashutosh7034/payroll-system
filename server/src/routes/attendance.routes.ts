import { Router } from 'express';
import { 
  markAttendance,
  getAttendanceRecords,
  getProration
} from '../controllers/attendance.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(requireAuth);

router.post('/records/:employeeId', requirePermission('attendance.manage'), markAttendance);
router.get('/records/:employeeId', requirePermission('attendance.view'), getAttendanceRecords);

router.get('/proration/:employeeId/:year/:month', requirePermission('payroll.view'), getProration);

export default router;
