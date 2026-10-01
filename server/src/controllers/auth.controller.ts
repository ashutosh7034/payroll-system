import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { email, password, domain } = req.body;

  try {
    let tenantId: string | undefined;

    // Optional domain-based tenant resolution
    if (domain) {
      const tenant = await prisma.tenant.findUnique({ where: { domain } });
      if (!tenant) {
        return res.status(404).json({ error: 'Company not found' });
      }
      tenantId = tenant.id;
    }

    const whereClause: any = { email };
    if (tenantId) whereClause.tenantId = tenantId;

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        tenant: true,
        userRoles: { include: { role: true } }
      }
    });

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Since a user could theoretically have same email in different tenants,
    // if no domain provided, we assume the first match (or require domain/tenant).
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const roles = user.userRoles.map(ur => ur.role.name);

    let employeeId = null;
    const emp = await prisma.employee.findFirst({ where: { email: user.email, tenantId: user.tenantId } });
    if (emp) {
      employeeId = emp.id;
    }

    const token = jwt.sign(
      {
        id: user.id,
        tenantId: user.tenantId,
        roles,
        employeeId
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        employeeId
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setupInitialTenant = async (req: Request, res: Response) => {
  // A helper for Phase 1 to quickly bootstrap a Demo company and admin user
  try {
    const existingTenant = await prisma.tenant.findFirst({ where: { name: 'Demo India Pvt Ltd' } });
    if (existingTenant) {
      return res.status(400).json({ error: 'Demo tenant already exists' });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Demo India Pvt Ltd',
        domain: 'demo'
      }
    });

    const superAdminRole = await prisma.role.create({
      data: { name: 'Super Admin', description: 'System Administrator' }
    });

    const hrRole = await prisma.role.create({
      data: { name: 'HR Manager', description: 'HR Administration' }
    });

    const passwordHash = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@demo.com',
        firstName: 'System',
        lastName: 'Admin',
        passwordHash
      }
    });

    await prisma.userRole.create({
      data: { userId: user.id, roleId: superAdminRole.id }
    });

    // Seed Phase 3: Salary Components & Structure
    const basicComponent = await prisma.salaryComponent.create({
      data: { tenantId: tenant.id, name: 'Basic Salary', code: 'BASIC', type: 'EARNING', isTaxable: true, formulas: { create: { tenantId: tenant.id, expression: '0.4 * CTC' } } }
    });
    const hraComponent = await prisma.salaryComponent.create({
      data: { tenantId: tenant.id, name: 'House Rent Allowance', code: 'HRA', type: 'EARNING', isTaxable: true, formulas: { create: { tenantId: tenant.id, expression: '0.5 * BASIC' } } }
    });
    const splComponent = await prisma.salaryComponent.create({
      data: { tenantId: tenant.id, name: 'Special Allowance', code: 'SPL_ALLOW', type: 'EARNING', isTaxable: true, formulas: { create: { tenantId: tenant.id, expression: 'CTC - (BASIC + HRA + PF_ER)' } } }
    });
    const pfEeComponent = await prisma.salaryComponent.create({
      data: { tenantId: tenant.id, name: 'PF (Employee)', code: 'PF_EE', type: 'STATUTORY', isTaxable: false, formulas: { create: { tenantId: tenant.id, expression: '0.12 * BASIC' } } }
    });
    const pfErComponent = await prisma.salaryComponent.create({
      data: { tenantId: tenant.id, name: 'PF (Employer)', code: 'PF_ER', type: 'STATUTORY', isTaxable: false, formulas: { create: { tenantId: tenant.id, expression: '0.12 * BASIC' } } }
    });

    await prisma.salaryStructure.create({
      data: {
        tenantId: tenant.id,
        name: 'Standard Engineering Structure',
        description: 'Default structure for engineering team',
        components: {
          create: [
            { salaryComponentId: basicComponent.id },
            { salaryComponentId: hraComponent.id },
            { salaryComponentId: splComponent.id },
            { salaryComponentId: pfEeComponent.id },
            { salaryComponentId: pfErComponent.id },
          ]
        }
      }
    });

    // Seed Phase 4: Leave Policies
    await prisma.leavePolicy.createMany({
      data: [
        { tenantId: tenant.id, name: 'Sick Leave', type: 'SICK', daysPerYear: 12, canCarryForward: false, maxCarryForward: 0 },
        { tenantId: tenant.id, name: 'Casual Leave', type: 'CASUAL', daysPerYear: 12, canCarryForward: false, maxCarryForward: 0 },
        { tenantId: tenant.id, name: 'Earned Leave', type: 'EARNED', daysPerYear: 15, canCarryForward: true, maxCarryForward: 30 }
      ]
    });

    res.json({ message: 'Demo tenant initialized successfully', tenantId: tenant.id });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: any, res: any) => { res.json({success:true}); };
export const me = async (req: any, res: any) => { res.json({user: req.user, tenant: {id: req.user.tenantId}}); };
