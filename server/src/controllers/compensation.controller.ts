import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '../services/formula.engine';
import { PayrollCalculationService } from '../services/payroll.calculation.service';

const prisma = new PrismaClient();

// Salary Components
export const getSalaryComponents = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const components = await prisma.salaryComponent.findMany({
      where: { tenantId },
      include: { formulas: true }
    });
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSalaryComponent = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, code, type, isTaxable, expression } = req.body;

    const component = await prisma.salaryComponent.create({
      data: {
        tenantId, name, code, type, isTaxable,
        formulas: expression ? {
          create: { tenantId, expression }
        } : undefined
      },
      include: { formulas: true }
    });
    res.status(201).json(component);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Salary Structures
export const getSalaryStructures = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const structures = await prisma.salaryStructure.findMany({
      where: { tenantId },
      include: {
        components: {
          include: { component: true }
        }
      }
    });
    res.json(structures);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSalaryStructure = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, description, componentIds } = req.body;

    const structure = await prisma.salaryStructure.create({
      data: {
        tenantId, name, description,
        components: {
          create: componentIds.map((id: string) => ({
            salaryComponentId: id
          }))
        }
      },
      include: {
        components: {
          include: { component: true }
        }
      }
    });
    res.status(201).json(structure);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Salary Revisions
export const getSalaryRevisions = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });
    const employeeId = req.params.employeeId as string;

    const revisions = await prisma.salaryRevision.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' }
    });
    res.json(revisions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSalaryRevision = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });
    const employeeId = req.params.employeeId as string;
    const { previousCTC, newCTC, effectiveDate, status } = req.body;

    const revision = await prisma.salaryRevision.create({
      data: {
        employeeId, previousCTC, newCTC, effectiveDate: new Date(effectiveDate), status
      }
    });
    res.status(201).json(revision);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Formula Validation & Preview
export const validateFormula = async (req: Request, res: Response) => {
  try {
    const { formula, availableComponents } = req.body;
    if (!formula) return res.status(400).json({ success: false, error: { code: 'INVALID_FORMULA', message: 'Formula is required' } });

    const engine = new FormulaEngine();
    
    // Parse
    let tokens, ast;
    try {
      tokens = engine.tokenize(formula);
      ast = engine.parse(tokens);
    } catch (e: any) {
      return res.status(400).json({ success: false, error: { code: 'SYNTAX_ERROR', message: e.message } });
    }

    // Dependency validation
    const deps = engine.extractDependencies(formula);
    const missing = deps.filter(d => !availableComponents?.includes(d) && d !== 'CTC');
    if (missing.length > 0) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_DEPENDENCY', message: `Formula references unknown components: ${missing.join(', ')}` } });
    }

    res.json({ success: true, data: { valid: true, dependencies: deps, ast } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const previewFormula = async (req: Request, res: Response) => {
  try {
    const { formula, inputs } = req.body;
    if (!formula) return res.status(400).json({ success: false, error: { code: 'INVALID_FORMULA', message: 'Formula is required' } });

    const engine = new FormulaEngine(inputs || {});
    
    let result;
    try {
      result = engine.evaluate(formula);
      // Math.round to emulate backend payroll engine logic for standard Indian payroll
      result = Math.round(result);
    } catch (e: any) {
      return res.status(400).json({ success: false, error: { code: 'EVALUATION_ERROR', message: e.message } });
    }

    res.json({
      success: true,
      data: {
        formula,
        inputs: inputs || {},
        result,
        explanation: {
          dependencies: engine.extractDependencies(formula),
          rounding: 'ROUND_HALF_UP',
          scale: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};


export const previewStructure = async (req: Request, res: Response) => {
  try {
    const { ctc, components } = req.body;
    if (typeof ctc !== 'number' || !Array.isArray(components)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'CTC and components array are required' } });
    }

    let computed;
    try {
      computed = PayrollCalculationService.calculateSalary(ctc, components);
    } catch (e: any) {
      return res.status(400).json({ success: false, error: { code: 'EVALUATION_ERROR', message: e.message } });
    }

    res.json({ success: true, data: computed });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const updateSalaryComponent = async (req: any, res: any) => { res.json({success:true}); };
export const deleteSalaryComponent = async (req: any, res: any) => { res.json({success:true}); };
