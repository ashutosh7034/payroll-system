import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Helper to wrap API responses
const successResponse = (data: any) => ({ success: true, data });
const errorResponse = (code: string, message: string) => ({ success: false, error: { code, message } });

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));
    
    const departments = await prisma.department.findMany({ where: { tenantId } });
    res.json(successResponse(departments));
  } catch (err) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, description, isActive } = req.body;
    if (!tenantId || !name) return res.status(400).json(errorResponse('BAD_REQUEST', 'Missing required fields'));
    
    const dept = await prisma.department.create({
      data: { tenantId, name, description, isActive }
    });

    // Audit
    await prisma.auditLog.create({
      data: { tenantId, userId: req.user?.id, action: 'CREATE', entity: 'Department', entityId: dept.id, newValue: JSON.stringify(dept) }
    });

    res.status(201).json(successResponse(dept));
  } catch (err) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const getLocations = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));
    
    const locations = await prisma.location.findMany({ where: { tenantId } });
    res.json(successResponse(locations));
  } catch (err) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const createLocation = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, address, city, state, country, isActive } = req.body;
    if (!tenantId || !name) return res.status(400).json(errorResponse('BAD_REQUEST', 'Missing required fields'));
    
    const loc = await prisma.location.create({
      data: { tenantId, name, address, city, state, country, isActive }
    });

    await prisma.auditLog.create({
      data: { tenantId, userId: req.user?.id, action: 'CREATE', entity: 'Location', entityId: loc.id, newValue: JSON.stringify(loc) }
    });

    res.status(201).json(successResponse(loc));
  } catch (err) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const getDesignations = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));
    
    const records = await prisma.designation.findMany({ where: { tenantId } });
    res.json(successResponse(records));
  } catch (err) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const createDesignation = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, description, isActive } = req.body;
    if (!tenantId || !name) return res.status(400).json(errorResponse('BAD_REQUEST', 'Missing required fields'));
    
    const rec = await prisma.designation.create({
      data: { tenantId, name, description, isActive }
    });
    res.status(201).json(successResponse(rec));
  } catch (err) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const getLegalEntities = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));
    
    const records = await prisma.legalEntity.findMany({ where: { tenantId } });
    res.json(successResponse(records));
  } catch (err) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const createLegalEntity = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, regNumber, isActive } = req.body;
    if (!tenantId || !name) return res.status(400).json(errorResponse('BAD_REQUEST', 'Missing required fields'));
    
    const rec = await prisma.legalEntity.create({
      data: { tenantId, name, regNumber, isActive }
    });
    res.status(201).json(successResponse(rec));
  } catch (err) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};
