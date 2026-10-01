const fs = require('fs');

const fixImports = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'\.\.\/middleware\/rbac\.middleware'/g, "'../middleware/auth'");
  content = content.replace(/requireRole/g, 'requireRole'); // this doesn't exist in auth, let's just replace checkPermission
  content = content.replace(/checkPermission/g, 'requirePermission');
  fs.writeFileSync(file, content);
};

['server/src/controllers/loan.controller.ts', 'server/src/controllers/reimbursement.controller.ts', 'server/src/controllers/arrear.controller.ts', 'server/src/routes/loan.routes.ts', 'server/src/routes/reimbursement.routes.ts', 'server/src/routes/arrear.routes.ts'].forEach(fixImports);
