import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { HusmodService } from 'src/providers/husmod/husmod.service';
import { DataStationService } from 'src/providers/datastation/datastation.service';
import { ProviderService } from 'src/providers/provider.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataPurchaseEvent } from 'src/email/events/mail.event';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateUnifiedPlanDto, DataDto, UpdataDataDto } from './dto/data.dto';
import { SmeProvider } from 'src/providers/dto/provider.dto';
import { AccountingService } from 'src/accounting/accounting.service';

@Injectable()
export class DataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly husmodService: HusmodService,
    private readonly dataStationService: DataStationService,
    private readonly activeProvider: ProviderService,
    private readonly eventEmitter: EventEmitter2,
    private readonly accountingService: AccountingService,
  ) {}

  async getAllDataPlans(isReseller: boolean = false) {
    return this.prisma.unifiedPlan.findMany({
      select: {
        id: true,
        provider: true,
        data_plan_id: true,
        plan_size: true,
        plan_amount: true,
        selling_price: !isReseller,
        reseller_price: isReseller,
        network_name: true,
        network_id: true,
        plan_type: true,
        validity: true,
      },
    });
  }

  async buyData(
    userId: string,
    data: DataDto,
    isReseller: boolean = false,
  ): Promise<any> {
    return await this.prisma.$transaction(async (tx) => {
      const plan = await tx.unifiedPlan.findFirst({
        where: { id: data.id },
      });

      if (!plan) {
        return { success: false, message: 'Data plan not found' };
      }

      const price = isReseller ? plan.reseller_price : plan.selling_price;
      const cost = plan.plan_amount;
      const description = `Data purchase: ${plan.plan_size} on ${plan.network_name} for ${price}${isReseller ? ' using reseller endpoint' : ''}`;

      await this.accountingService.recordSale(
        tx,
        userId,
        price,
        cost,
        description,
      );

      // Call provider API
      let purchaseResult;
      const providerData = {
        network: plan.network_id.toString(),
        mobile_number: data.mobileNumber,
        plan: plan.data_plan_id,
        planSize: plan.plan_size,
        planVolume: plan.plan_size,
        planName: plan.plan_type,
        Ported_number: true,
      };

      if (plan.provider === 'husmodata') {
        purchaseResult = await this.husmodService.buyData(
          userId,
          providerData,
          price,
        );
      } else if (plan.provider === 'datastation') {
        purchaseResult = await this.dataStationService.buyData(
          userId,
          providerData,
          price,
        );
      }

      // Handle failed purchase
      if (!purchaseResult?.success) {
        const refundDescription = `Refund for failed data purchase: ${plan.plan_size}`;
        await this.accountingService.recordRefund(
          tx,
          userId,
          price,
          cost,
          refundDescription,
        );

        return {
          success: false,
          message: 'Data purchase failed, amount refunded',
        };
      }

      // Record transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) {
        throw new UnauthorizedException('Email or password incorrect');
      }

      const transaction = await tx.transaction.create({
        data: {
          txRef: purchaseResult.txRef || purchaseResult.transactionId,
          userId,
          amount: price,
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
            price,
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
      const planAmount = parseFloat(plan.plan_amount);
      unified.push({
        provider: SmeProvider.husmodata,
        data_plan_id: plan.dataplan_id,
        network_id: plan.network,
        network_name: plan.plan_network,
        plan_amount: planAmount,
        selling_price: planAmount,
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
          provider: SmeProvider.datastation,
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
          selling_price: plan.selling_price,
          reseller_price: plan.selling_price,
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

  async updateDataPlan(data: UpdataDataDto, isReseller: boolean = false) {
    if (data.selling_price <= 0 || data.reseller_price <= 0) {
      throw new BadRequestException(
        `${isReseller ? 'Reseller' : 'Selling'} price must be positive`,
      );
    }

    const updated = await this.prisma.unifiedPlan.update({
      where: { id: data.id },
      data: isReseller
        ? { reseller_price: new Decimal(data.selling_price) }
        : { selling_price: new Decimal(data.reseller_price) },
    });

    return {
      message: 'Plan updated successfully',
      data: updated,
    };
  }
}
