import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { SetSmeProviderDto } from './dto/provider.dto';
import { ProviderService } from './provider.service';

@Controller('sme-provider')
export class SmeProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get('get')
  async getProvider() {
    return await this.providerService.getActiveProvider();
  }

  @Post('set-provider')
  async setProvider(@Body() dto: SetSmeProviderDto) {
    await this.providerService.setActiveProvider(dto);
    return { message: `Active provider set to ${dto.provider}` };
  }

  // Send airtime
  @Post('airtime')
  async sendAirtime(
    @Body() body: { network_id: number; amount: number; phone: string },
  ) {
    return await this.providerService.sendAirtime(
      body.network_id,
      body.amount,
      body.phone,
    );
  }

  // Bill payment
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
    return await this.providerService.sendBillPayment(
      body.disco_name,
      body.amount,
      body.meter_number,
      body.MeterType,
    );
  }

  // Cable subscription
  @Post('cable')
  async subscribeCable(
    @Body()
    body: {
      cablename: number;
      cableplan: number;
      smart_card_number: string;
    },
  ) {
    return await this.providerService.subscribeCable(
      body.cablename,
      body.cableplan,
      body.smart_card_number,
    );
  }

  // Buy recharge pin
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
    return await this.providerService.getRechargePin(
      body.network,
      body.network_amount,
      body.quantity,
      body.name_on_card,
    );
  }

  // Buy exam pin
  @Post('exam-pin')
  async getExamPin(
    @Body()
    body: {
      exam_name: string;
      quantity: number;
    },
  ) {
    return await this.providerService.getExamPin(body.exam_name, body.quantity);
  }

  // Query data plan by ID
  @Get('data/:id')
  async queryDataPlan(@Param('id', ParseIntPipe) id: number) {
    return await this.providerService.queryDataPlan(id);
  }
}
