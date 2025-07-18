-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "SmeProvider" AS ENUM ('datastation', 'husmodata', 'direct');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "EntryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPrice" (
    "id" TEXT NOT NULL,
    "network_id" TEXT NOT NULL,
    "network_name" TEXT NOT NULL,
    "plan_size" TEXT NOT NULL,
    "plan_volume" TEXT NOT NULL,
    "plan_name_id" TEXT NOT NULL,
    "plan_name_id2" TEXT NOT NULL,
    "Affilliate_price" DECIMAL(65,30) NOT NULL,
    "TopUser_price" DECIMAL(65,30) NOT NULL,
    "api_price" DECIMAL(65,30) NOT NULL,
    "plan_type" TEXT NOT NULL,
    "validity" TEXT NOT NULL,
    "commission" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "DataPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "activeProvider" "SmeProvider" NOT NULL,

    CONSTRAINT "ProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletId_key" ON "User"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "DataPrice_network_id_plan_name_id_key" ON "DataPrice"("network_id", "plan_name_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
