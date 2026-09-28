import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting development database seed...');

  // 1. Create or Find Platform Super Admin Role
  let platformRole = await prisma.role.findFirst({ where: { name: 'PLATFORM_SUPER_ADMIN' } });
  if (!platformRole) {
    platformRole = await prisma.role.create({ data: { name: 'PLATFORM_SUPER_ADMIN', description: 'Platform Owner' } });
  }

  // 2. Create Platform Tenant (Logical representation)
  let platformTenant = await prisma.tenant.findFirst({ where: { name: 'PAYFLOW_PLATFORM' } });
  if (!platformTenant) {
    platformTenant = await prisma.tenant.create({ data: { name: 'PAYFLOW_PLATFORM', domain: 'platform' } });
  }

  // 3. Create Platform Super Admin User
  const platformPassword = await bcrypt.hash('Payflow@Platform2026!', 10);
  let platformUser = await prisma.user.findFirst({ where: { email: 'platform.admin@payflow.local' } });
  if (!platformUser) {
    platformUser = await prisma.user.create({
      data: {
        email: 'platform.admin@payflow.local',
        firstName: 'Platform',
        lastName: 'Admin',
        passwordHash: platformPassword,
        tenantId: platformTenant.id,
      }
    });
    await prisma.userRole.create({
      data: { userId: platformUser.id, roleId: platformRole.id }
    });
  }

  // 4. Create Demo Technologies Pvt Ltd
  let demoTenant = await prisma.tenant.findFirst({ where: { name: 'Demo Technologies Pvt Ltd' } });
  if (!demoTenant) {
    demoTenant = await prisma.tenant.create({ data: { name: 'Demo Technologies Pvt Ltd', domain: 'DEMO-001' } });
  }

  // 5. Create Tenant Roles
  const rolesData = [
    { name: 'TENANT_SUPER_ADMIN', desc: 'Company Owner' },
    { name: 'HR', desc: 'HR Manager' },
    { name: 'PAYROLL', desc: 'Payroll Manager' },
    { name: 'FINANCE', desc: 'Finance Manager' },
    { name: 'COMPLIANCE', desc: 'Compliance Officer' },
    { name: 'MANAGER', desc: 'People Manager' },
    { name: 'EMPLOYEE', desc: 'Employee' },
    { name: 'AUDITOR', desc: 'Auditor' }
  ];

  const rolesMap: Record<string, string> = {};
  for (const r of rolesData) {
    let role = await prisma.role.findFirst({ where: { name: r.name } });
    if (!role) {
      role = await prisma.role.create({ data: { name: r.name, description: r.desc } });
    }
    rolesMap[r.name] = role.id;
  }

  // 6. Create Users for Demo Technologies
  const usersToCreate = [
    { email: 'superadmin@demo.local', pass: 'Payflow@Company2026!', role: 'TENANT_SUPER_ADMIN', first: 'Company', last: 'Admin' },
    { email: 'hr@demo.local', pass: 'Payflow@HR2026!', role: 'HR', first: 'HR', last: 'Manager' },
    { email: 'payroll@demo.local', pass: 'Payflow@Payroll2026!', role: 'PAYROLL', first: 'Payroll', last: 'Manager' },
    { email: 'finance@demo.local', pass: 'Payflow@Finance2026!', role: 'FINANCE', first: 'Finance', last: 'Manager' },
    { email: 'compliance@demo.local', pass: 'Payflow@Compliance2026!', role: 'COMPLIANCE', first: 'Compliance', last: 'Officer' },
    { email: 'manager@demo.local', pass: 'Payflow@Manager2026!', role: 'MANAGER', first: 'People', last: 'Manager' },
    { email: 'employee@demo.local', pass: 'Payflow@Employee2026!', role: 'EMPLOYEE', first: 'Standard', last: 'Employee' },
    { email: 'auditor@demo.local', pass: 'Payflow@Auditor2026!', role: 'AUDITOR', first: 'System', last: 'Auditor' },
  ];

  console.log('\n================================================');
  console.log('PAYFLOW LOCAL TEST ACCOUNTS');
  console.log('================================================\n');

  console.log('ROLE\t\tEMAIL\t\t\tTENANT\t\t\tSTATUS');
  console.log(`PLATFORM_SUPER_ADMIN\tplatform.admin@payflow.local\tPLATFORM\t\tACTIVE`);

  for (const u of usersToCreate) {
    let user = await prisma.user.findFirst({ where: { email: u.email } });
    if (!user) {
      const hash = await bcrypt.hash(u.pass, 10);
      user = await prisma.user.create({
        data: {
          email: u.email,
          firstName: u.first,
          lastName: u.last,
          passwordHash: hash,
          tenantId: demoTenant.id
        }
      });
      await prisma.userRole.create({
        data: { userId: user.id, roleId: rolesMap[u.role] }
      });
    }
    console.log(`${u.role}\t\t${u.email}\t\tDemo Technologies Pvt Ltd\tACTIVE`);
  }

  console.log('\nSeed completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
