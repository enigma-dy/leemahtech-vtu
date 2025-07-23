import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { v4 as uuidv4 } from 'uuid';

import { Decimal } from 'generated/prisma/runtime/library';
import { WalletDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
import { FlutterwaveService } from 'src/payment-gateway/flutter/flutter.service';
import { OpayService } from 'src/payment-gateway/opay/opay.service';
import { OpayPaymentRequest } from 'src/payment-gateway/opay/dto/opay.dto';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly accountService: WalletService,
    private readonly userService: UserService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly opayService: OpayService,
    private readonly configService: ConfigService,
  ) {}

  @Post('credit')
  async creditAccount(@Body() data: WalletDto, @Req() request: Request) {
    const { sub } = request['user'];
    const user = await this.userService.getUserById(sub);
    if (!user) {
      throw new Error();
    }
    const tx_ref = `tx-${uuidv4()}`;
    const redirect_url = process.env.REDIRECT_URL;

    const callbackUrl =
      this.configService.getOrThrow<string>('opay.callbackUrl');
    const returnUrl = this.configService.getOrThrow<string>('opay.returnUrl');
    const cancelUrl = this.configService.getOrThrow<string>('opay.cancelUrl');
    const displayName =
      this.configService.getOrThrow<string>('opay.displayName');
    const opayPayload: OpayPaymentRequest = {
      reference: tx_ref,
      country: 'NG',
      amount: {
        currency: 'NGN',
        total: Number(data.amount) * 100,
      },
      callbackUrl,
      returnUrl,
      cancelUrl,
      displayName,
      expireAt: 30,
      userInfo: {
        userId: sub,
        userName: user.fullName ?? undefined,
        userMobile: user.phone ?? undefined,
        userEmail: user.email ?? undefined,
      },
      product: {
        name: 'Wallet Top-Up',
        description: `Wallet top-up for ${user.fullName}`,
        reference: tx_ref,
      },
      customerVisitSource: 'web',
    };

    const amount = data.amount;

    return await this.opayService.createPayment(opayPayload);
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
