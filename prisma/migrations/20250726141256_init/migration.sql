/*
  Warnings:

  - You are about to alter the column `plan_amount` on the `UnifiedPlan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - Added the required column `selling_price` to the `UnifiedPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UnifiedPlan" ADD COLUMN     "selling_price" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "plan_amount" SET DATA TYPE DECIMAL(65,30);
