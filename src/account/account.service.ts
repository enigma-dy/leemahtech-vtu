import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from 'generated/prisma/runtime/library';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async creditAccount(userId: string, amount: Decimal) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { account: true },
    });

    if (!user || !user.account) {
      throw new NotFoundException('User or account not found');
    }

    const accountId = user.account.id;

    const newBalance = user.account.balance.plus(amount);

    const updatedAccount = await this.prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    const ledger = await this.prisma.ledger.create({
      data: {
        description: `${user.account.name} funds wallet at ${new Date().toISOString()}`,
        createdBy: user.id,
      },
    });

    await this.prisma.entry.create({
      data: {
        accountId: accountId,
        ledgerId: ledger.id,
        amount,
        type: 'CREDIT',
      },
    });
    return updatedAccount;
  }

  async debitAccount(userId: string, amount: Decimal) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: { account: true },
    });

    if (!user || !user.account) {
      throw new NotFoundException('User or account not found');
    }

    const accountId = user.account.id;

    const newBalance = user.account.balance.minus(amount);

    const updatedAccount = await this.prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    const ledger = await this.prisma.ledger.create({
      data: {
        description: `${user.account.name} debited wallet at ${new Date().toISOString()}`,
        createdBy: user.id,
      },
    });

    await this.prisma.entry.create({
      data: {
        accountId: accountId,
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
      include: { account: true },
    });
    if (!user) {
      throw new NotFoundException('User not Found');
    }
    return user.account.balance;
  }
}
