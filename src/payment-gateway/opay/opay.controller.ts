import { Body, Controller, Post } from '@nestjs/common';
import { OpayPaymentRequest, OpayStatusRequest } from './dto/opay.dto';
import { OpayService } from './opay.service';
import { Public } from 'src/decorators/auth.decorator';

@Controller('payments/opay')
export class OpayController {
  constructor(private readonly opayService: OpayService) {}

  @Post('create')
  async createPayment(@Body() paymentRequest: OpayPaymentRequest) {
    return this.opayService.createPayment(paymentRequest);
  }

  @Public()
  @Post('status')
  async checkPaymentStatus(@Body() statusRequest: OpayStatusRequest) {
    return this.opayService.checkPaymentStatus(statusRequest);
  }
}
