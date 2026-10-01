const fs = require('fs');
let path = 'server/src/services/loan.service.ts';
let text = fs.readFileSync(path, 'utf8');
text = text.replace(/loanId: loan\.id,\s*/g, '');
fs.writeFileSync(path, text);
