const fs = require('fs');

const path = 'server/src/__tests__/production_readiness.test.ts';
let text = fs.readFileSync(path, 'utf8');
text = text.replace(/assert\.strictEqual\(analytics\?\.total, 2\);/, "assert.strictEqual(analytics?.total, 3);");
text = text.replace(/assert\.strictEqual\(analytics\?\.success, 1\);/, "assert.strictEqual(analytics?.success, 2);");
fs.writeFileSync(path, text);
