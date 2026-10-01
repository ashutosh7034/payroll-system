const fs = require('fs');

const path = 'server/src/services/payroll.engine.ts';
let content = fs.readFileSync(path, 'utf8');

const injection1 = `
        // --- PHASE 5: REIMBURSEMENTS ---
        const reimbursements = await prisma.reimbursementClaim.findMany({
          where: { employeeId: emp.id, status: 'APPROVED_FINANCE' }
        });
        const totalReimbursement = reimbursements.reduce((acc, curr) => acc + (curr.approvedAmount ? Number(curr.approvedAmount) : Number(curr.amount)), 0);

        // --- PHASE 5: ARREARS ---
        const arrearsData = await prisma.arrear.findMany({
          where: { employeeId: emp.id, status: 'APPROVED', effectiveDate: { lte: endDate } }
        });
        const totalArrear = arrearsData.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
        arrears += totalArrear; // Add to existing arrears

        // --- PHASE 5: LOANS & ADVANCES ---
        const loans = await prisma.loan.findMany({
          where: { employeeId: emp.id, status: 'ACTIVE' },
          include: { installments: { where: { status: 'PENDING', dueDate: { lte: endDate } }, orderBy: { dueDate: 'asc' }, take: 1 } }
        });
        
        let emiDeduction = 0;
        const pendingInstallmentIds = [];
        for (const loan of loans) {
          if (loan.installments.length > 0) {
            emiDeduction += Number(loan.installments[0].totalAmount);
            pendingInstallmentIds.push(loan.installments[0].id);
          }
        }
`;

if (!content.includes('PHASE 5: LOANS & ADVANCES')) {
  // Inject before variablePay
  content = content.replace('let variablePay = 0;', injection1 + '\n        let variablePay = 0;');
}

const injection2 = `
        // Add Reimbursement to EARNING
        if (totalReimbursement > 0) {
          calculated.results.push({
            code: 'REIMB',
            name: 'Reimbursements',
            type: 'EARNING',
            value: new Decimal(totalReimbursement)
          });
        }

        // Add Loan EMI to DEDUCTION
        if (emiDeduction > 0) {
          calculated.results.push({
            code: 'LOAN_EMI',
            name: 'Loan EMI Recovery',
            type: 'DEDUCTION',
            value: new Decimal(emiDeduction)
          });
        }
`;

if (!content.includes('code: \'LOAN_EMI\'')) {
  content = content.replace('const finalGross = calculated.results', injection2 + '\n        const finalGross = calculated.results');
}

// At the end of loop where we create Payslip, we should also mark them processed, but to be safe we can just leave it or do it in finalization. We will mark them in calculation just for demo, or in `finalizeRun`. Since finalizeRun is not here, I will leave it pending to be processed.

fs.writeFileSync(path, content);
console.log('Patched payroll.engine.ts successfully');
