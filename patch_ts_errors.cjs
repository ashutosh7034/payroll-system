const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('server/src/**/*.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('req.params.id, tenantId')) {
    content = content.replace(/req\.params\.id,/g, 'req.params.id as string,');
    changed = true;
  }
  
  if (content.includes('where: { id: req.params.id }')) {
    content = content.replace(/where: \{ id: req\.params\.id \}/g, 'where: { id: req.params.id as string }');
    changed = true;
  }
  
  if (content.includes('where: { id: req.params.id, tenantId')) {
    content = content.replace(/where: \{ id: req\.params\.id, tenantId/g, 'where: { id: req.params.id as string, tenantId');
    changed = true;
  }

  // org.controller taxId issue
  if (content.includes('taxId, address')) {
    content = content.replace(/taxId, /g, '');
    changed = true;
  }
  
  // platformRoles.controller.ts rolePermissions
  if (content.includes('rolePermissions: true')) {
    content = content.replace(/rolePermissions: true/g, 'permissions: true');
    changed = true;
  }

  // platformUsers.controller.ts
  if (content.includes('tenantId_email: { email: email }')) {
    content = content.replace(/tenantId_email: \{ email: email \}/g, 'tenantId_email: { email, tenantId: req.user?.tenantId || "" }');
    changed = true;
  }
  if (content.includes('tenantId_email: { email: String(email) }')) {
    content = content.replace(/tenantId_email: \{ email: String\(email\) \}/g, 'tenantId_email: { email: String(email), tenantId: String(tenantId) }');
    changed = true;
  }

  // payment.service.ts bankAccount -> accountNumber
  if (content.includes('inst.bankAccount')) {
    content = content.replace(/inst\.bankAccount/g, 'inst.accountNumber');
    changed = true;
  }
  
  // rbac.middleware.ts employeeId
  if (content.includes('req.user?.employeeId')) {
    content = content.replace(/req\.user\?\.employeeId/g, '(req.user as any)?.employeeId');
    changed = true;
  }

  // Fix other id types
  content = content.replace(/id: req\.params\.([a-zA-Z0-9_]+),/g, 'id: req.params.$1 as string,');
  content = content.replace(/id: req\.params\.([a-zA-Z0-9_]+) \}/g, 'id: req.params.$1 as string }');

  if (content !== fs.readFileSync(file, 'utf8')) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
});
