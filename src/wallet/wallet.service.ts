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

      const platformLedger = await tx.ledger.create({
        data: {
          description: `Received ${amount} from user ${user.id} as liability`,
          createdBy: 'SYSTEM',
        },
      });

      const platformLiabilityWallet = await tx.wallet.findFirst({
        where: { name: 'PLATFORM_LIABILITY_WALLET' },
      });

      if (!platformLiabilityWallet) {
        throw new NotFoundException('Platform liability wallet not found');
      }

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
    const wallets = [
      { id: 'platform-liability-wallet-id', name: 'PLATFORM_LIABILITY_WALLET' },
      { id: 'platform-revenue-wallet-id', name: 'PLATFORM_REVENUE_WALLET' },
      { id: 'platform-profit-wallet-id', name: 'PLATFORM_PROFIT_WALLET' },
    ];

    await Promise.all(
      wallets.map((wallet) =>
        this.prisma.wallet.upsert({
          where: { name: wallet.name },
          update: {},
          create: {
            id: wallet.id,
            name: wallet.name,
            balance: new Decimal(0),
          },
        }),
      ),
    );

    console.log('✅ Platform wallets initialized');
  }

  async getInflowOutflow(
    currentUserId: string,
    timeframe: 'minute' | 'hour' | 'day' | 'month',
    startDate?: Date,
    endDate?: Date,
  ) {
    // 1. Whitelist timeframe to enforce runtime safety
    const allowedTimeframes = ['minute', 'hour', 'day', 'month'] as const;
    if (!allowedTimeframes.includes(timeframe)) {
      throw new BadRequestException('Invalid timeframe');
    }

    // 2. Verify admin before touching sensitive data
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { userRole: true },
    });

    if (!user || user.userRole !== Role.admin) {
      throw new ForbiddenException(
        'Only admins can access inflow/outflow analytics',
      );
    }

    // 3. Get platform wallet IDs
    const platformWallets = await this.prisma.wallet.findMany({
      where: {
        name: { in: ['PLATFORM_REVENUE_WALLET', 'PLATFORM_PROFIT_WALLET'] },
      },
      select: { id: true },
    });

    const walletIds = platformWallets.map((wallet) => wallet.id);
    if (walletIds.length === 0) {
      return [];
    }

    // 4. Prebuild safe queries for each allowed timeframe
    const queries: Record<typeof timeframe, any> = {
      minute: this.prisma.$queryRaw`
      SELECT
        date_trunc('minute', "createdAt") AS truncated_date,
        type,
        SUM(amount) AS total_amount
      FROM "Entry"
      WHERE "walletId" = ANY(${walletIds}::text[])
        ${startDate ? Prisma.sql`AND "createdAt" >= ${startDate}` : Prisma.sql``}
        ${endDate ? Prisma.sql`AND "createdAt" <= ${endDate}` : Prisma.sql``}
      GROUP BY date_trunc('minute', "createdAt"), type
      ORDER BY truncated_date ASC
    `,
      hour: this.prisma.$queryRaw`
      SELECT
        date_trunc('hour', "createdAt") AS truncated_date,
        type,
        SUM(amount) AS total_amount
      FROM "Entry"
      WHERE "walletId" = ANY(${walletIds}::text[])
        ${startDate ? Prisma.sql`AND "createdAt" >= ${startDate}` : Prisma.sql``}
        ${endDate ? Prisma.sql`AND "createdAt" <= ${endDate}` : Prisma.sql``}
      GROUP BY date_trunc('hour', "createdAt"), type
      ORDER BY truncated_date ASC
    `,
      day: this.prisma.$queryRaw`
      SELECT
        date_trunc('day', "createdAt") AS truncated_date,
        type,
        SUM(amount) AS total_amount
      FROM "Entry"
      WHERE "walletId" = ANY(${walletIds}::text[])
        ${startDate ? Prisma.sql`AND "createdAt" >= ${startDate}` : Prisma.sql``}
        ${endDate ? Prisma.sql`AND "createdAt" <= ${endDate}` : Prisma.sql``}
      GROUP BY date_trunc('day', "createdAt"), type
      ORDER BY truncated_date ASC
    `,
      month: this.prisma.$queryRaw`
      SELECT
        date_trunc('month', "createdAt") AS truncated_date,
        type,
        SUM(amount) AS total_amount
      FROM "Entry"
      WHERE "walletId" = ANY(${walletIds}::text[])
        ${startDate ? Prisma.sql`AND "createdAt" >= ${startDate}` : Prisma.sql``}
        ${endDate ? Prisma.sql`AND "createdAt" <= ${endDate}` : Prisma.sql``}
      GROUP BY date_trunc('month', "createdAt"), type
      ORDER BY truncated_date ASC
    `,
    };

    // 5. Run the correct query for the selected timeframe
    const result = (await queries[timeframe]) as Array<{
      truncated_date: Date;
      type: 'CREDIT' | 'DEBIT';
      total_amount: Decimal;
    }>;

    // 6. Format output with 0 defaults for missing inflow/outflow
    const formattedResult = result.reduce(
      (acc, curr) => {
        const dateKey = curr.truncated_date.toISOString();
        if (!acc[dateKey]) {
          acc[dateKey] = { inflow: new Decimal(0), outflow: new Decimal(0) };
        }
        if (curr.type === 'CREDIT') {
          acc[dateKey].inflow = curr.total_amount || new Decimal(0);
        } else {
          acc[dateKey].outflow = curr.total_amount || new Decimal(0);
        }
        return acc;
      },
      {} as Record<string, { inflow: Decimal; outflow: Decimal }>,
    );

    return Object.entries(formattedResult).map(
      ([date, { inflow, outflow }]) => ({
        date,
        inflow: inflow.toNumber(),
        outflow: outflow.toNumber(),
      }),
    );
  }
}
