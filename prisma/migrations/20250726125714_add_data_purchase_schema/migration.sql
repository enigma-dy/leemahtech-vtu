/*
  Warnings:

  - A unique constraint covering the columns `[provider,data_plan_id]` on the table `UnifiedPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UnifiedPlan_provider_data_plan_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "UnifiedPlan_provider_data_plan_id_key" ON "UnifiedPlan"("provider", "data_plan_id");
