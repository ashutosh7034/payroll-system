import { PrismaClient, Payslip } from '@prisma/client';
const prisma = new PrismaClient();

import PDFDocument from 'pdfkit';

export class DocumentGeneratorService {
  /**
   * Generates an actual PDF using pdfkit, returning a Base64 Data URI.
   */
  static async generatePayslipPdf(payslipId: string, tenantId: string): Promise<string> {
    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        components: true,
        payrollRun: true,
        employee: {
          include: { department: true, designation: true }
        }
      }
    });

    if (!payslip || payslip.payrollRun.tenantId !== tenantId) {
      throw new Error('Payslip not found or access denied');
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(`data:application/pdf;base64,${pdfData.toString('base64')}`);
        });

        // Generate PDF Content
        doc.fontSize(20).text('PAYSLIP', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Employee: ${payslip.employee.firstName} ${payslip.employee.lastName}`);
        doc.text(`Employee ID: ${payslip.employee.employeeId}`);
        doc.text(`Department: ${payslip.employee.department?.name || 'N/A'}`);
        doc.text(`Designation: ${payslip.employee.designation?.name || 'N/A'}`);
        doc.text(`Period: ${payslip.payrollRun.runPeriodMonth}/${payslip.payrollRun.runPeriodYear}`);
        doc.moveDown();

        doc.fontSize(14).text('Earnings & Deductions', { underline: true });
        doc.moveDown(0.5);

        payslip.components.forEach(c => {
          doc.fontSize(10).text(`${c.type === 'EARNING' ? '+' : '-'} ${c.name}: ₹${c.amount.toFixed(2)}`);
        });

        doc.moveDown();
        doc.fontSize(12).text(`Gross Pay: ₹${payslip.grossPay.toFixed(2)}`);
        doc.text(`Total Deductions: ₹${payslip.totalDeductions.toFixed(2)}`);
        
        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(14).text(`Net Pay: ₹${payslip.netPay.toFixed(2)}`);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
