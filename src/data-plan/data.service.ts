import {
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
import { Decimal } from 'generated/prisma/runtime/library';
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
    const plan = await this.prisma.unifiedPlan.findFirst({
      where: { id: data.id },
    });

    const recipient = data.mobileNumber;
    if (!plan) {
      return { success: false, message: 'Data plan not found' };
    }

    let purchaseResult;
    if (plan.provider === 'husmodata') {
      purchaseResult = await this.husmodService.buyData(
        userId,
        {
          network: plan.network_id.toString(),
          mobile_number: recipient,
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
          mobile_number: recipient,
          plan: plan.data_plan_id,
          planSize: plan.plan_size,
          planVolume: plan.plan_size,
          planName: plan.plan_type,
          Ported_number: true,
        },
        plan.selling_price,
      );
    }

    if (purchaseResult?.success) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException();
      }
      this.eventEmitter.emit(
        'data.purchase',
        new DataPurchaseEvent(
          user.email!,
          user.fullName!,
          plan.network_name,
          plan.plan_type,
          plan.plan_size,
          recipient,
          plan.selling_price,
          purchaseResult.txRef || purchaseResult.transactionId,
        ),
      );
    }

    return purchaseResult;
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
