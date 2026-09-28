-- CreateTable
CREATE TABLE "TenantProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "legalName" TEXT,
    "displayName" TEXT,
    "companyType" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "officialEmail" TEXT,
    "officialPhone" TEXT,
    "cin" TEXT,
    "pan" TEXT,
    "tan" TEXT,
    "gstin" TEXT,
    "registeredAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pincode" TEXT,
    "incorporationDate" TIMESTAMP(3),
    "financialYear" TEXT,
    "contactName" TEXT,
    "contactDesignation" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactAlternatePhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantProfile_tenantId_key" ON "TenantProfile"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantProfile" ADD CONSTRAINT "TenantProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
