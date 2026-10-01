import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac.middleware';
import * as reimCtrl from '../controllers/reimbursement.controller';

const router = Router();

router.use(requireAuth);

// Categories
router.post('/categories', requirePermission('MANAGE_PAYROLL'), reimCtrl.createCategory);
router.get('/categories', reimCtrl.getCategories);

// Employee ESS
router.post('/my-claims', requirePermission('VIEW_ESS'), reimCtrl.submitClaim);
router.get('/my-claims', requirePermission('VIEW_ESS'), reimCtrl.getMyClaims);

// Admin / HR / Finance
router.get('/', requirePermission('VIEW_PAYROLL'), reimCtrl.getClaims);
router.post('/', requirePermission('MANAGE_PAYROLL'), reimCtrl.submitClaim); 
router.post('/:id/approve', requirePermission('MANAGE_PAYROLL'), reimCtrl.approveClaimHR);
router.post('/:id/verify', requirePermission('MANAGE_PAYROLL'), reimCtrl.verifyClaimFinance);
router.post('/:id/reject', requirePermission('MANAGE_PAYROLL'), reimCtrl.rejectClaim);

export default router;
