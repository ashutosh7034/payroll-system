import { Router } from 'express';
import { login, setupInitialTenant } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/setup', setupInitialTenant);

export default router;
