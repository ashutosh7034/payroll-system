import { Router } from 'express';
import { getReportData, exportReportCsv, exportReportPdf } from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/:type', getReportData);
router.get('/:type/export', exportReportCsv);
router.get('/:type/export-pdf', exportReportPdf);

export default router;
