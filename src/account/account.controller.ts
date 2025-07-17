import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { AccountService } from './account.service';
import { Decimal } from 'generated/prisma/runtime/library';
import { AccountDto } from './dto/account.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('credit')
  async creditAccount(@Body() data: AccountDto, @Req() request: Request) {
    const { sub } = request['user'];

    const amount = data.amount;

    return await this.accountService.creditAccount(sub, new Decimal(amount));
  }

  @Post('debit')
  async debitAccount(@Body() data: AccountDto, @Req() request: Request) {
    const { sub } = request['user'];

    const amount = data.amount;

    return await this.accountService.debitAccount(sub, new Decimal(amount));
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
