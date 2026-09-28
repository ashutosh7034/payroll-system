import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const PLATFORM_SUPER_ADMIN_ROLE = 'PLATFORM_SUPER_ADMIN';
export const TENANT_SUPER_ADMIN_ROLE = 'TENANT_SUPER_ADMIN';
export const HR_ROLE = 'HR';
export const PAYROLL_MANAGER_ROLE = 'PAYROLL_MANAGER';
export const FINANCE_MANAGER_ROLE = 'FINANCE_MANAGER';
export const COMPLIANCE_OFFICER_ROLE = 'COMPLIANCE_OFFICER';
export const MANAGER_ROLE = 'MANAGER';
export const EMPLOYEE_ROLE = 'EMPLOYEE';
export const AUDITOR_ROLE = 'AUDITOR';

export class TenantProvisioningService {
  
  static async initializePlatform() {
    let platformTenant = await prisma.tenant.findFirst({ where: { name: 'PAYFLOW_PLATFORM' } });
    if (!platformTenant) {
      platformTenant = await prisma.tenant.create({
        data: { name: 'PAYFLOW_PLATFORM', domain: 'payflow' }
      });
    }

    let role = await prisma.role.findUnique({ where: { name: PLATFORM_SUPER_ADMIN_ROLE } });
    if (!role) {
      role = await prisma.role.create({ data: { name: PLATFORM_SUPER_ADMIN_ROLE, description: 'Platform Owner' } });
    }

    const adminEmail = 'super@payflow.com';
    let user = await prisma.user.findFirst({ where: { email: adminEmail } });
    if (!user) {
      const passwordHash = await bcrypt.hash('payflow123', 10);
      user = await prisma.user.create({
        data: {
          tenantId: platformTenant.id,
          email: adminEmail,
          firstName: 'Platform',
          lastName: 'Owner',
          passwordHash
        }
      });
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }
    return { platformTenant, user };
  }

  static async createTenant(payload: any) {
    const { company, primaryAdmin, secondaryAdmin } = payload;
    
    // Uniqueness checks before transaction (can also be inside)
    const existingTenant = await prisma.tenant.findFirst({ where: { domain: company.code } });
    if (existingTenant) throw new Error('Company code already exists');

    const existingPrimary = await prisma.user.findFirst({ where: { email: primaryAdmin.email } });
    if (existingPrimary) throw new Error('Primary admin email already exists in the system');

    if (secondaryAdmin && secondaryAdmin.enabled) {
      if (primaryAdmin.email === secondaryAdmin.email) throw new Error('Primary and secondary admin emails must be different');
      const existingSecondary = await prisma.user.findFirst({ where: { email: secondaryAdmin.email } });
      if (existingSecondary) throw new Error('Secondary admin email already exists in the system');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: company.name,
          domain: company.code
        }
      });

      // 2. Roles
      const roleNames = [TENANT_SUPER_ADMIN_ROLE, HR_ROLE, PAYROLL_MANAGER_ROLE, FINANCE_MANAGER_ROLE, EMPLOYEE_ROLE];
      const roles: any = {};
      for (const name of roleNames) {
        let r = await tx.role.findUnique({ where: { name } });
        if (!r) r = await tx.role.create({ data: { name, description: name } });
        roles[name] = r;
      }

      // 3. Primary Admin
      const passwordHash1 = await bcrypt.hash(primaryAdmin.password, 10);
      const admin1 = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: primaryAdmin.email,
          firstName: primaryAdmin.firstName,
          lastName: primaryAdmin.lastName,
          passwordHash: passwordHash1
        }
      });
      await tx.userRole.create({ data: { userId: admin1.id, roleId: roles[TENANT_SUPER_ADMIN_ROLE].id } });

      let admin2 = null;
      if (secondaryAdmin && secondaryAdmin.enabled) {
        const passwordHash2 = await bcrypt.hash(secondaryAdmin.password, 10);
        admin2 = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: secondaryAdmin.email,
            firstName: secondaryAdmin.firstName,
            lastName: secondaryAdmin.lastName,
            passwordHash: passwordHash2
          }
        });
        await tx.userRole.create({ data: { userId: admin2.id, roleId: roles[TENANT_SUPER_ADMIN_ROLE].id } });
      }

      // 4. Default Configuration
      const basicComponent = await tx.salaryComponent.create({
        data: { tenantId: tenant.id, name: 'Basic Salary', code: 'BASIC', type: 'EARNING', isTaxable: true, formulas: { create: { tenantId: tenant.id, expression: '0.4 * CTC' } } }
      });
      const hraComponent = await tx.salaryComponent.create({
        data: { tenantId: tenant.id, name: 'House Rent Allowance', code: 'HRA', type: 'EARNING', isTaxable: true, formulas: { create: { tenantId: tenant.id, expression: '0.5 * BASIC' } } }
      });
      const pfEeComponent = await tx.salaryComponent.create({
        data: { tenantId: tenant.id, name: 'PF (Employee)', code: 'PF_EE', type: 'STATUTORY', isTaxable: false, formulas: { create: { tenantId: tenant.id, expression: '0.12 * BASIC' } } }
      });

      await tx.salaryStructure.create({
        data: {
          tenantId: tenant.id,
          name: 'Standard Structure',
          description: 'Default structure',
          components: { create: [ { salaryComponentId: basicComponent.id }, { salaryComponentId: hraComponent.id }, { salaryComponentId: pfEeComponent.id } ] }
        }
      });

      await tx.leavePolicy.create({
        data: { tenantId: tenant.id, name: 'Paid Time Off', type: 'EARNED', daysPerYear: 21, canCarryForward: true, maxCarryForward: 10 }
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: { tenantId: tenant.id, userId: admin1.id, action: 'COMPANY_CREATED', entity: 'Tenant', entityId: tenant.id }
      });
      await tx.auditLog.create({
        data: { tenantId: tenant.id, userId: admin1.id, action: 'SUPER_ADMIN_CREATED', entity: 'User', entityId: admin1.id }
      });
      if (admin2) {
        await tx.auditLog.create({
          data: { tenantId: tenant.id, userId: admin1.id, action: 'SUPER_ADMIN_2_CREATED', entity: 'User', entityId: admin2.id }
        });
      }

      return { tenant, admin1, admin2 };
    });
  }
}
