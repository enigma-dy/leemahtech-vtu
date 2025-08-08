/*
  Warnings:

  - You are about to drop the `DataPurchase` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Role" ADD VALUE 'reseller';
ALTER TYPE "public"."Role" ADD VALUE 'affiliate';
ALTER TYPE "public"."Role" ADD VALUE 'agent';

-- DropForeignKey
ALTER TABLE "public"."DataPurchase" DROP CONSTRAINT "DataPurchase_userId_fkey";

-- AlterTable
ALTER TABLE "public"."UnifiedPlan" ADD COLUMN     "cashbackPercentage" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "apiKeyCreatedAt" TIMESTAMP(3),
ADD COLUMN     "cashbackBalance" DECIMAL(20,4) NOT NULL DEFAULT 0,
ADD COLUMN     "isActiveReseller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredById" TEXT;

-- DropTable
DROP TABLE "public"."DataPurchase";

-- CreateTable
CREATE TABLE "public"."ReferralReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "public"."User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKey_key" ON "public"."User"("apiKey");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
