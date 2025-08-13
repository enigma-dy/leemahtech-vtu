import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

import { WalletService } from './wallet.service';
import { FlutterwaveService } from 'src/payment-gateway/flutter/flutter.service';
import { OpayService } from 'src/payment-gateway/opay/opay.service';
import { OpayPaymentRequest } from 'src/payment-gateway/opay/dto/opay.dto';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletDto } from './dto/wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly accountService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get the current user’s wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved wallet balance.',
    type: WalletDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getBalance(@Req() request: Request) {
    const { sub } = request['user'];
    return await this.accountService.getBalance(sub);
  }
}
