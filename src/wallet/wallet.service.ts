import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from 'generated/prisma/runtime/library';
import { PrismaService } from 'src/db/prisma.service';
import { DataStationService } from 'src/providers/datastation/datastation.service';
import { HusmodService } from 'src/providers/husmod/husmod.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataStationService: DataStationService,
    private readonly husmodSevice: HusmodService,
  ) {}

  async creditWallet(userId: string, amount: Decimal) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('User or account not found');
    }

    const accountId = user.wallet.id;

    const newBalance = user.wallet.balance.plus(amount);

    const updatedAccount = await this.prisma.wallet.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    const ledger = await this.prisma.ledger.create({
      data: {
        description: `${user.wallet.name} funds wallet at ${new Date().toISOString()}`,
        createdBy: user.id,
      },
    });

    await this.prisma.entry.create({
      data: {
        walletId: accountId,
        ledgerId: ledger.id,
        amount,
        type: 'CREDIT',
      },
    });
    return updatedAccount;
  }

  async debitWallet(userId: string, amount: Decimal) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('User or account not found');
    }

    const accountId = user.wallet.id;

    const newBalance = user.wallet.balance.minus(amount);

    const updatedAccount = await this.prisma.wallet.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    const ledger = await this.prisma.ledger.create({
      data: {
        description: `${user.wallet.name} debited wallet at ${new Date().toISOString()}`,
        createdBy: user.id,
      },
    });

    await this.prisma.entry.create({
      data: {
        walletId: accountId,
        ledgerId: ledger.id,
        amount,
        type: 'DEBIT',
      },
    });

    return updatedAccount;
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

  async getProviderBalance() {
    const dataStationBal =
      await this.dataStationService.getMyDataStationDetails();

    const husmodBal = await this.husmodSevice.getMyHusmodDetails();

    return { dataStationBal, husmodBal };
  }
}
