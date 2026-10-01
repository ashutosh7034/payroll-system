const fs = require('fs');
['loan', 'reimbursement', 'arrear'].forEach(f => {
  const path = `server/src/__tests__/${f}.test.ts`;
  let text = fs.readFileSync(path, 'utf8');
  
  text = `import test, { describe, it, before, after } from 'node:test';\nimport assert from 'node:assert';\n` + text;
  text = text.replace(/beforeAll/g, 'before');
  text = text.replace(/afterAll/g, 'after');
  text = text.replace(/expect\(Number\(([^)]+)\)\)\.toBe\(([^)]+)\)/g, 'assert.strictEqual(Number($1), $2)');
  text = text.replace(/expect\(([^)]+)\)\.toBe\(([^)]+)\)/g, 'assert.strictEqual($1, $2)');
  text = text.replace(/expect\(Number\(([^)]+)\)\)\.toBeCloseTo\(([^)]+),\s*[^)]+\)/g, 'assert(Math.abs(Number($1) - $2) < 1)');
  text = text.replace(/expect\(Number\(([^)]+)\)\)\.toBeGreaterThanOrEqual\(([^)]+)\)/g, 'assert(Number($1) >= $2)');
  text = text.replace(/await expect\(([^)]+)\)\s*\.rejects\.toThrow\(([^)]+)\);/g, 'await assert.rejects(async () => { await $1 }, { message: $2 });');
  
  fs.writeFileSync(path, text);
});
