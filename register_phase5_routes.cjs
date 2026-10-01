const fs = require('fs');

const indexPath = 'server/src/index.ts';
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('./routes/loan.routes')) {
  // Add imports
  indexContent = indexContent.replace(
    "import orgRoutes from './routes/org.routes';",
    "import orgRoutes from './routes/org.routes';\nimport loanRoutes from './routes/loan.routes';\nimport reimbursementRoutes from './routes/reimbursement.routes';\nimport arrearRoutes from './routes/arrear.routes';"
  );

  // Add route usage
  indexContent = indexContent.replace(
    "app.use('/api/org', orgRoutes);",
    "app.use('/api/org', orgRoutes);\napp.use('/api/loans', loanRoutes);\napp.use('/api/reimbursements', reimbursementRoutes);\napp.use('/api/arrears', arrearRoutes);"
  );

  fs.writeFileSync(indexPath, indexContent);
  console.log('Routes added to index.ts');
}
