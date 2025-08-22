import {
  BadRequestException,
  Body,
  HttpStatus,
  Injectable,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataPurchaseEvent } from 'src/email/events/mail.event';
import { Decimal } from '@prisma/client/runtime/library';
import { LeemahService } from 'src/providers/leemah/leemah.service';
import { HusmodService } from 'src/providers/husmod/husmod.service';
import { DataStationService } from 'src/providers/datastation/datastation.service';
import { ProviderService } from 'src/providers/provider.service';
import {
  CreateUnifiedPlanDto,
  DataDto,
  UpdataResellerDataDto,
} from './dto/reseller.dto';

@Injectable()
export class ResellerDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leemahService: LeemahService,
    private readonly husmodService: HusmodService,
    private readonly dataStationService: DataStationService,
    private readonly activeProvider: ProviderService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllDataPlans() {
    return this.prisma.unifiedPlan.findMany({
      select: {
        id: true,
        provider: true,
        data_plan_id: true,
        plan_size: true,
        plan_amount: true,
        reseller_price: true,
        network_name: true,
        network_id: true,
        plan_type: true,
        validity: true,
      },
    });
  }

  async buyData(userId: string, data: DataDto): Promise<any> {
    return await this.prisma.$transaction(async (tx) => {
      const plan = await tx.unifiedPlan.findFirst({
        where: { id: data.id },
      });

      if (!plan) {
        return { success: false, message: 'Data plan not found' };
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || !user.wallet) {
        throw new NotFoundException('User or wallet not found');
      }

      if (user.wallet.balance.lessThan(plan.reseller_price)) {
        throw new BadRequestException('Insufficient funds in reseller Wallet');
      }

      await tx.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: { decrement: plan.reseller_price } },
      });

      const userLedger = await tx.ledger.create({
        data: {
          description: `Data purchase: ${plan.plan_size} on ${plan.network_name} for ${plan.reseller_price} using reseller endpoint`,
          createdBy: user.id,
        },
      });

      await tx.entry.create({
        data: {
          walletId: user.wallet.id,
          ledgerId: userLedger.id,
          amount: plan.reseller_price,
          type: 'DEBIT',
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
        data: { balance: { decrement: plan.reseller_price } },
      });

      const liabilityLedger = await tx.ledger.create({
        data: {
          description: `Liability reduced by ${plan.reseller_price} for data purchase`,
          createdBy: 'SYSTEM',
        },
      });

      await tx.entry.create({
        data: {
          walletId: platformLiabilityWallet.id,
          ledgerId: liabilityLedger.id,
          amount: plan.reseller_price,
          type: 'DEBIT',
        },
      });

      const platformRevenueWallet = await tx.wallet.findFirst({
        where: { name: 'PLATFORM_REVENUE_WALLET' },
      });

      if (!platformRevenueWallet) {
        throw new NotFoundException('Platform revenue wallet not found');
      }

      await tx.wallet.update({
        where: { id: platformRevenueWallet.id },
        data: { balance: { increment: plan.reseller_price } },
      });

      const revenueLedger = await tx.ledger.create({
        data: {
          description: `Revenue from data purchase: ${plan.reseller_price} for plan ${plan.id}`,
          createdBy: 'SYSTEM',
        },
      });

      await tx.entry.create({
        data: {
          walletId: platformRevenueWallet.id,
          ledgerId: revenueLedger.id,
          amount: plan.reseller_price,
          type: 'CREDIT',
        },
      });

      const profit = plan.reseller_price; // Set to full reseller_price for gross, then deduct cost later for net consistency
      const platformProfitWallet = await tx.wallet.findFirst({
        where: { name: 'PLATFORM_PROFIT_WALLET' },
      });

      if (!platformProfitWallet) {
        throw new NotFoundException('Platform profit wallet not found');
      }

      await tx.wallet.update({
        where: { id: platformProfitWallet.id },
        data: { balance: { increment: profit } },
      });

      const profitLedger = await tx.ledger.create({
        data: {
          description: `Profit from data purchase: ${profit} for plan ${plan.id}`,
          createdBy: 'SYSTEM',
        },
      });

      await tx.entry.create({
        data: {
          walletId: platformProfitWallet.id,
          ledgerId: profitLedger.id,
          amount: profit,
          type: 'CREDIT',
        },
      });

      // Record provider cost
      await tx.wallet.update({
        where: { id: platformProfitWallet.id },
        data: { balance: { decrement: plan.plan_amount } },
      });

      await tx.entry.create({
        data: {
          walletId: platformProfitWallet.id,
          ledgerId: profitLedger.id,
          amount: plan.plan_amount,
          type: 'DEBIT',
        },
      });

      let purchaseResult;
      if (plan.provider === 'husmodata') {
        purchaseResult = await this.husmodService.buyData(
          userId,
          {
            network: plan.network_id.toString(),
            mobile_number: data.mobileNumber,
            plan: plan.data_plan_id,
            planSize: plan.plan_size,
            planVolume: plan.plan_size,
            planName: plan.plan_type,
            Ported_number: true,
          },
          plan.reseller_price,
        );
      } else if (plan.provider === 'datastation') {
        purchaseResult = await this.dataStationService.buyData(
          userId,
          {
            network: plan.network_id.toString(),
            mobile_number: data.mobileNumber,
            plan: plan.data_plan_id,
            planSize: plan.plan_size,
            planVolume: plan.plan_size,
            planName: plan.plan_type,
            Ported_number: true,
          },
          plan.reseller_price,
        );
      }

      // Handle failed purchase
      if (!purchaseResult?.success) {
        // Refund user
        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { increment: plan.reseller_price } },
        });

        const refundLedger = await tx.ledger.create({
          data: {
            description: `Refund for failed data purchase: ${plan.plan_size}`,
            createdBy: 'SYSTEM',
          },
        });

        await tx.entry.create({
          data: {
            walletId: user.wallet.id,
            ledgerId: refundLedger.id,
            amount: plan.reseller_price,
            type: 'CREDIT',
          },
        });

        // Reverse platform revenue
        await tx.wallet.update({
          where: { id: platformRevenueWallet.id },
          data: { balance: { decrement: plan.reseller_price } },
        });

        await tx.entry.create({
          data: {
            walletId: platformRevenueWallet.id,
            ledgerId: refundLedger.id,
            amount: plan.reseller_price,
            type: 'DEBIT',
          },
        });

        // Reverse platform profit credit
        await tx.wallet.update({
          where: { id: platformProfitWallet.id },
          data: { balance: { decrement: profit } },
        });

        await tx.entry.create({
          data: {
            walletId: platformProfitWallet.id,
            ledgerId: refundLedger.id,
            amount: profit,
            type: 'DEBIT',
          },
        });

        // Reverse provider cost debit (since no cost incurred)
        await tx.wallet.update({
          where: { id: platformProfitWallet.id },
          data: { balance: { increment: plan.plan_amount } },
        });

        await tx.entry.create({
          data: {
            walletId: platformProfitWallet.id,
            ledgerId: refundLedger.id,
            amount: plan.plan_amount,
            type: 'CREDIT',
          },
        });

        // Restore platform liability
        await tx.wallet.update({
          where: { id: platformLiabilityWallet.id },
          data: { balance: { increment: plan.reseller_price } },
        });

        await tx.entry.create({
          data: {
            walletId: platformLiabilityWallet.id,
            ledgerId: refundLedger.id,
            amount: plan.reseller_price,
            type: 'CREDIT',
          },
        });

        return {
          success: false,
          message: 'Data purchase failed, amount refunded',
        };
      }

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          txRef: purchaseResult.txRef || purchaseResult.transactionId,
          userId,
          amount: plan.reseller_price,
          currency: 'NGN',
          status: purchaseResult.success ? 'SUCCESS' : 'FAILED',
          provider: plan.provider,
          channel: 'DATA_PURCHASE',
          walletId: user.wallet.id,
          completedAt: new Date(),
        },
      });

      if (purchaseResult.success) {
        this.eventEmitter.emit(
          'data.purchase',
          new DataPurchaseEvent(
            user.email!,
            user.fullName!,
            plan.network_name,
            plan.plan_type,
            plan.plan_size,
            data.mobileNumber,
            plan.reseller_price,
            transaction.txRef,
          ),
        );
      }

      return {
        success: purchaseResult.success,
        transactionId: transaction.id,
        message: purchaseResult.success
          ? 'Data purchase successful'
          : 'Data purchase failed',
      };
    });
  }

  async updateDataPlan(data: UpdataResellerDataDto) {
    const { id, reseller_price } = data;

    const updated = await this.prisma.unifiedPlan.update({
      where: { id: data.id },
      data: {
        reseller_price: new Decimal(reseller_price),
      },
    });

    return {
      message: 'Plan updated successfully',
      data: updated,
    };
  }
}
