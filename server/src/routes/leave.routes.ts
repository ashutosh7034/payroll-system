import { Router } from 'express';
import { getLeavePolicies, createLeavePolicy, getEmployeeLeaveBalance, createLeaveRequest, reviewLeaveRequest, getEmployeeLeaveRequests, getAllLeaveRequests } from '../controllers/leave.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission, requireSelfOrPermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(requireAuth);

router.get('/policies', requirePermission('leave.view'), getLeavePolicies);
router.post('/policies', requirePermission('leave.manage'), createLeavePolicy);

router.get('/balance/:employeeId/:year', requireSelfOrPermission('leave.view'), getEmployeeLeaveBalance);
router.post('/request/:employeeId', requireSelfOrPermission('leave.manage'), createLeaveRequest);
router.post('/review/:requestId', requirePermission('leave.approve'), reviewLeaveRequest);

router.get('/requests/:employeeId', requireSelfOrPermission('leave.view'), getEmployeeLeaveRequests);
router.get('/requests/all', requireSelfOrPermission('leave.view'), getAllLeaveRequests);
export default router;
