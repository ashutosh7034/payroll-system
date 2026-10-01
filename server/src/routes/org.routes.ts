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
router.put('/legal-entities/:id', requirePermission('organization.manage'), orgController.updateLegalEntity);
router.delete('/legal-entities/:id', requirePermission('organization.manage'), orgController.deleteLegalEntity);

router.get('/cost-centers', requirePermission('organization.view'), orgController.getCostCenters);
router.post('/cost-centers', requirePermission('organization.manage'), orgController.createCostCenter);
router.put('/cost-centers/:id', requirePermission('organization.manage'), orgController.updateCostCenter);
router.delete('/cost-centers/:id', requirePermission('organization.manage'), orgController.deleteCostCenter);

export default router;
