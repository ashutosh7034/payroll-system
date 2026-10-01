import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class ArrearService {
  static async createArrear(tenantId: string, employeeId: string, data: any) {
    const basic = new Decimal(data.basicArrear || 0);
    const da = new Decimal(data.daArrear || 0);
    const hra = new Decimal(data.hraArrear || 0);
    const other = new Decimal(data.otherArrears || 0);
    const tax = new Decimal(data.taxImpact || 0);
    const pf = new Decimal(data.pfImpact || 0);
    
    const total = basic.add(da).add(hra).add(other);

    return prisma.arrear.create({
      data: {
        tenantId,
        employeeId,
        arrearType: data.arrearType,
        effectiveDate: new Date(data.effectiveDate),
        basicArrear: basic,
        daArrear: da,
        hraArrear: hra,
        otherArrears: other,
        totalAmount: total,
        taxImpact: tax,
        pfImpact: pf,
        notes: data.notes,
        status: 'PENDING'
      }
    });
  }

  static async getArrears(tenantId: string, filters: any) {
    return prisma.arrear.findMany({
      where: { tenantId, ...filters },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async approveArrear(tenantId: string, arrearId: string, approverId: string) {
    const arrear = await prisma.arrear.findFirst({ where: { id: arrearId, tenantId } });
    if (!arrear) throw new Error('Arrear not found');

    const [updated] = await prisma.$transaction([
      prisma.arrear.update({
        where: { id: arrearId },
        data: { status: 'APPROVED' }
      }),
      prisma.auditLog.create({
        data: {
          tenantId,
          userId: approverId,
          action: 'APPROVE_ARREAR',
          entity: 'Arrear',
          entityId: arrearId,
          newValue: 'APPROVED'
        }
      })
    ]);
    return updated;
  }
}
