import { Router } from 'express';
import { 
  getSalaryComponents, 
  createSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
  getSalaryStructures,
  createSalaryStructure,
  getSalaryRevisions,
  createSalaryRevision,
  validateFormula,
  previewFormula,
  previewStructure
} from '../controllers/compensation.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();

router.use(requireAuth);

router.get('/components', requirePermission('compensation.view'), getSalaryComponents);
router.post('/components', requirePermission('compensation.manage'), createSalaryComponent);
router.put('/components/:id', requirePermission('compensation.manage'), updateSalaryComponent);
router.delete('/components/:id', requirePermission('compensation.manage'), deleteSalaryComponent);

router.get('/structures', requirePermission('salary_structure.view'), getSalaryStructures);
router.post('/structures', requirePermission('salary_structure.manage'), createSalaryStructure);

router.get('/revisions/:employeeId', requirePermission('salary_revision.view'), getSalaryRevisions);
router.post('/revisions/:employeeId', requirePermission('salary_revision.manage'), createSalaryRevision);

router.post('/formulas/validate', requirePermission('compensation.manage'), validateFormula);
router.post('/formulas/preview', requirePermission('compensation.manage'), previewFormula);
router.post('/structures/preview', requirePermission('salary_structure.manage'), previewStructure);

export default router;
