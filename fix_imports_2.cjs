const fs = require('fs');

const fixRoutes = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("import { requireAuth, requireRole, checkPermission } from '../middleware/rbac.middleware';", "import { requireAuth } from '../middleware/auth';\nimport { requirePermission } from '../middleware/rbac.middleware';");
  content = content.replace(/requireRole\(\['PLATFORM_SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'\]\)/g, "requirePermission('MANAGE_PAYROLL')");
  content = content.replace(/requireRole\(\['EMPLOYEE'\]\)/g, "requirePermission('VIEW_ESS')");
  content = content.replace(/checkPermission/g, 'requirePermission');
  fs.writeFileSync(file, content);
};

['server/src/routes/loan.routes.ts', 'server/src/routes/reimbursement.routes.ts', 'server/src/routes/arrear.routes.ts'].forEach(fixRoutes);

const fixControllers = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ AuthRequest \} from '\.\.\/middleware\/auth';/g, ""); // if present
  content = content.replace(/import \{ AuthRequest \} from '\.\.\/middleware\/rbac.middleware';/g, "import { AuthRequest } from '../middleware/auth';");
  fs.writeFileSync(file, content);
}
['server/src/controllers/loan.controller.ts', 'server/src/controllers/reimbursement.controller.ts', 'server/src/controllers/arrear.controller.ts'].forEach(fixControllers);

