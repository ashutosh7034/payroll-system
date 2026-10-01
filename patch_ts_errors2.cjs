const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      results.push(file);
    }
  });
  return results.filter(f => f.endsWith('.ts'));
}

const files = getFiles('server/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  
  content = content.replace(/req\.params\.id,/g, 'req.params.id as string,');
  content = content.replace(/where: \{ id: req\.params\.id \}/g, 'where: { id: req.params.id as string }');
  content = content.replace(/where: \{ id: req\.params\.id, tenantId/g, 'where: { id: req.params.id as string, tenantId');
  content = content.replace(/taxId, /g, '');
  content = content.replace(/rolePermissions: true/g, 'permissions: true');
  content = content.replace(/tenantId_email: \{ email: email \}/g, 'tenantId_email: { email, tenantId: req.user?.tenantId || "" }');
  content = content.replace(/tenantId_email: \{ email: String\(email\) \}/g, 'tenantId_email: { email: String(email), tenantId: String(tenantId) }');
  content = content.replace(/inst\.bankAccount/g, 'inst.accountNumber');
  content = content.replace(/req\.user\?\.employeeId/g, '(req.user as any)?.employeeId');
  content = content.replace(/id: req\.params\.([a-zA-Z0-9_]+),/g, 'id: req.params.$1 as string,');
  content = content.replace(/id: req\.params\.([a-zA-Z0-9_]+) \}/g, 'id: req.params.$1 as string }');

  if (content !== orig) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
});
