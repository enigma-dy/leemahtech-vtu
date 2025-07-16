import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { LeemahService } from 'src/providers/leemah/leemah.service';
import { Prisma } from '@prisma/client';
import { Decimal } from 'generated/prisma/runtime/library';
import { CreateOrUpdateDataPriceDto } from './dto/data.dto';

@Injectable()
export class DataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leemahService: LeemahService,
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
}
