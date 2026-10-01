import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac.middleware';
import * as arrearCtrl from '../controllers/arrear.controller';

const router = Router();

router.use(requireAuth);

router.post('/', requirePermission('MANAGE_PAYROLL'), arrearCtrl.createArrear);
router.get('/', requirePermission('VIEW_PAYROLL'), arrearCtrl.getArrears);

router.get('/my-arrears', requirePermission('VIEW_ESS'), arrearCtrl.getMyArrears);

router.post('/:id/approve', requirePermission('MANAGE_PAYROLL'), arrearCtrl.approveArrear);

export default router;
