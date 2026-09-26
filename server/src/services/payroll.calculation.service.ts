import { FormulaEngine } from './formula.engine';
import { Decimal } from 'decimal.js';

export interface ComponentConfig {
  code: string;
  type: 'FIXED' | 'FORMULA' | 'STATUTORY';
  expression?: string; // Formula string or fixed amount as string
  value?: Decimal | number; // Fixed value if applicable
}

export class PayrollCalculationService {
  /**
   * Sorts components based on their dependencies (Topological Sort).
   */
  static resolveDependencies(components: ComponentConfig[]): ComponentConfig[] {
    const engine = new FormulaEngine();
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph
    for (const comp of components) {
      adjList.set(comp.code, []);
      inDegree.set(comp.code, 0);
    }

    // Build graph
    for (const comp of components) {
      if (comp.type === 'FORMULA' && comp.expression) {
        const deps = engine.extractDependencies(comp.expression);
        for (const dep of deps) {
          if (!adjList.has(dep) && dep !== 'CTC') {
            throw new Error(`Formula for ${comp.code} depends on unknown component ${dep}`);
          }
          if (adjList.has(dep)) {
            adjList.get(dep)!.push(comp.code);
            inDegree.set(comp.code, inDegree.get(comp.code)! + 1);
          }
        }
      }
    }

    // Kahn's algorithm for Topological Sort
    const queue: string[] = [];
    for (const [node, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(node);
    }

    const sortedOrder: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      sortedOrder.push(u);

      for (const v of adjList.get(u)!) {
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    if (sortedOrder.length !== components.length) {
      throw new Error('Circular dependency detected in salary formulas');
    }

    // Map sorted codes back to components
    return sortedOrder.map(code => components.find(c => c.code === code)!);
  }

  /**
   * Calculates the final values of all components based on a CTC.
   */
  static calculateSalary(ctc: Decimal | number, components: ComponentConfig[]): Record<string, Decimal> {
    const sorted = this.resolveDependencies(components);
    const variables: Record<string, Decimal> = { CTC: new Decimal(ctc) };

    for (const comp of sorted) {
      if (comp.type === 'FIXED') {
        const val = comp.value !== undefined ? new Decimal(comp.value) : (comp.expression ? new Decimal(comp.expression) : new Decimal(0));
        variables[comp.code] = val;
      } else if (comp.type === 'FORMULA' && comp.expression) {
        const engine = new FormulaEngine(variables);
        const val = engine.evaluate(comp.expression);
        variables[comp.code] = val.toDecimalPlaces(0, Decimal.ROUND_HALF_UP); // rounding to nearest integer per standard payroll
      } else if (comp.type === 'STATUTORY') {
        // Future statutory engine hooking point. Right now handled as formula if provided.
        if (comp.expression) {
            const engine = new FormulaEngine(variables);
            const val = engine.evaluate(comp.expression);
            variables[comp.code] = val.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
        } else {
            variables[comp.code] = new Decimal(0);
        }
      }
    }

    return variables;
  }
}
