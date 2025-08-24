import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, Role, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class WalletService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializePlatformWallets();
  }
  async creditWallet(userId: string, amount: Decimal) {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || !user.wallet) {
        throw new NotFoundException('User or wallet not found');
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      const userLedger = await tx.ledger.create({
        data: {
          description: `User ${user.fullName} funded wallet with ${amount} at ${new Date().toISOString()}`,
          createdBy: user.id,
        },
      });

      await tx.entry.create({
        data: {
          walletId: user.wallet.id,
          ledgerId: userLedger.id,
          amount,
          type: 'CREDIT',
        },
      });

      const platformLiabilityWallet = await tx.wallet.findFirst({
        where: { name: 'PLATFORM_LIABILITY_WALLET' },
      });

      if (!platformLiabilityWallet) {
        throw new NotFoundException('Platform liability wallet not found');
      }

      await tx.wallet.update({
        where: { id: platformLiabilityWallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      const platformLedger = await tx.ledger.create({
        data: {
          description: `Received ${amount} from user ${user.id} as liability`,
          createdBy: 'SYSTEM',
        },
      });

      await tx.entry.create({
        data: {
          walletId: platformLiabilityWallet.id,
          ledgerId: platformLedger.id,
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
        throw new NotFoundException('User or wallet not found');
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
          description: `${wallet.name} debited wallet with ${amount} at ${new Date().toISOString()}`,
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
    if (!user || !user.wallet) {
      throw new NotFoundException('User or wallet not found');
    }
    return user.wallet.balance;
  }

  async getUserTransactions(
    userId: string,
    filters: {
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
      type?: 'CREDIT' | 'DEBIT';
      skip?: number;
      take?: number;
    } = {},
  ) {
    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: filters.skip || 0,
      take: filters.take || 20,
    });

    const transactionsWithEntries = await Promise.all(
      transactions.map(async (transaction) => {
        if (!transaction.walletId) {
          return { ...transaction, entries: [] };
        }

        const entries = await this.prisma.entry.findMany({
          where: {
            walletId: transaction.walletId,
            type: filters.type ? filters.type : undefined,
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          },
          select: {
            type: true,
            amount: true,
            createdAt: true,
            wallet: {
              select: {
                name: true,
              },
            },
          },
        });

        return {
          ...transaction,
          entries,
        };
      }),
    );

    return transactionsWithEntries;
  }

  async getAllTransactions(
    currentUserId: string,
    filters: {
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
      type?: 'CREDIT' | 'DEBIT';
      userId?: string;
      skip?: number;
      take?: number;
    } = {},
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!user || user.userRole !== Role.admin) {
      throw new ForbiddenException('Only admins can access all transactions');
    }

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: filters.skip || 0,
      take: filters.take || 20,
    });

    // Fetch entries for each transaction's walletId
    const transactionsWithEntries = await Promise.all(
      transactions.map(async (transaction) => {
        if (!transaction.walletId) {
          return { ...transaction, entries: [] };
        }

        const entries = await this.prisma.entry.findMany({
          where: {
            walletId: transaction.walletId,
            type: filters.type ? filters.type : undefined,
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          },
          select: {
            type: true,
            amount: true,
            createdAt: true,
            wallet: {
              select: {
                name: true,
              },
            },
          },
        });

        return {
          ...transaction,
          entries,
        };
      }),
    );

    return transactionsWithEntries;
  }

  private async initializePlatformWallets() {
    const walletNames = [
      'PLATFORM_LIABILITY_WALLET',
      'PLATFORM_REVENUE_WALLET',
      'PLATFORM_PROFIT_WALLET',
    ];

    const existingWallets = await this.prisma.wallet.findMany({
      where: {
        name: { in: walletNames },
      },
      select: { name: true },
    });

    if (existingWallets.length === walletNames.length) {
      console.log('Platform wallets already exist. Skipping initialization.');
      return;
    }

    const missingWallets = walletNames.filter(
      (name) => !existingWallets.some((w) => w.name === name),
    );

    await Promise.all(
      missingWallets.map((name) =>
        this.prisma.wallet.create({
          data: {
            id: `${name.toLowerCase().replace(/_/g, '-')}-id`,
            name,
            balance: new Decimal(0),
          },
        }),
      ),
    );

    console.log(`Created missing llets: ${missingWallets.join(', ')}`);
  }

  async getDepositsAndUsage(
    currentUserId: string,
    timeframe: 'minute' | 'hour' | 'day' | 'month',
    startDate?: Date,
    endDate?: Date,
  ) {
    const allowedTimeframes = ['minute', 'hour', 'day', 'month'] as const;
    if (!allowedTimeframes.includes(timeframe)) {
      throw new BadRequestException('Invalid timeframe');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { userRole: true },
    });

    if (!user || user.userRole !== Role.admin) {
      throw new ForbiddenException(
        'Only admins can access deposits and usage analytics',
      );
    }

    const liabilityWallet = await this.prisma.wallet.findFirst({
      where: { name: 'PLATFORM_LIABILITY_WALLET' },
      select: { id: true },
    });

    if (!liabilityWallet) {
      console.warn('Platform liability wallet not found');
      return [];
    }

    const defaultStartDate = startDate || new Date('2025-01-01T00:00:00Z');
    const defaultEndDate = endDate || new Date();

    const depositQueries: Record<typeof timeframe, any> = {
      minute: this.prisma.$queryRaw`
      SELECT
        date_trunc('minute', "createdAt") AS truncated_date,
        SUM(amount) AS total_deposits
      FROM "Entry"
      WHERE "walletId" = ${liabilityWallet.id}
        AND type = 'CREDIT'
        AND "createdAt" >= ${defaultStartDate}
        AND "createdAt" <= ${defaultEndDate}
      GROUP BY date_trunc('minute', "createdAt")
      ORDER BY truncated_date ASC
    `,
      hour: this.prisma.$queryRaw`
      SELECT
        date_trunc('hour', "createdAt") AS truncated_date,
        SUM(amount) AS total_deposits
      FROM "Entry"
      WHERE "walletId" = ${liabilityWallet.id}
        AND type = 'CREDIT'
        AND "createdAt" >= ${defaultStartDate}
        AND "createdAt" <= ${defaultEndDate}
      GROUP BY date_trunc('hour', "createdAt")
      ORDER BY truncated_date ASC
    `,
      day: this.prisma.$queryRaw`
      SELECT
        date_trunc('day', "createdAt") AS truncated_date,
        SUM(amount) AS total_deposits
      FROM "Entry"
      WHERE "walletId" = ${liabilityWallet.id}
        AND type = 'CREDIT'
        AND "createdAt" >= ${defaultStartDate}
        AND "createdAt" <= ${defaultEndDate}
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY truncated_date ASC
    `,
      month: this.prisma.$queryRaw`
      SELECT
        date_trunc('month', "createdAt") AS truncated_date,
        SUM(amount) AS total_deposits
      FROM "Entry"
      WHERE "walletId" = ${liabilityWallet.id}
        AND type = 'CREDIT'
        AND "createdAt" >= ${defaultStartDate}
        AND "createdAt" <= ${defaultEndDate}
      GROUP BY date_trunc('month', "createdAt")
      ORDER BY truncated_date ASC
    `,
    };

    // Query for usage (DEBIT entries for user wallets)
    const usageQueries: Record<typeof timeframe, any> = {
      minute: this.prisma.$queryRaw`
      SELECT
        date_trunc('minute', "createdAt") AS truncated_date,
        SUM(amount) AS total_usage
      FROM "Entry"
      WHERE "walletId" IN (
        SELECT "walletId" FROM "User"
      )
        AND type = 'DEBIT'
        AND "createdAt" >= ${defaultStartDate}
        AND "createdAt" <= ${defaultEndDate}
      GROUP BY date_trunc('minute', "createdAt")
      ORDER BY truncated_date ASC
    `,
      hour: this.prisma.$queryRaw`
      SELECT
        date_trunc('hour', "createdAt") AS truncated_date,
        SUM(amount) AS total_usage
      FROM "Entry"
      WHERE "walletId" IN (
        SELECT "walletId" FROM "User"
      )
        AND type = 'DEBIT'
        AND "createdAt" >= ${defaultStartDate}
        AND "createdAt" <= ${defaultEndDate}
      GROUP BY date_trunc('hour', "createdAt")
      ORDER BY truncated_date ASC
    `,
      day: this.prisma.$queryRaw`
      SELECT
        date_trunc('day', "createdAt") AS truncated_date,
        SUM(amount) AS total_usage
      FROM "Entry"
      WHERE "walletId" IN (
        SELECT "walletId" FROM "User"
      )
        AND type = 'DEBIT'
        AND "createdAt" >= ${defaultStartDate}
        AND "createdAt" <= ${defaultEndDate}
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY truncated_date ASC
    `,
      month: this.prisma.$queryRaw`
      SELECT
        date_trunc('month', "createdAt") AS truncated_date,
        SUM(amount) AS total_usage
      FROM "Entry"
      WHERE "walletId" IN (
        SELECT "walletId" FROM "User"
      )
        AND type = 'DEBIT'
        AND "createdAt" >= ${defaultStartDate}
        AND "createdAt" <= ${defaultEndDate}
      GROUP BY date_trunc('month', "createdAt")
      ORDER BY truncated_date ASC
    `,
    };

    const [depositResult, usageResult] = await Promise.all([
      depositQueries[timeframe] as Promise<
        Array<{ truncated_date: Date; total_deposits: Decimal }>
      >,
      usageQueries[timeframe] as Promise<
        Array<{ truncated_date: Date; total_usage: Decimal }>
      >,
    ]);

    const combinedResult = depositResult.reduce(
      (acc, curr) => {
        const dateKey = curr.truncated_date.toISOString();
        if (!acc[dateKey]) {
          acc[dateKey] = {
            total_deposits: new Decimal(0),
            total_usage: new Decimal(0),
          };
        }
        acc[dateKey].total_deposits = curr.total_deposits || new Decimal(0);
        return acc;
      },
      {} as Record<string, { total_deposits: Decimal; total_usage: Decimal }>,
    );

    usageResult.forEach((curr) => {
      const dateKey = curr.truncated_date.toISOString();
      if (!combinedResult[dateKey]) {
        combinedResult[dateKey] = {
          total_deposits: new Decimal(0),
          total_usage: new Decimal(0),
        };
      }
      combinedResult[dateKey].total_usage = curr.total_usage || new Decimal(0);
    });

    const formattedOutput = Object.entries(combinedResult).map(
      ([date, { total_deposits, total_usage }]) => ({
        date,
        total_deposits: total_deposits.toNumber(),
        total_usage: total_usage.toNumber(),
      }),
    );

    console.log('Formatted deposits and usage output:', formattedOutput);
    return formattedOutput;
  }

  async auditBalances(
    currentUserId: string,
  ): Promise<{ matches: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { userRole: true },
    });

    if (!user || user.userRole !== Role.admin) {
      throw new ForbiddenException('Only admins can audit balances');
    }

    const totalUserBalances = await this.prisma.wallet.aggregate({
      where: { User: { isNot: null } },
      _sum: { balance: true },
    });

    const liabilityWallet = await this.prisma.wallet.findFirst({
      where: { name: 'PLATFORM_LIABILITY_WALLET' },
      select: { balance: true },
    });

    if (!liabilityWallet) {
      throw new NotFoundException('Platform liability wallet not found');
    }

    const userBalanceSum = totalUserBalances._sum?.balance ?? new Decimal(0);
    const liabilityBalance = liabilityWallet.balance;

    if (userBalanceSum.equals(liabilityBalance)) {
      console.log(' Balances match');
      return {
        matches: true,
        message:
          'Total user balances match the platform liability wallet balance',
      };
    } else {
      console.error('Balance mismatch detected!');
      console.error(`Total user balances: ${userBalanceSum.toString()}`);
      console.error(
        `Platform liability wallet balance: ${liabilityBalance.toString()}`,
      );
      return {
        matches: false,
        message: `Balance mismatch: Total user balances (${userBalanceSum.toString()}) do not match platform liability wallet balance (${liabilityBalance.toString()})`,
      };
    }
  }
}
