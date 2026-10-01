const fs = require('fs');

const controllers = [
  'server/src/controllers/platformModules.controller.ts',
  'server/src/controllers/platformRoles.controller.ts',
  'server/src/controllers/platformUsers.controller.ts'
];

controllers.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const \{ tenantId \} = req\.params;/g, 'const tenantId = req.params.tenantId as string;');
  content = content.replace(/const \{ tenantId \} = req\.query;/g, 'const tenantId = req.query.tenantId as string;');
  content = content.replace(/const \{ roleId \} = req\.params;/g, 'const roleId = req.params.roleId as string;');
  content = content.replace(/const \{ userId \} = req\.params;/g, 'const userId = req.params.userId as string;');
  
  // Also fix platformUsers.controller.ts
  if (file.includes('platformUsers.controller.ts')) {
    content = content.replace(/where: \{ email \}/g, 'where: { email } as any');
  }
  
  fs.writeFileSync(file, content);
});

// For payroll-input.controller.ts
let pic = fs.readFileSync('server/src/controllers/payroll-input.controller.ts', 'utf8');
pic = pic.replace(/remarks: data\.description/g, 'description: data.description');
pic = pic.replace(/remarks: data\.remarks/g, 'description: data.remarks');
pic = pic.replace(/remarks:/g, 'description:');
pic = pic.replace(/installmentAmount:/g, 'emiAmount:');
fs.writeFileSync('server/src/controllers/payroll-input.controller.ts', pic);

console.log('Fixed types');
