import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TaxDeclarationService {
  static async getDeclarations(tenantId: string, employeeId: string) {
    return prisma.taxDeclaration.findMany({
      where: { tenantId, employeeId },
      include: { items: true },
      orderBy: { financialYear: 'desc' }
    });
  }

  static async submitDeclaration(tenantId: string, employeeId: string, data: any) {
    const { financialYear, items } = data;
    
    // Check if one already exists
    let decl = await prisma.taxDeclaration.findUnique({
      where: { tenantId_employeeId_financialYear: { tenantId, employeeId, financialYear } }
    });

    if (decl && (decl.status === 'APPROVED' || decl.status === 'SUBMITTED')) {
      throw new Error('Declaration already submitted or approved for this year');
    }

    if (!decl) {
      decl = await prisma.taxDeclaration.create({
        data: {
          tenantId,
          employeeId,
          financialYear,
          status: 'SUBMITTED',
          submittedAt: new Date()
        }
      });
    } else {
      decl = await prisma.taxDeclaration.update({
        where: { id: decl.id },
        data: { status: 'SUBMITTED', submittedAt: new Date() }
      });
      await prisma.taxDeclarationItem.deleteMany({ where: { taxDeclarationId: decl.id } });
    }

    // Add items
    for (const item of items) {
      await prisma.taxDeclarationItem.create({
        data: {
          taxDeclarationId: decl.id,
          section: item.section,
          amountDeclared: item.amountDeclared,
          proofDocumentUrl: item.proofDocumentUrl
        }
      });
    }

    await prisma.auditLog.create({
      data: { tenantId, userId: employeeId, action: 'SUBMIT_TAX_DECLARATION', entity: 'TaxDeclaration', entityId: decl.id }
    });

    return decl;
  }

  static async reviewDeclaration(tenantId: string, declarationId: string, status: string, approverId: string, remarks?: string, itemApprovals?: any[]) {
    const decl = await prisma.taxDeclaration.findUnique({ where: { id: declarationId }, include: { items: true } });
    if (!decl || decl.tenantId !== tenantId) throw new Error('Not found');

    if (itemApprovals && status === 'APPROVED') {
      for (const approval of itemApprovals) {
        await prisma.taxDeclarationItem.update({
          where: { id: approval.itemId },
          data: {
            amountApproved: approval.amountApproved,
            status: 'APPROVED',
            remarks: approval.remarks
          }
        });
      }
    }

    const updated = await prisma.taxDeclaration.update({
      where: { id: declarationId },
      data: { status, approverId, approvedAt: new Date(), remarks }
    });

    await prisma.auditLog.create({
      data: { tenantId, userId: approverId, action: 'REVIEW_TAX_DECLARATION', entity: 'TaxDeclaration', entityId: declarationId, newValue: status }
    });

    return updated;
  }
}
