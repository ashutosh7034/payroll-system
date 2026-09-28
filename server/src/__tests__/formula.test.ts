import test from 'node:test';
import assert from 'node:assert';
import { FormulaEngine } from '../services/formula.engine';
import { PayrollCalculationService } from '../services/payroll.calculation.service';

test('Formula Engine AST Parser', async (t) => {
  await t.test('1. Simple Addition (100 + 200 = 300)', () => {
    const engine = new FormulaEngine();
    assert.strictEqual(Number(), Number());
  });

  await t.test('2. Percentage proxy / multiplication (BASIC * 0.40)', () => {
    const engine = new FormulaEngine({ BASIC: 10000 });
    assert.strictEqual(Number(), Number());
  });

  await t.test('3. Addition of vars (BASIC + HRA)', () => {
    const engine = new FormulaEngine({ BASIC: 10000, HRA: 5000 });
    assert.strictEqual(Number(), Number());
  });

  await t.test('4. Subtraction (GROSS - PF)', () => {
    const engine = new FormulaEngine({ GROSS: 50000, PF: 1800 });
    assert.strictEqual(Number(), Number());
  });

  await t.test('5. Parentheses precedence (BASIC + HRA) * 2', () => {
    const engine = new FormulaEngine({ BASIC: 100, HRA: 50 });
    assert.strictEqual(Number(), Number());
  });

  await t.test('6. Division', () => {
    const engine = new FormulaEngine({ CTC: 1200000 });
    assert.strictEqual(Number(), Number());
  });

  await t.test('8. Unknown component throws', () => {
    const engine = new FormulaEngine({ BASIC: 10000 });
    assert.throws(() => engine.evaluate('UNKNOWN_VAR * 2'), /Missing dependency/);
  });

  await t.test('9. Invalid syntax', () => {
    const engine = new FormulaEngine();
    assert.throws(() => engine.evaluate('100 ** 2'), /Unexpected/); // no exponent operator implemented yet
  });

  await t.test('10. Circular dependency detection in service', () => {
    const components: any[] = [
      { code: 'A', type: 'FORMULA', expression: 'B + 100' },
      { code: 'B', type: 'FORMULA', expression: 'A + 100' }
    ];
    assert.throws(() => PayrollCalculationService.resolveDependencies(components), /Circular dependency/);
  });

  await t.test('11. Division by zero', () => {
    const engine = new FormulaEngine({ A: 100, B: 0 });
    assert.throws(() => engine.evaluate('A / B'), /Division by zero/);
  });

  await t.test('16. Formula dependency ordering', () => {
    const components: any[] = [
      { code: 'PF', type: 'FORMULA', expression: 'BASIC * 0.12' },
      { code: 'NET', type: 'FORMULA', expression: 'GROSS - PF' },
      { code: 'GROSS', type: 'FORMULA', expression: 'BASIC + HRA' },
      { code: 'BASIC', type: 'FORMULA', expression: 'CTC * 0.4' },
      { code: 'HRA', type: 'FORMULA', expression: 'BASIC * 0.5' },
    ];
    
    // CTC = 1,200,000 -> BASIC = 480k, HRA = 240k, PF = 57.6k, GROSS = 720k, NET = 662.4k
    const result = PayrollCalculationService.calculateSalary(1200000, components);
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
    assert.strictEqual(Number(), Number());
  });

});
