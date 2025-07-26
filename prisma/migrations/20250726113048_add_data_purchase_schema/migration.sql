/*
  Warnings:

  - Added the required column `planVolume` to the `DataPurchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DataPurchase" ADD COLUMN     "planVolume" TEXT NOT NULL;
