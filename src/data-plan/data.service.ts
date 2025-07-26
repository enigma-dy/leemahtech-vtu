import { Body, HttpStatus, Injectable, Req, Res } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { LeemahService } from 'src/providers/leemah/leemah.service';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';
import { Decimal } from 'generated/prisma/runtime/library';
import {
  CreateOrUpdateDataPriceDto,
  CreateUnifiedPlanDto,
} from './dto/data.dto';
import { HusmodService } from 'src/providers/husmod/husmod.service';
import { DataStationService } from 'src/providers/datastation/datastation.service';
import { DataStationDto } from 'src/providers/datastation/dto/datastation.dto';
import { ProviderSettingService } from 'src/providers/provider.service';
import { SmeProvider } from 'src/providers/dto/provider.dto';
import * as fs from 'fs';

// A simple helper function to append logs to a file
const logToFile = (message: string) => {
  // We add a timestamp to each log entry for better context
  const logEntry = `${new Date().toISOString()} - ${message}\n`;
  try {
    // 'appendFileSync' will create the file if it doesn't exist, and append to it if it does
    fs.appendFileSync('debug.log', logEntry);
  } catch (err) {
    // If logging fails, we fall back to the console to ensure the error is seen
    console.error('Failed to write to log file:', err);
  }
};

@Injectable()
export class DataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leemahService: LeemahService,
    private readonly husmodService: HusmodService,
    private readonly dataStationService: DataStationService,
    private readonly activeProvider: ProviderSettingService,
  ) {}

  async initailDataPrice() {
    const response = await this.leemahService.getDataPricing();

    const extractPlansWithNetwork = (networkKey: string) => {
      const plans = response[networkKey]?.data_plans ?? [];
      return plans.map((plan) => ({
        ...plan,
        network_name: networkKey,
      }));
    };

    const allPlansRaw = [
      ...extractPlansWithNetwork('MTN'),
      ...extractPlansWithNetwork('GLO'),
      ...extractPlansWithNetwork('AIRTEL'),
      ...extractPlansWithNetwork('9MOBILE'),
    ];

    const formattedPlans = allPlansRaw.map((plan) => ({
      network_id: String(plan.network_id),
      network_name: plan.network_name,
      plan_size: String(plan.plan_size),
      plan_volume: plan.plan_Volume || '',
      plan_name_id: plan.plan_name_id || '',
      plan_name_id2: plan.plan_name_id_2 || '',
      Affilliate_price: new Decimal(plan.Affilliate_price),
      TopUser_price: new Decimal(plan.TopUser_price),
      api_price: new Decimal(plan.api_price),
      plan_type: plan.plan_type || '',
      validity: plan.month_validate || '',
      commission: new Decimal(plan.commission),
    }));

    await this.prisma.dataPrice.createMany({
      data: formattedPlans,
      skipDuplicates: true,
    });

    return { success: true, inserted: formattedPlans.length };
  }

  async getAllDataPlans() {
    return this.prisma.dataPrice.findMany({
      select: {
        id: true,
        plan_size: true,
        plan_volume: true,
        api_price: true,
        network_name: true,
        network_id: true,
      },
    });
  }

  async fetchAndStoreAllPlans(): Promise<{ message: string; count: number }> {
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
    };
  }

  async createOrUpdateDataPlan(data: CreateOrUpdateDataPriceDto) {
    return this.prisma.dataPrice.upsert({
      where: {
        network_id_plan_name_id: {
          network_id: data.network_id,
          plan_name_id: data.plan_name_id,
        },
      },
      create: {
        network_id: data.network_id,
        network_name: data.network_name,
        plan_size: data.plan_size,
        plan_volume: data.plan_volume ?? '',
        plan_name_id: data.plan_name_id,
        plan_name_id2: data.plan_name_id2 ?? '',
        Affilliate_price: new Decimal(data.Affilliate_price),
        TopUser_price: new Decimal(data.TopUser_price),
        api_price: new Decimal(data.api_price),
        plan_type: data.plan_type ?? '',
        validity: data.validity ?? '',
        commission: new Decimal(data.commission),
      },
      update: {
        network_name: data.network_name,
        plan_size: data.plan_size,
        plan_volume: data.plan_volume ?? '',
        plan_name_id2: data.plan_name_id2 ?? '',
        Affilliate_price: new Decimal(data.Affilliate_price),
        TopUser_price: new Decimal(data.TopUser_price),
        api_price: new Decimal(data.api_price),
        plan_type: data.plan_type ?? '',
        validity: data.validity ?? '',
        commission: new Decimal(data.commission),
      },
    });
  }

  async buyData(userId: string, data: DataStationDto): Promise<any> {
    const active = await this.activeProvider.getActiveProvider();
    // const data = await this.prisma.
    switch (active) {
      case SmeProvider.DATASTATION:
        return this.dataStationService.buyData(userId, data);

      case SmeProvider.HUSMODATA:
        return this.husmodService.buyData(userId, data);

      default:
        throw new Error(`Unsupported provider: ${active}`);
    }
  }
}
