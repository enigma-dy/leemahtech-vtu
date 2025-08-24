import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async recordSale(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: Decimal,
    cost: Decimal,
    description: string,
  ): Promise<{ success: boolean }> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('User or wallet not found');
    }

    if (user.wallet.balance.lessThan(amount)) {
      throw new BadRequestException('Insufficient funds');
    }

    // Debit user wallet
    await tx.wallet.update({
      where: { id: user.wallet.id },
      data: { balance: { decrement: amount } },
    });

    const userLedger = await tx.ledger.create({
      data: {
        description,
        createdBy: userId,
      },
    });

    await tx.entry.create({
      data: {
        walletId: user.wallet.id,
        ledgerId: userLedger.id,
        amount,
        type: 'DEBIT',
      },
    });

    // Debit platform liability
    const platformLiabilityWallet = await tx.wallet.findFirst({
      where: { name: 'PLATFORM_LIABILITY_WALLET' },
    });

    if (!platformLiabilityWallet) {
      throw new NotFoundException('Platform liability wallet not found');
    }

    await tx.wallet.update({
      where: { id: platformLiabilityWallet.id },
      data: { balance: { decrement: amount } },
    });

    const liabilityLedger = await tx.ledger.create({
      data: {
        description: `Liability reduced by ${amount} for ${description.toLowerCase()}`,
        createdBy: 'SYSTEM',
      },
    });

    await tx.entry.create({
      data: {
        walletId: platformLiabilityWallet.id,
        ledgerId: liabilityLedger.id,
        amount,
        type: 'DEBIT',
      },
    });

    // Credit platform revenue
    const platformRevenueWallet = await tx.wallet.findFirst({
      where: { name: 'PLATFORM_REVENUE_WALLET' },
    });

    if (!platformRevenueWallet) {
      throw new NotFoundException('Platform revenue wallet not found');
    }

    await tx.wallet.update({
      where: { id: platformRevenueWallet.id },
      data: { balance: { increment: amount } },
    });

    const revenueLedger = await tx.ledger.create({
      data: {
        description: `Revenue from ${description.toLowerCase()}: ${amount}`,
        createdBy: 'SYSTEM',
      },
    });

    await tx.entry.create({
      data: {
        walletId: platformRevenueWallet.id,
        ledgerId: revenueLedger.id,
        amount,
        type: 'CREDIT',
      },
    });

    // Credit platform profit (gross)
    const platformProfitWallet = await tx.wallet.findFirst({
      where: { name: 'PLATFORM_PROFIT_WALLET' },
    });

    if (!platformProfitWallet) {
      throw new NotFoundException('Platform profit wallet not found');
    }

    await tx.wallet.update({
      where: { id: platformProfitWallet.id },
      data: { balance: { increment: amount } },
    });

    const profitLedger = await tx.ledger.create({
      data: {
        description: `Profit from ${description.toLowerCase()}: ${amount} gross, cost ${cost}`,
        createdBy: 'SYSTEM',
      },
    });

    await tx.entry.create({
      data: {
        walletId: platformProfitWallet.id,
        ledgerId: profitLedger.id,
        amount,
        type: 'CREDIT',
      },
    });

    // Debit platform profit (cost)
    await tx.wallet.update({
      where: { id: platformProfitWallet.id },
      data: { balance: { decrement: cost } },
    });

    await tx.entry.create({
      data: {
        walletId: platformProfitWallet.id,
        ledgerId: profitLedger.id,
        amount: cost,
        type: 'DEBIT',
      },
    });

    return { success: true };
  }

  async recordRefund(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: Decimal,
    cost: Decimal,
    description: string,
  ): Promise<{ success: boolean }> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('User or wallet not found');
    }

    // Credit user wallet
    await tx.wallet.update({
      where: { id: user.wallet.id },
      data: { balance: { increment: amount } },
    });

    const refundLedger = await tx.ledger.create({
      data: {
        description,
        createdBy: 'SYSTEM',
      },
    });

    await tx.entry.create({
      data: {
        walletId: user.wallet.id,
        ledgerId: refundLedger.id,
        amount,
        type: 'CREDIT',
      },
    });

    // Credit platform liability
    const platformLiabilityWallet = await tx.wallet.findFirst({
      where: { name: 'PLATFORM_LIABILITY_WALLET' },
    });

    if (!platformLiabilityWallet) {
      throw new NotFoundException('Platform liability wallet not found');
    }

    await tx.wallet.update({
      where: { id: platformLiabilityWallet.id },
      data: { balance: { increment: amount } },
    });

    await tx.entry.create({
      data: {
        walletId: platformLiabilityWallet.id,
        ledgerId: refundLedger.id,
        amount,
        type: 'CREDIT',
      },
    });

    // Debit platform revenue
    const platformRevenueWallet = await tx.wallet.findFirst({
      where: { name: 'PLATFORM_REVENUE_WALLET' },
    });

    if (!platformRevenueWallet) {
      throw new NotFoundException('Platform revenue wallet not found');
    }

    await tx.wallet.update({
      where: { id: platformRevenueWallet.id },
      data: { balance: { decrement: amount } },
    });

    await tx.entry.create({
      data: {
        walletId: platformRevenueWallet.id,
        ledgerId: refundLedger.id,
        amount,
        type: 'DEBIT',
      },
    });

    // Debit platform profit (gross)
    const platformProfitWallet = await tx.wallet.findFirst({
      where: { name: 'PLATFORM_PROFIT_WALLET' },
    });

    if (!platformProfitWallet) {
      throw new NotFoundException('Platform profit wallet not found');
    }

    await tx.wallet.update({
      where: { id: platformProfitWallet.id },
      data: { balance: { decrement: amount } },
    });

    await tx.entry.create({
      data: {
        walletId: platformProfitWallet.id,
        ledgerId: refundLedger.id,
        amount,
        type: 'DEBIT',
      },
    });

    // Credit platform profit (reverse cost debit)
    await tx.wallet.update({
      where: { id: platformProfitWallet.id },
      data: { balance: { increment: cost } },
    });

    await tx.entry.create({
      data: {
        walletId: platformProfitWallet.id,
        ledgerId: refundLedger.id,
        amount: cost,
        type: 'CREDIT',
      },
    });

    return { success: true };
  }
}
