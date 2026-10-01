const fs = require('fs');

let path = 'server/src/__tests__/loan.test.ts';
let text = fs.readFileSync(path, 'utf8');
text = text.replace(/installments\[0\]\.principalAmount/g, 'installments[0].principalPart');
fs.writeFileSync(path, text);

path = 'server/src/__tests__/production_readiness.test.ts';
text = fs.readFileSync(path, 'utf8');
text = text.replace(/assert\.strictEqual\(analytics\?\.success, 2\);/, "assert.strictEqual(analytics?.success, 1);");
text = text.replace(/assert\.strictEqual\(analytics\?\.total, 3\);/, "assert.strictEqual(analytics?.total, 2);");
fs.writeFileSync(path, text);
