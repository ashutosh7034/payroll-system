import { Router } from 'express';
import { createRun, getPayrollRuns, getRunById, calculateRun, approveRun, lockRun, finalizeRun } from '../controllers/payroll.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(requireAuth);

router.get('/runs', requirePermission('payroll.view'), getPayrollRuns);
router.post('/runs', requirePermission('payroll.manage'), createRun);
router.get('/runs/:id', requirePermission('payroll.view'), getRunById);
router.post('/runs/:id/calculate', requirePermission('payroll.calculate'), calculateRun);
router.post('/runs/:id/approve', requirePermission('payroll.approve'), approveRun);
router.post('/runs/:id/lock', requirePermission('payroll.lock'), lockRun);
router.post('/runs/:id/finalize', requirePermission('payroll.finalize'), finalizeRun);

export default router;
