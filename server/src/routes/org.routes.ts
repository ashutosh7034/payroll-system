import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac.middleware';
import * as orgController from '../controllers/org.controller';

const router = Router();

// Org configuration requires authentication and specific permissions
router.use(requireAuth);

router.get('/departments', requirePermission('organization.view'), orgController.getDepartments);
router.post('/departments', requirePermission('organization.manage'), orgController.createDepartment);
router.put('/departments/:id', requirePermission('organization.manage'), orgController.updateDepartment);
router.delete('/departments/:id', requirePermission('organization.manage'), orgController.deleteDepartment);

router.get('/locations', requirePermission('organization.view'), orgController.getLocations);
router.post('/locations', requirePermission('organization.manage'), orgController.createLocation);
router.put('/locations/:id', requirePermission('organization.manage'), orgController.updateLocation);
router.delete('/locations/:id', requirePermission('organization.manage'), orgController.deleteLocation);

router.get('/designations', requirePermission('organization.view'), orgController.getDesignations);
router.post('/designations', requirePermission('organization.manage'), orgController.createDesignation);

router.get('/legal-entities', requirePermission('organization.view'), orgController.getLegalEntities);
router.post('/legal-entities', requirePermission('organization.manage'), orgController.createLegalEntity);

export default router;
