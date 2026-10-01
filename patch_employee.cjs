const fs = require('fs');
let code = fs.readFileSync('server/src/controllers/employee.controller.ts', 'utf8');

code = code.replace(
  `          taxProfile: true,
          history: { orderBy: { createdAt: 'desc' } }`,
  `          taxProfile: true,
          documents: true,
          history: { orderBy: { createdAt: 'desc' } }`
);

const newMethods = `

export const uploadEmployeeDocument = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { type, name, url, notes } = req.body;
    
    const doc = await prisma.employeeDocument.create({
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
    
    await prisma.employeeDocument.delete({
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
`;

code += newMethods;

fs.writeFileSync('server/src/controllers/employee.controller.ts', code);
console.log('Patched employee.controller.ts');
