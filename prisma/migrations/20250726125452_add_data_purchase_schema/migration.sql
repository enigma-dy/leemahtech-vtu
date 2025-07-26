-- CreateTable
CREATE TABLE "UnifiedPlan" (
    "id" TEXT NOT NULL,
    "provider" "SmeProvider" NOT NULL,
    "data_plan_id" TEXT NOT NULL,
    "network_id" INTEGER NOT NULL,
    "network_name" TEXT NOT NULL,
    "plan_amount" DOUBLE PRECISION NOT NULL,
    "plan_size" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL,
    "validity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnifiedPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnifiedPlan_provider_data_plan_id_idx" ON "UnifiedPlan"("provider", "data_plan_id");
