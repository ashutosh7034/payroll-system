import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMyPayslips, getMyPayslipById, downloadMyPayslip } from '../controllers/payslip.controller';

const router = Router();

router.use(requireAuth);

// Employee Self Service (ESS) routes for payslips
router.get('/', getMyPayslips);
router.get('/:id', getMyPayslipById);
router.post('/:id/download', downloadMyPayslip);

export default router;
