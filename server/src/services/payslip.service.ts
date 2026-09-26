import { PrismaClient } from '@prisma/client';
import { DocumentGeneratorService } from './document.generator.js';

const prisma = new PrismaClient();

export class PayslipService {
  static async getEmployeePayslips(tenantId: string, employeeId: string) {
    return prisma.payslip.findMany({
      where: {
        employeeId,
        payrollRun: { tenantId, status: 'FINALIZED' }
      },
      include: {
        payrollRun: {
          select: { runPeriodMonth: true, runPeriodYear: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getPayslipById(tenantId: string, employeeId: string, payslipId: string) {
    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        components: true,
        payrollRun: true,
        employee: {
          include: {
            department: true,
            designation: true,
            location: true,
            legalEntity: true
          }
        }
      }
    });

    if (!payslip || payslip.payrollRun.tenantId !== tenantId || payslip.employeeId !== employeeId) {
      throw new Error('Payslip not found or access denied');
    }

    if (payslip.payrollRun.status !== 'FINALIZED') {
      throw new Error('Payslip is not yet finalized');
    }

    return payslip;
  }

  static async downloadPayslip(tenantId: string, employeeId: string, payslipId: string) {
    // Ensure access and existence
    await this.getPayslipById(tenantId, employeeId, payslipId);
    
    const downloadUrl = await DocumentGeneratorService.generatePayslipPdf(payslipId, tenantId);
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: employeeId,
        action: 'DOWNLOAD_PAYSLIP',
        entity: 'Payslip',
        entityId: payslipId,
      }
    });

    return { url: downloadUrl };
  }
}
