-- CreateEnum
CREATE TYPE "ProviderCategory" AS ENUM ('specialist_consult', 'imaging');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('draft', 'open', 'awarded', 'expired');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('active', 'withdrawn', 'accepted', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('routine', 'soon', 'urgent');

-- CreateEnum
CREATE TYPE "ServiceMode" AS ENUM ('in_person', 'telehealth', 'either');

-- CreateEnum
CREATE TYPE "ProviderVerificationStatus" AS ENUM ('verified');

-- CreateEnum
CREATE TYPE "ProviderVerificationMode" AS ENUM ('demo_auto');

-- CreateEnum
CREATE TYPE "BidHistoryEventType" AS ENUM ('placed', 'updated', 'withdrawn', 'accepted', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ViewerRole" AS ENUM ('patient', 'provider');

-- CreateTable
CREATE TABLE "DemoSession" (
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "activeRole" "ViewerRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoSession_pkey" PRIMARY KEY ("authUserId")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "locationCity" TEXT NOT NULL,
    "locationRegion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "rating" DECIMAL(3,2),
    "licenseRegion" TEXT,
    "verificationStatus" "ProviderVerificationStatus" NOT NULL,
    "verificationMode" "ProviderVerificationMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCategoryAssignment" (
    "providerId" TEXT NOT NULL,
    "category" "ProviderCategory" NOT NULL,

    CONSTRAINT "ProviderCategoryAssignment_pkey" PRIMARY KEY ("providerId","category")
);

-- CreateTable
CREATE TABLE "CareRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "category" "ProviderCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "sanitizedSummary" TEXT NOT NULL,
    "targetBudgetCents" INTEGER NOT NULL,
    "locationCity" TEXT NOT NULL,
    "locationRegion" TEXT NOT NULL,
    "preferredStartDate" TIMESTAMP(3) NOT NULL,
    "preferredEndDate" TIMESTAMP(3) NOT NULL,
    "urgency" "Urgency" NOT NULL,
    "serviceMode" "ServiceMode" NOT NULL,
    "details" JSONB NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'draft',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "awardedBidId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "availableDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidHistory" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "eventType" "BidHistoryEventType" NOT NULL,
    "actorAuthUserId" TEXT NOT NULL,
    "oldAmountCents" INTEGER,
    "newAmountCents" INTEGER,
    "oldAvailableDate" TIMESTAMP(3),
    "newAvailableDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BidHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_authUserId_key" ON "Patient"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_authUserId_key" ON "Provider"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_email_key" ON "Provider"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CareRequest_awardedBidId_key" ON "CareRequest"("awardedBidId");

-- CreateIndex
CREATE INDEX "CareRequest_patientId_createdAt_idx" ON "CareRequest"("patientId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CareRequest_status_category_expiresAt_idx" ON "CareRequest"("status", "category", "expiresAt");

-- CreateIndex
CREATE INDEX "Bid_careRequestId_status_amountCents_updatedAt_idx" ON "Bid"("careRequestId", "status", "amountCents", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Bid_providerId_createdAt_idx" ON "Bid"("providerId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Bid_careRequestId_providerId_key" ON "Bid"("careRequestId", "providerId");

-- CreateIndex
CREATE INDEX "BidHistory_careRequestId_createdAt_idx" ON "BidHistory"("careRequestId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ProviderCategoryAssignment" ADD CONSTRAINT "ProviderCategoryAssignment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareRequest" ADD CONSTRAINT "CareRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareRequest" ADD CONSTRAINT "CareRequest_awardedBidId_fkey" FOREIGN KEY ("awardedBidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "CareRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidHistory" ADD CONSTRAINT "BidHistory_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidHistory" ADD CONSTRAINT "BidHistory_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "CareRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidHistory" ADD CONSTRAINT "BidHistory_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
