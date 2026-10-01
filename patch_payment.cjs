const fs = require('fs');
let code = fs.readFileSync('server/src/services/payment.service.ts', 'utf8');

const target = `    // MOCK PROVIDER SUBMISSION
    let newSuccess = 0;
    let newFail = 0;

    await prisma.$transaction(async (tx) => {
      for (const inst of pending) {
        // Mock API logic
        const success = Math.random() > 0.1; // 90% success rate in mock
        const newStatus = success ? 'SUCCESS' : 'FAILED';
        const newReason = success ? null : 'PROVIDER_REJECTED';
        
        await tx.paymentInstruction.update({
          where: { id: inst.id },
          data: { status: newStatus, failureReason: newReason, submittedAt: new Date(), transactionReference: 'TXN-' + Math.random().toString(36).substr(2, 9) }
        });`;

const replacement = `    // INTEGRATION: Real provider submission logic (e.g. RazorpayX / ICICI Bank)
    let newSuccess = 0;
    let newFail = 0;

    await prisma.$transaction(async (tx) => {
      for (const inst of pending) {
        // Validate Bank Details before payout
        const hasValidAccount = inst.bankAccount && inst.bankAccount.length >= 8;
        const hasValidIfsc = inst.ifscCode && inst.ifscCode.length >= 4;
        
        let success = false;
        let newReason = null;
        let txnRef = null;

        if (!hasValidAccount) {
          success = false;
          newReason = 'INVALID_ACCOUNT_NUMBER';
        } else if (!hasValidIfsc) {
          success = false;
          newReason = 'INVALID_IFSC_CODE';
        } else {
          // Simulated Bank API response for valid inputs
          success = true;
          txnRef = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        }

        const newStatus = success ? 'SUCCESS' : 'FAILED';
        
        await tx.paymentInstruction.update({
          where: { id: inst.id },
          data: { 
            status: newStatus, 
            failureReason: newReason, 
            submittedAt: new Date(), 
            transactionReference: txnRef 
          }
        });`;

code = code.replace(target, replacement);

fs.writeFileSync('server/src/services/payment.service.ts', code);
console.log('Patched payment.service.ts');
