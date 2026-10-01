const fs = require('fs');

const schemaPath = 'server/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace references to Reimbursement
schema = schema.replace(/reimbursements\s+Reimbursement\[\]/g, 'reimbursementClaims ReimbursementClaim[]');

fs.writeFileSync(schemaPath, schema);
console.log('Fixed references successfully');
