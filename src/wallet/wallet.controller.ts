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
    private readonly prisma: PrismaService,
  ) {}

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
