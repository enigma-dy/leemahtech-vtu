/*
  Warnings:

  - Added the required column `reseller_price` to the `UnifiedPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."UnifiedPlan" ADD COLUMN     "reseller_price" DECIMAL(65,30) NOT NULL;
