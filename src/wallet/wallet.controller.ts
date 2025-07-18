import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

import { Decimal } from 'generated/prisma/runtime/library';
import { WalletDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';

@Controller('account')
export class WalletController {
  constructor(private readonly accountService: WalletService) {}

  @Post('credit')
  async creditAccount(@Body() data: WalletDto, @Req() request: Request) {
    const { sub } = request['user'];

    const amount = data.amount;

    return await this.accountService.creditWallet(sub, new Decimal(amount));
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
