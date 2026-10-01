const fs = require('fs');

// 1. payroll.engine.ts
let pe = fs.readFileSync('server/src/services/payroll.engine.ts', 'utf8');
pe = pe.replace(/let arrears = 0;\n\s+let variablePay = 0;\n\s+let bonus = 0;\n\s+let arrears = 0;/g, 'let variablePay = 0;\n        let bonus = 0;\n        let arrears = 0;');
pe = pe.replace(/let variablePay = 0;\n\s+let bonus = 0;\n\s+let arrears = 0;/g, '');
pe = pe.replace(/inputs\.forEach/g, 'let variablePay = 0;\n        let bonus = 0;\n        let arrears = 0;\n        inputs.forEach');
fs.writeFileSync('server/src/services/payroll.engine.ts', pe);

// 2. payroll-input.controller.ts
let pic = fs.readFileSync('server/src/controllers/payroll-input.controller.ts', 'utf8');
pic = pic.replace(/remarks:/g, 'description:');
pic = pic.replace(/installmentAmount:/g, 'emiAmount:');
pic = pic.replace(/categoryId: 'OTHER'/g, "categoryId: req.body.categoryId || 'DEFAULT'"); // It needs categoryId
fs.writeFileSync('server/src/controllers/payroll-input.controller.ts', pic);

console.log('Fixed more errors');
