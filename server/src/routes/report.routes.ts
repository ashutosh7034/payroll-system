import { Router } from 'express';
import { exportPayrollRegisterCsv } from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(requireAuth);
router.get('/export/payroll-register', requirePermission('payroll.run'), exportPayrollRegisterCsv);

export default router;
