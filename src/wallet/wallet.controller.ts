import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { v4 as uuidv4 } from 'uuid';

import { Decimal } from 'generated/prisma/runtime/library';
import { WalletDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
import { FlutterwaveService } from 'src/payment-gateway/flutter/flutter.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly accountService: WalletService,
    private readonly flutterwaveService: FlutterwaveService,
  ) {}

  @Post('credit')
  async creditAccount(@Body() data: WalletDto, @Req() request: Request) {
    const { sub } = request['user'];

    const tx_ref = `tx-${uuidv4()}`;
    const redirect_url = 'https://your-frontend-app.com/payment-complete';

    const paymentPayload = {
      ...data,
      tx_ref,
      redirect_url,
      customer: {
        email: 'user@example.com',
      },
    };

    const amount = data.amount;

    return await this.flutterwaveService.initiatePayment(paymentPayload, sub);
  }

  @Post('debit')
  async debitAccount(@Body() data: WalletDto, @Req() request: Request) {
    const { sub } = request['user'];

    const amount = data.amount;

    return await this.accountService.debitWallet(sub, new Decimal(amount));
  }
  @Get('balance')
  async getBalance(@Req() request: Request) {
    const { sub } = request['user'];
    return await this.accountService.getBalance(sub);
  }

  @Get('provider-balance')
  async getPoviderBalance() {
    return this.accountService.getProviderBalance();
  }
}
