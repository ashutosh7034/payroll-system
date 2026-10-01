import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class ReimbursementService {
  static async createCategory(tenantId: string, data: any) {
    return prisma.reimbursementCategory.create({
      data: { ...data, tenantId }
    });
  }

  static async getCategories(tenantId: string) {
    return prisma.reimbursementCategory.findMany({ where: { tenantId } });
  }

  static async submitClaim(tenantId: string, employeeId: string, data: any) {
    return prisma.reimbursementClaim.create({
      data: {
        tenantId,
        employeeId,
        categoryId: data.categoryId,
        claimDate: new Date(data.claimDate),
        amount: new Decimal(data.amount),
        description: data.description,
        receiptUrl: data.receiptUrl,
        status: 'PENDING'
      }
    });
  }

  static async getClaims(tenantId: string, filters: any) {
    return prisma.reimbursementClaim.findMany({
      where: { tenantId, ...filters },
      include: {
        category: true,
        employee: { select: { firstName: true, lastName: true, employeeId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getEmployeeClaims(tenantId: string, employeeId: string) {
    return this.getClaims(tenantId, { employeeId });
  }

  static async approveClaimHR(tenantId: string, claimId: string, approverId: string, approvedAmount?: string) {
    const claim = await prisma.reimbursementClaim.findFirst({ where: { id: claimId, tenantId } });
    if (!claim) throw new Error('Claim not found');

    const [updated] = await prisma.$transaction([
      prisma.reimbursementClaim.update({
        where: { id: claimId },
        data: {
          status: 'APPROVED_HR',
          approvedAmount: approvedAmount ? new Decimal(approvedAmount) : claim.amount,
        }
      }),
      prisma.auditLog.create({
        data: {
          tenantId,
          userId: approverId,
          action: 'APPROVE_HR',
          entity: 'ReimbursementClaim',
          entityId: claimId,
          newValue: 'APPROVED_HR'
        }
      })
    ]);
    return updated;
  }

  static async verifyClaimFinance(tenantId: string, claimId: string, verifierId: string) {
    const claim = await prisma.reimbursementClaim.findFirst({ where: { id: claimId, tenantId } });
    if (!claim) throw new Error('Claim not found');

    const [updated] = await prisma.$transaction([
      prisma.reimbursementClaim.update({
        where: { id: claimId },
        data: {
          status: 'APPROVED_FINANCE',
          verifiedBy: verifierId,
          verificationDate: new Date()
        }
      }),
      prisma.auditLog.create({
        data: {
          tenantId,
          userId: verifierId,
          action: 'VERIFY_FINANCE',
          entity: 'ReimbursementClaim',
          entityId: claimId,
          newValue: 'APPROVED_FINANCE'
        }
      })
    ]);
    return updated;
  }

  static async rejectClaim(tenantId: string, claimId: string, approverId: string, reason: string) {
    return prisma.reimbursementClaim.update({
      where: { id: claimId, tenantId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });
  }
}
