const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ where: { email: 'hr@demo.local' } });
  const emp = await prisma.employee.findFirst({ where: { email: 'hr@demo.local' } });
  
  const token = jwt.sign(
    {
      id: user.id,
      tenantId: user.tenantId,
      roles: ['HR'],
      employeeId: emp.id
    },
    'payflow_dev_super_secret',
    { expiresIn: '8h' }
  );

  const meRes = await fetch('http://localhost:4000/api/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("ME RESPONSE:", await meRes.json());
}
test();
