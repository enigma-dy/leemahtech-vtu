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
import { LeemahService } from 'src/providers/leemah/leemah.service';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';
import { CreateUnifiedPlanDto, DataDto, UpdataDataDto } from './dto/data.dto';
import { HusmodService } from 'src/providers/husmod/husmod.service';
import { DataStationService } from 'src/providers/datastation/datastation.service';
import { ProviderService } from 'src/providers/provider.service';
import { SmeProvider } from 'src/providers/dto/provider.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { DataStationDto } from 'src/providers/datastation/dto/datastation.dto';
import { HusmodDataDto } from 'src/providers/husmod/dto/husmod.dto';
import { DataPurchaseEvent } from 'src/email/events/mail.event';
import { NotFoundError } from 'rxjs';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DataService {
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
        selling_price: true,
        network_name: true,
        network_id: true,
        plan_type: true,
        validity: true,
      },
    });
  }

  async fetchAndStoreAllPlans(): Promise<{
    message: string;
    count: number;
    data: CreateUnifiedPlanDto[];
  }> {
    const husmodResponse = await this.husmodService.getDataPricing();
    const datastationResponse = await this.dataStationService.getDataPricing();

    const unified: CreateUnifiedPlanDto[] = [];

    const husmodData = husmodResponse;
    const datastationData = datastationResponse;

    const allHusmodPlans = [
      ...(husmodData?.MTN_PLAN || []),
      ...(husmodData?.GLO_PLAN || []),
      ...(husmodData?.AIRTEL_PLAN || []),
      ...(husmodData?.['9MOBILE_PLAN'] || []),
    ];

    allHusmodPlans.forEach((plan) => {
      unified.push({
        provider: SmeProvider.HUSMODATA,
        data_plan_id: plan.dataplan_id,
        network_id: plan.network,
        network_name: plan.plan_network,
        plan_amount: parseFloat(plan.plan_amount),
        selling_price: parseFloat(plan.plan_amount),
        plan_size: plan.plan,
        plan_type: plan.plan_type || '',
        validity: plan.month_validate?.replace(/---/g, '').trim() || '',
      });
    });

    Object.values(datastationData || {}).forEach((network: any) => {
      if (!network.network_info || !network.data_plans) return;
      const networkId = network.network_info.id;
      const networkName = network.network_info.name;
      network.data_plans.forEach((plan) => {
        unified.push({
          provider: SmeProvider.DATASTATION,
          data_plan_id: plan.id.toString(),
          network_id: networkId,
          network_name: networkName,
          plan_amount: plan.plan_amount,
          selling_price: plan.selling_price,
          plan_size: `${plan.plan_size}${plan.plan_Volume}`,
          plan_type: plan.plan_type || '',
          validity: plan.month_validate?.trim() || '',
        });
      });
    });

    for (const plan of unified) {
      await this.prisma.unifiedPlan.upsert({
        where: {
          provider_data_plan_id: {
            provider: plan.provider,
            data_plan_id: plan.data_plan_id,
          },
        },
        create: {
          provider: plan.provider,
          data_plan_id: plan.data_plan_id,
          network_id: plan.network_id,
          network_name: plan.network_name,
          plan_amount: plan.plan_amount,
          selling_price: plan.plan_amount,
          plan_size: plan.plan_size,
          plan_type: plan.plan_type || '',
          validity: plan.validity || '',
        },
        update: {
          network_id: plan.network_id,
          network_name: plan.network_name,
          plan_amount: plan.plan_amount,
          plan_size: plan.plan_size,
          plan_type: plan.plan_type,
          validity: plan.validity,
        },
      });
    }

    return {
      message:
        'Plans from all providers have been successfully fetched and stored.',
      count: unified.length,
      data: unified,
    };
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

      if (user.wallet.balance.lessThan(plan.selling_price)) {
        throw new BadRequestException('Insufficient funds');
      }

      await tx.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: { decrement: plan.selling_price } },
      });

      const userLedger = await tx.ledger.create({
        data: {
          description: `Data purchase: ${plan.plan_size} on ${plan.network_name} for ${plan.selling_price}`,
          createdBy: user.id,
        },
      });

      await tx.entry.create({
        data: {
          walletId: user.wallet.id,
          ledgerId: userLedger.id,
          amount: plan.selling_price,
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
        data: { balance: { decrement: plan.selling_price } },
      });

      const liabilityLedger = await tx.ledger.create({
        data: {
          description: `Liability reduced by ${plan.selling_price} for data purchase`,
          createdBy: 'SYSTEM',
        },
      });

      await tx.entry.create({
        data: {
          walletId: platformLiabilityWallet.id,
          ledgerId: liabilityLedger.id,
          amount: plan.selling_price,
          type: 'DEBIT',
        },
      });

      const revenueLedger = await tx.ledger.create({
        data: {
          description: `Revenue from data purchase: ${plan.selling_price} for plan ${plan.id}`,
          createdBy: 'SYSTEM',
        },
      });

      await tx.entry.create({
        data: {
          walletId: 'PLATFORM_REVENUE_WALLET',
          ledgerId: revenueLedger.id,
          amount: plan.selling_price,
          type: 'CREDIT',
        },
      });

      const profit = plan.selling_price.sub(plan.plan_amount);
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
      await tx.entry.create({
        data: {
          walletId: platformProfitWallet.id,
          ledgerId: profitLedger.id,
          amount: plan.plan_amount,
          type: 'DEBIT',
        },
      });

      // Call provider API
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
          plan.selling_price,
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
          plan.selling_price,
        );
      }

      // Handle failed purchase
      if (!purchaseResult?.success) {
        // Refund user
        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { increment: plan.selling_price } },
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
            amount: plan.selling_price,
            type: 'CREDIT',
          },
        });

        // Reverse platform revenue
        await tx.entry.create({
          data: {
            walletId: 'PLATFORM_REVENUE_WALLET',
            ledgerId: refundLedger.id,
            amount: plan.selling_price,
            type: 'DEBIT',
          },
        });

        // Reverse platform profit
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

        // Restore platform liability
        await tx.wallet.update({
          where: { id: platformLiabilityWallet.id },
          data: { balance: { increment: plan.selling_price } },
        });

        await tx.entry.create({
          data: {
            walletId: platformLiabilityWallet.id,
            ledgerId: refundLedger.id,
            amount: plan.selling_price,
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
          amount: plan.selling_price,
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
            plan.selling_price,
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

  async updateDataPlan(data: UpdataDataDto) {
    const { id, selling_price } = data;

    const updated = await this.prisma.unifiedPlan.update({
      where: { id: data.id },
      data: {
        selling_price: new Decimal(selling_price),
      },
    });

    return {
      message: 'Plan updated successfully',
      data: updated,
    };
  }
}
