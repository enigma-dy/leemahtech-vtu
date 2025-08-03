import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from 'generated/prisma/runtime/library';
import { PrismaService } from 'src/db/prisma.service';
import { DataStationService } from 'src/providers/datastation/datastation.service';
import { HusmodService } from 'src/providers/husmod/husmod.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async creditWallet(userId: string, amount: Decimal) {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || !user.wallet) {
        throw new NotFoundException('User or account not found');
      }

      const accountId = user.wallet.id;

      const updatedWallet = await tx.wallet.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      const ledger = await tx.ledger.create({
        data: {
          description: `${user.wallet.name} funded wallet at ${new Date().toISOString()}`,
          createdBy: user.id,
        },
      });

      await tx.entry.create({
        data: {
          walletId: accountId,
          ledgerId: ledger.id,
          amount,
          type: 'CREDIT',
        },
      });

      return updatedWallet;
    });
  }

  async debitWallet(userId: string, amount: Decimal) {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || !user.wallet) {
        throw new NotFoundException('User or account not found');
      }

      const wallet = user.wallet;

      if (wallet.balance.lessThan(amount)) {
        throw new BadRequestException('Insufficient funds');
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      const ledger = await tx.ledger.create({
        data: {
          description: `${wallet.name} debited wallet at ${new Date().toISOString()}`,
          createdBy: user.id,
        },
      });

      await tx.entry.create({
        data: {
          walletId: wallet.id,
          ledgerId: ledger.id,
          amount,
          type: 'DEBIT',
        },
      });

      return updatedWallet;
    });
  }

  async getBalance(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) {
      throw new NotFoundException('User not Found');
    }
    return user.wallet.balance;
  }
}
