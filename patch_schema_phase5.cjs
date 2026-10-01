const fs = require('fs');

const schemaPath = 'server/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

const newModels = `
// ==========================================
// PHASE 5: LOANS & ADVANCES
// ==========================================

model LoanType {
  id          String   @id @default(uuid())
  tenantId    String
  name        String   // e.g. Personal Loan, Salary Advance, Home Loan
  description String?
  interestRate Decimal @default(0.00) // Annual interest rate percentage
  maxAmount    Decimal?
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

// ==========================================
// PHASE 5: REIMBURSEMENTS
// ==========================================

model ReimbursementCategory {
  id          String   @id @default(uuid())
  tenantId    String
  name        String   // e.g. Travel, Medical, Broadband
  description String?
  limitPerYear Decimal?
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
  receiptUrl      String?  // Cloud URL for receipt
  
  status          String   @default("PENDING") // PENDING, APPROVED_HR, APPROVED_FINANCE, REJECTED, PAID
  payrollRunId    String?  // If processed via payroll
  
  rejectionReason String?
  verifiedBy      String?
  verificationDate DateTime?
  
  category        ReimbursementCategory @relation(fields: [categoryId], references: [id])
  employee        Employee              @relation(fields: [employeeId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ==========================================
// PHASE 5: ARREARS
// ==========================================

model Arrear {
  id              String   @id @default(uuid())
  tenantId        String
  employeeId      String
  arrearType      String   // SALARY_REVISION, BONUS, STATUTORY, OTHER
  effectiveDate   DateTime // From when it applies
  
  basicArrear     Decimal  @default(0.00) @db.Decimal(12, 2)
  daArrear        Decimal  @default(0.00) @db.Decimal(12, 2)
  hraArrear       Decimal  @default(0.00) @db.Decimal(12, 2)
  otherArrears    Decimal  @default(0.00) @db.Decimal(12, 2)
  
  totalAmount     Decimal  @db.Decimal(12, 2)
  
  taxImpact       Decimal  @default(0.00) @db.Decimal(12, 2)
  pfImpact        Decimal  @default(0.00) @db.Decimal(12, 2)
  
  status          String   @default("PENDING") // PENDING, APPROVED, PROCESSED
  payrollRunId    String?  // If processed in a payroll run
  notes           String?
  
  employee        Employee @relation(fields: [employeeId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
`;

if (!schema.includes('model Loan')) {
  fs.writeFileSync(schemaPath, schema + newModels);
  console.log('Appended Phase 5 models to schema.prisma');
} else {
  console.log('Models already exist in schema.prisma');
}
