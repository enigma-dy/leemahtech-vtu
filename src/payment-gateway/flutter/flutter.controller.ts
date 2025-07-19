import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { FlutterwaveService } from './flutter.service';

@Controller('flutter')
export class FlutterwaveController {
  constructor(private readonly flutterwaveService: FlutterwaveService) {}

  @Post('payment')
  async initiatePayment(@Body() body: any) {
    const { payment_type, ...payload } = body;

    if (!payment_type) {
      throw new BadRequestException('payment_type is required');
    }

    try {
      switch (payment_type) {
        case 'card':
          return await this.flutterwaveService.chargeCard(payload);
        case 'bank_transfer':
          return await this.flutterwaveService.initiateBankTransfer(payload);
        case 'ng_account':
          return await this.flutterwaveService.chargeNigeriaAccount(payload);
        case 'ussd':
          return await this.flutterwaveService.chargeUSSD(payload);
        case 'enaira':
          return await this.flutterwaveService.chargeENaira(payload);
        default:
          throw new BadRequestException(
            `Unsupported payment_type: ${payment_type}`,
          );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('verify')
  async verify(@Body() body: { transaction_id: string }) {
    if (!body.transaction_id) {
      throw new BadRequestException('transaction_id is required');
    }

    try {
      return await this.flutterwaveService.verifyTransaction(
        body.transaction_id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
