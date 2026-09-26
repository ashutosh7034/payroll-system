import { Router } from 'express';
import { getLeavePolicies, createLeavePolicy, getEmployeeLeaveBalance, createLeaveRequest, reviewLeaveRequest } from '../controllers/leave.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(requireAuth);

router.get('/policies', requirePermission('leave.view'), getLeavePolicies);
router.post('/policies', requirePermission('leave.manage'), createLeavePolicy);

router.get('/balance/:employeeId/:year', requirePermission('leave.view'), getEmployeeLeaveBalance);
router.post('/request/:employeeId', requirePermission('leave.request'), createLeaveRequest);
router.post('/review/:requestId', requirePermission('leave.approve'), reviewLeaveRequest);

export default router;
