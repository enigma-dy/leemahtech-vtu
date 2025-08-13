import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

import { WalletService } from './wallet.service';
import { FlutterwaveService } from 'src/payment-gateway/flutter/flutter.service';
import { OpayService } from 'src/payment-gateway/opay/opay.service';
import { OpayPaymentRequest } from 'src/payment-gateway/opay/dto/opay.dto';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TransactionFilterDto, WalletDto } from './dto/wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

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
    return await this.walletService.getBalance(sub);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get current user transactions' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'type', required: false })
  async getUserTransactions(
    @Req() request: Request,
    @Query() filters: TransactionFilterDto,
  ) {
    const { sub } = request['user'];
    return await this.walletService.getUserTransactions(sub, filters);
  }

  @Get('transactions/all')
  @ApiOperation({ summary: 'Get all user transactions (admin only)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'userId', required: false })
  async getAllTransactions(
    @Req() request: Request,
    @Query() filters: TransactionFilterDto,
  ) {
    const { sub } = request['user'];
    return await this.walletService.getAllTransactions(sub, filters);
  }

  @Get('inflow-outflow')
  @ApiOperation({
    summary: 'Get platform inflow/outflow analytics (admin only)',
  })
  @ApiQuery({ name: 'timeframe', enum: ['minute', 'hour', 'day', 'month'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getInflowOutflow(
    @Req() request: Request,
    @Query('timeframe') timeframe: 'minute' | 'hour' | 'day' | 'month',
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    const { sub } = request['user'];
    return await this.walletService.getInflowOutflow(
      sub,
      timeframe,
      startDate,
      endDate,
    );
  }
}
