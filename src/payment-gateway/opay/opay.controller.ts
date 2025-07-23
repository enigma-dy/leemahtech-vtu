import { Body, Controller, Post } from '@nestjs/common';
import { OpayPaymentRequest, OpayStatusRequest } from './dto/opay.dto';
import { OpayService } from './opay.service';
import { Public } from 'src/decorators/auth.decorator';
import { WalletService } from 'src/wallet/wallet.service';

@Controller('payments/opay')
export class OpayController {
  constructor(private readonly opayService: OpayService) {}

  @Public()
  @Post('status')
  async checkPaymentStatus(@Body() statusRequest: OpayStatusRequest) {
    return this.opayService.checkPaymentStatus(statusRequest);
  }
}
