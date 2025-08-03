import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { HusmodService } from './husmod/husmod.service';
import { SmeProvider } from 'generated/prisma';
import { DataStationService } from './datastation/datastation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('sme-provider')
export class SmeProviderController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly husmodata: HusmodService,
    private readonly datastation: DataStationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getActiveProvider(): Promise<SmeProvider> {
    const setting = await this.prisma.providerSetting.findUnique({
      where: { id: 1 },
    });

    if (!setting) throw new NotFoundException('Provider setting not found');

    return setting.activeProvider;
  }

  @Get('get')
  async getProvider() {
    return { provider: await this.getActiveProvider() };
  }

  @Post('airtime')
  async sendAirtime(
    @Body() body: { network_id: number; amount: number; phone: string },
  ) {
    const provider = await this.getActiveProvider();

    switch (provider) {
      case SmeProvider.husmodata:
        return this.husmodata.buyAirtime({
          network: body.network_id,
          amount: body.amount,
          mobile_number: body.phone,
          Ported_number: false,
          airtime_type: 'VTU',
        });
      case SmeProvider.datastation:
        return this.datastation.buyAirtime({
          network: body.network_id,
          amount: body.amount,
          mobile_number: body.phone,
          Ported_number: false,
          airtime_type: 'VTU',
        });
      default:
        throw new NotFoundException('Unknown provider');
    }
  }

  @Post('bill')
  async sendBillPayment(
    @Body()
    body: {
      disco_name: string;
      amount: number;
      meter_number: string;
      MeterType: number;
    },
  ) {
    const provider = await this.getActiveProvider();

    switch (provider) {
      case SmeProvider.husmodata:
        return this.husmodata.electricityBillPayment(body);
      case SmeProvider.datastation:
        return this.datastation.electricityBillPayment(body);
      default:
        throw new NotFoundException('Unknown provider');
    }
  }

  @Post('cable')
  async subscribeCable(
    @Body()
    body: {
      cablename: number;
      cableplan: number;
      smart_card_number: string;
    },
  ) {
    const provider = await this.getActiveProvider();

    switch (provider) {
      case SmeProvider.husmodata:
        return this.husmodata.queryCableSub(body.cablename.toString());
      case SmeProvider.datastation:
        return this.datastation.queryCableSub(body.cablename.toString());
      default:
        throw new NotFoundException('Unknown provider');
    }
  }

  @Post('recharge-pin')
  async getRechargePin(
    @Body()
    body: {
      network: number;
      network_amount: number;
      quantity: number;
      name_on_card: string;
    },
  ) {
    const provider = await this.getActiveProvider();

    switch (provider) {
      case SmeProvider.husmodata:
        return this.husmodata.generateRechargePin(body);
      case SmeProvider.datastation:
        return this.datastation.generateRechargePin(body);
      default:
        throw new NotFoundException('Unknown provider');
    }
  }

  @Post('exam-pin')
  async getExamPin(
    @Body()
    body: {
      exam_name: string;
      quantity: number;
    },
  ) {
    const provider = await this.getActiveProvider();

    switch (provider) {
      case SmeProvider.husmodata:
        return this.husmodata.buyResultCheckerPin(body);
      case SmeProvider.datastation:
        return this.datastation.buyResultCheckerPin(body);
      default:
        throw new NotFoundException('Unknown provider');
    }
  }

  @Get('data/:id')
  async queryDataPlan(@Param('id', ParseIntPipe) id: number) {
    const provider = await this.getActiveProvider();

    switch (provider) {
      case SmeProvider.husmodata:
        return this.husmodata.queryDataTransaction(id.toString());
      case SmeProvider.datastation:
        return this.datastation.queryDataTransaction(id.toString());
      default:
        throw new NotFoundException('Unknown provider');
    }
  }
}
