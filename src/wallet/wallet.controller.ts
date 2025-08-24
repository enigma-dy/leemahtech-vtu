import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
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
    summary: 'Get platform deposits and usage analytics (admin only)',
  })
  @ApiQuery({ name: 'timeframe', enum: ['minute', 'hour', 'day', 'month'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async accountingFlow(
    @Req() request: Request,
    @Query('timeframe') timeframe: 'minute' | 'hour' | 'day' | 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { sub } = request['user'];
    let startDateObj: Date | undefined;
    let endDateObj: Date | undefined;

    if (startDate) {
      try {
        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          throw new BadRequestException('Invalid startDate format');
        }
        startDateObj = new Date(parsedStartDate.getTime() - 3600000); // WAT to UTC
      } catch (error) {
        throw new BadRequestException('Invalid startDate format');
      }
    }

    if (endDate) {
      try {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          throw new BadRequestException('Invalid endDate format');
        }
        endDateObj = new Date(parsedEndDate.getTime() - 3600000); // WAT to UTC
      } catch (error) {
        throw new BadRequestException('Invalid endDate format');
      }
    }

    return await this.walletService.getDepositsAndUsage(
      sub,
      timeframe,
      startDateObj,
      endDateObj,
    );
  }

  @Get('Audit')
  @ApiOperation({
    summary: 'Get platform Audit (admin only)',
  })
  async audit(@Req() request: Request) {
    const { sub } = request['user'];
    return await this.walletService.auditBalances(sub);
  }
}
