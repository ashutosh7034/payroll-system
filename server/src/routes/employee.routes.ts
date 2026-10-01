import { Router } from 'express';
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, uploadEmployeeDocument, deleteEmployeeDocument } from '../controllers/employee.controller';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('employee.view'), getEmployees);
router.get('/:id', requirePermission('employee.view'), getEmployeeById);
router.post('/', requirePermission('employee.create'), createEmployee);
router.put('/:id', requirePermission('employee.update'), updateEmployee);

router.post('/:id/documents', requirePermission('employee.update'), uploadEmployeeDocument);
router.delete('/:id/documents/:docId', requirePermission('employee.update'), deleteEmployeeDocument);

export default router;
