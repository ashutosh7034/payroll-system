const fs = require('fs');
['loan', 'reimbursement', 'arrear'].forEach(f => {
  const path = `server/src/__tests__/${f}.test.ts`;
  let text = fs.readFileSync(path, 'utf8');
  text = text.replace(/, enabledModules: \['PAYROLL', '[^']+'\]/g, '');
  fs.writeFileSync(path, text);
});
