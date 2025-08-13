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
import { DataStationService } from './datastation/datastation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BillPaymentDto,
  BuyAirtimeDto,
  CableSubscriptionDto,
  ExamPinDto,
  RechargePinDto,
  SetSmeProviderDto,
  SmeProvider,
} from './dto/provider.dto';
import { ProviderService } from './provider.service';
import { Admin } from 'src/decorators/roles.decorator';

@ApiTags('Provider')
@Controller('provider')
export class ProviderController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly husmodata: HusmodService,
    private readonly datastation: DataStationService,
    private readonly providerService: ProviderService,
  ) {}

  private async getActiveProvider(): Promise<SmeProvider> {
    const setting = await this.prisma.providerSetting.findUnique({
      where: { id: 1 },
    });

    if (!setting) throw new NotFoundException('Provider setting not found');

    return setting.activeProvider as SmeProvider;
  }

  private getProviderService(provider: SmeProvider) {
    switch (provider) {
      case SmeProvider.husmodata:
        return this.husmodata;
      case SmeProvider.datastation:
        return this.datastation;
      default:
        throw new NotFoundException('Unknown provider');
    }
  }

  @Get('get')
  @Admin()
  @ApiOperation({ summary: 'Get the current active provider' })
  @ApiResponse({
    status: 200,
    description: 'Active provider returned successfully',
  })
  async getProvider() {
    return { provider: await this.getActiveProvider() };
  }

  @Post('set')
  @Admin()
  @ApiOperation({ summary: 'Set the current active provider' })
  @ApiResponse({
    status: 200,
    description: 'Active provider updated successfully',
  })
  async setProvider(@Body() dto: SetSmeProviderDto) {
    await this.providerService.setActiveProvider(dto);
    return {
      message: 'Active provider updated successfully',
      provider: dto.provider,
    };
  }

  @Post('airtime')
  @ApiOperation({ summary: 'Buy Airtime' })
  @ApiResponse({ status: 201, description: 'Airtime purchase successful' })
  async sendAirtime(@Body() body: BuyAirtimeDto) {
    const service = this.getProviderService(await this.getActiveProvider());
    return service.buyAirtime({
      network: body.network_id,
      amount: body.amount,
      mobile_number: body.phone,
      Ported_number: false,
      airtime_type: 'VTU',
    });
  }

  @Post('bill')
  @ApiOperation({ summary: 'Pay electricity bill' })
  @ApiResponse({ status: 201, description: 'Bill payment successful' })
  async sendBillPayment(@Body() body: BillPaymentDto) {
    const service = this.getProviderService(await this.getActiveProvider());
    return service.electricityBillPayment(body);
  }

  @Post('cable')
  @ApiOperation({ summary: 'Query cable subscription' })
  @ApiResponse({
    status: 201,
    description: 'Cable subscription query successful',
  })
  async subscribeCable(@Body() body: CableSubscriptionDto) {
    const service = this.getProviderService(await this.getActiveProvider());
    return service.queryCableSub(body.cablename.toString());
  }

  @Post('recharge-pin')
  @ApiOperation({ summary: 'Generate recharge pin' })
  @ApiResponse({
    status: 201,
    description: 'Recharge pin generated successfully',
  })
  async getRechargePin(@Body() body: RechargePinDto) {
    const service = this.getProviderService(await this.getActiveProvider());
    return service.generateRechargePin(body);
  }

  @Post('exam-pin')
  @ApiOperation({ summary: 'Buy exam result checker pin' })
  @ApiResponse({ status: 201, description: 'Exam pin purchase successful' })
  async getExamPin(@Body() body: ExamPinDto) {
    const service = this.getProviderService(await this.getActiveProvider());
    return service.buyResultCheckerPin(body);
  }

  @Get('data/:id')
  @ApiOperation({ summary: 'Query data plan transaction' })
  @ApiResponse({
    status: 200,
    description: 'Data plan transaction details returned',
  })
  async queryDataPlan(@Param('id', ParseIntPipe) id: number) {
    const service = this.getProviderService(await this.getActiveProvider());
    return service.queryDataTransaction(id.toString());
  }
}
