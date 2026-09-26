import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import {
  createPaymentBatch,
  submitPaymentBatch,
  reconcileBatch,
  getBatches,
  getBatchById
} from '../controllers/payment.controller';

const router = Router();

router.use(requireAuth);

router.post('/batches', requirePermission('payment.manage'), createPaymentBatch);
router.post('/batches/:id/submit', requirePermission('payment.submit'), submitPaymentBatch);
router.post('/batches/:id/reconcile', requirePermission('reconciliation.manage'), reconcileBatch);
router.get('/batches', requirePermission('payment.view'), getBatches);
router.get('/batches/:id', requirePermission('payment.view'), getBatchById);

export default router;
