const fs = require('fs');

const schemaPath = 'server/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace model Reimbursement
const reimbursementRegex = /model Reimbursement \{[\s\S]*?\n\}/;
schema = schema.replace(reimbursementRegex, '');

// Replace model Loan
const loanRegex = /model Loan \{[\s\S]*?\n\}/;
schema = schema.replace(loanRegex, '');

// Arrears
const arrearRegex = /model Arrear \{[\s\S]*?\n\}/;
if (arrearRegex.test(schema)) {
  schema = schema.replace(arrearRegex, '');
}

const newModels = `
model LoanType {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  description String?
  interestRate Decimal @default(0.00) @db.Decimal(5, 2)
  maxAmount    Decimal? @db.Decimal(12, 2)
  maxTenureMonths Int?
  isActive    Boolean  @default(true)
  
  loans       Loan[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([tenantId, name])
}

model Loan {
  id              String   @id @default(uuid())
  tenantId        String
  employeeId      String
  loanTypeId      String
  principalAmount Decimal  @db.Decimal(12, 2)
  interestRate    Decimal  @db.Decimal(5, 2) @default(0.00)
  tenureMonths    Int
  emiAmount       Decimal  @db.Decimal(12, 2)
  startDate       DateTime
  status          String   @default("PENDING") // PENDING, APPROVED, REJECTED, ACTIVE, CLOSED
  
  approvedBy      String?
  approvalDate    DateTime?
  rejectionReason String?
  
  totalInterest   Decimal  @db.Decimal(12, 2) @default(0.00)
  totalAmount     Decimal  @db.Decimal(12, 2) // principal + interest
  outstandingBalance Decimal @db.Decimal(12, 2)
  
  loanType        LoanType @relation(fields: [loanTypeId], references: [id])
  employee        Employee @relation(fields: [employeeId], references: [id])
  installments    LoanInstallment[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model LoanInstallment {
  id              String   @id @default(uuid())
  loanId          String
  installmentNumber Int
  dueDate         DateTime
  principalPart   Decimal  @db.Decimal(12, 2)
  interestPart    Decimal  @db.Decimal(12, 2)
  totalAmount     Decimal  @db.Decimal(12, 2)
  
  status          String   @default("PENDING") // PENDING, RECOVERED_IN_PAYROLL, PAID_MANUALLY, DEFAULTED
  recoveryRunId   String?  // If recovered via payroll run
  paymentDate     DateTime?
  
  loan            Loan     @relation(fields: [loanId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([loanId, installmentNumber])
}

model ReimbursementCategory {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  description String?
  limitPerYear Decimal? @db.Decimal(12, 2)
  isTaxable   Boolean  @default(false)
  isActive    Boolean  @default(true)
  
  claims      ReimbursementClaim[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([tenantId, name])
}

model ReimbursementClaim {
  id              String   @id @default(uuid())
  tenantId        String
  employeeId      String
  categoryId      String
  claimDate       DateTime
  amount          Decimal  @db.Decimal(12, 2)
  approvedAmount  Decimal? @db.Decimal(12, 2)
  description     String?
  receiptUrl      String?  
  
  status          String   @default("PENDING") // PENDING, APPROVED_HR, APPROVED_FINANCE, REJECTED, PAID
  payrollRunId    String?  
  
  rejectionReason String?
  verifiedBy      String?
  verificationDate DateTime?
  
  category        ReimbursementCategory @relation(fields: [categoryId], references: [id])
  employee        Employee              @relation(fields: [employeeId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Arrear {
  id              String   @id @default(uuid())
  tenantId        String
  employeeId      String
  arrearType      String   // SALARY_REVISION, BONUS, STATUTORY, OTHER
  effectiveDate   DateTime 
  
  basicArrear     Decimal  @default(0.00) @db.Decimal(12, 2)
  daArrear        Decimal  @default(0.00) @db.Decimal(12, 2)
  hraArrear       Decimal  @default(0.00) @db.Decimal(12, 2)
  otherArrears    Decimal  @default(0.00) @db.Decimal(12, 2)
  
  totalAmount     Decimal  @db.Decimal(12, 2)
  
  taxImpact       Decimal  @default(0.00) @db.Decimal(12, 2)
  pfImpact        Decimal  @default(0.00) @db.Decimal(12, 2)
  
  status          String   @default("PENDING") // PENDING, APPROVED, PROCESSED
  payrollRunId    String?  
  notes           String?
  
  employee        Employee @relation(fields: [employeeId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
`;

schema += '\n' + newModels;
fs.writeFileSync(schemaPath, schema);
console.log('Replaced and updated models successfully');
