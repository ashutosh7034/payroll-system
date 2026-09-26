import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac.middleware';
import * as orgController from '../controllers/org.controller';

const router = Router();

// Org configuration requires authentication and specific permissions
router.use(requireAuth);

router.get('/departments', requirePermission('organization.view'), orgController.getDepartments);
router.post('/departments', requirePermission('organization.manage'), orgController.createDepartment);

router.get('/locations', requirePermission('organization.view'), orgController.getLocations);
router.post('/locations', requirePermission('organization.manage'), orgController.createLocation);

router.get('/designations', requirePermission('organization.view'), orgController.getDesignations);
router.post('/designations', requirePermission('organization.manage'), orgController.createDesignation);

router.get('/legal-entities', requirePermission('organization.view'), orgController.getLegalEntities);
router.post('/legal-entities', requirePermission('organization.manage'), orgController.createLegalEntity);

export default router;
