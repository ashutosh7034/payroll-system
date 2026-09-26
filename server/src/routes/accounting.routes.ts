import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import {
  getGLMappings,
  saveGLMapping,
  generateJournal,
  postJournal
} from '../controllers/accounting.controller';

const router = Router();

router.use(requireAuth);

router.get('/gl-mapping', requirePermission('accounting.view'), getGLMappings);
router.post('/gl-mapping', requirePermission('accounting.manage'), saveGLMapping);
router.post('/journals', requirePermission('accounting.manage'), generateJournal);
router.post('/journals/:id/post', requirePermission('accounting.post'), postJournal);

export default router;
