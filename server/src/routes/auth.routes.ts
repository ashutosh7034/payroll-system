import { Router } from 'express';
import { login, setupInitialTenant, changePassword, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/setup', setupInitialTenant);
router.post('/change-password', requireAuth, changePassword);
router.get('/me', requireAuth, me);

export default router;
