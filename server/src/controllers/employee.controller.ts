import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const successResponse = (data: any) => ({ success: true, data });
const errorResponse = (code: string, message: string) => ({ success: false, error: { code, message } });

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));
    
    // Support filtering
    const { departmentId, locationId, status } = req.query;
    
    const whereClause: any = { tenantId };
    if (departmentId && departmentId !== 'All Departments') whereClause.departmentId = departmentId as string;
    if (locationId && locationId !== 'All Locations') whereClause.locationId = locationId as string;
    if (status && status !== 'All Statuses') whereClause.status = status as string;

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
        location: true,
        legalEntity: true,
        designation: true,
        employment: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(successResponse(employees));
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const getEmployeeById = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));
    
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id as string, tenantId },
      include: {
        department: true,
        location: true,
        legalEntity: true,
        designation: true,
        costCenter: true,
        manager: true,
        employment: true,
        bankDetails: true,
        taxProfile: true,
        history: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!employee) return res.status(404).json(errorResponse('NOT_FOUND', 'Employee not found'));

    res.json(successResponse(employee));
  } catch (error) {
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));

    const { 
      employeeId, firstName, lastName, email, status,
      departmentId, locationId, legalEntityId, designationId, costCenterId, managerId,
      employmentType, joiningDate, exitDate,
      bankName, accountNumber, ifscCode, accountType,
      panNumber, taxRegime,
      createLogin, password
    } = req.body;

    // Backend validations
    if (!employeeId || !firstName || !lastName || !joiningDate || !employmentType) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Missing required fields'));
    }

    if (createLogin && !email) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Email is required to create a login'));
    }

    // Check unique employeeId for tenant
    const existing = await prisma.employee.findUnique({
      where: { tenantId_employeeId: { tenantId, employeeId } }
    });
    if (existing) {
      return res.status(400).json(errorResponse('DUPLICATE_ID', 'Employee ID already exists for this tenant'));
    }

    // Relation integrity checks
    if (departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: departmentId, tenantId }});
      if (!dept) return res.status(400).json(errorResponse('INVALID_RELATION', 'Invalid department'));
    }
    if (locationId) {
      const loc = await prisma.location.findFirst({ where: { id: locationId, tenantId }});
      if (!loc) return res.status(400).json(errorResponse('INVALID_RELATION', 'Invalid location'));
    }
    // ... we could do similar for designation, legalEntity, etc.

    // Execute in transaction
    const employee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          tenantId, employeeId, firstName, lastName, email, status: status || 'ACTIVE',
          departmentId, locationId, legalEntityId, designationId, costCenterId, managerId
        }
      });

      await tx.employment.create({
        data: {
          employeeId: emp.id,
          employmentType,
          joiningDate: new Date(joiningDate),
          exitDate: exitDate ? new Date(exitDate) : null
        }
      });

      if (accountNumber) {
        await tx.employeeBank.create({
          data: { employeeId: emp.id, bankName: bankName || '', accountNumber, ifscCode: ifscCode || '', accountType: accountType || 'SAVINGS' }
        });
      }

      if (panNumber || taxRegime) {
        await tx.employeeTaxProfile.create({
          data: { employeeId: emp.id, panNumber, taxRegime: taxRegime || 'NEW' }
        });
      }

      await tx.auditLog.create({
        data: { tenantId, userId, action: 'CREATE', entity: 'Employee', entityId: emp.id, newValue: JSON.stringify({ employeeId, firstName, lastName }) }
      });

      if (createLogin) {
        let empRole = await tx.role.findUnique({ where: { name: 'EMPLOYEE' } });
        if (!empRole) {
          empRole = await tx.role.create({ data: { name: 'EMPLOYEE', description: 'Employee Self Service' } });
        }
        
        const bcrypt = require('bcryptjs');
        const defaultPassword = password || Math.random().toString(36).slice(-8) + 'A1!';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        const existingUser = await tx.user.findFirst({ where: { email, tenantId } });
        if (existingUser) {
          throw new Error('User email already exists for this tenant');
        }

        const user = await tx.user.create({
          data: {
            tenantId,
            email,
            firstName,
            lastName,
            passwordHash
          }
        });

        await tx.userRole.create({
          data: { userId: user.id, roleId: empRole.id }
        });

        await tx.auditLog.create({
          data: { tenantId, userId, action: 'CREATE', entity: 'User', entityId: user.id, newValue: JSON.stringify({ email, roles: ['EMPLOYEE'] }) }
        });
      }

      return emp;
    });

    res.status(201).json(successResponse(employee));
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId) return res.status(401).json(errorResponse('UNAUTHORIZED', 'Unauthorized'));
    
    const id = req.params.id as string;
    const updateData = req.body;

    const existingEmp = await prisma.employee.findFirst({ where: { id, tenantId } });
    if (!existingEmp) return res.status(404).json(errorResponse('NOT_FOUND', 'Employee not found'));

    // Transaction for update + history + audit
    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          email: updateData.email,
          status: updateData.status,
          departmentId: updateData.departmentId,
          locationId: updateData.locationId,
          legalEntityId: updateData.legalEntityId,
          designationId: updateData.designationId,
          costCenterId: updateData.costCenterId,
          managerId: updateData.managerId
        }
      });

      // Simple history tracking for status change
      if (updateData.status && existingEmp.status !== updateData.status) {
        await tx.employeeHistory.create({
          data: { employeeId: id, fieldChanged: 'status', oldValue: existingEmp.status, newValue: updateData.status, changedBy: userId }
        });
      }

      await tx.auditLog.create({
        data: { tenantId, userId, action: 'UPDATE', entity: 'Employee', entityId: emp.id, newValue: JSON.stringify(updateData) }
      });

      return emp;
    });

    res.json(successResponse(updated));
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
};


export const uploadEmployeeDocument = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { type, name, url, notes } = req.body;
    
    const doc = await (prisma as any).employeeDocument.create({
      data: {
        employeeId: id,
        type, name, url, notes,
        uploadedBy: req.user?.id
      }
    });

    await prisma.auditLog.create({
      data: { tenantId: req.user.tenantId, userId: req.user.id, action: 'UPLOAD_DOCUMENT', entity: 'Employee', entityId: id, newValue: name }
    });

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const deleteEmployeeDocument = async (req: any, res: any) => {
  try {
    const { id, docId } = req.params;
    
    await (prisma as any).employeeDocument.delete({
      where: { id: docId }
    });

    await prisma.auditLog.create({
      data: { tenantId: req.user.tenantId, userId: req.user.id, action: 'DELETE_DOCUMENT', entity: 'Employee', entityId: id }
    });

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
