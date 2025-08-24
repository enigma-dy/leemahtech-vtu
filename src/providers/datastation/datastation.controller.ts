import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { DataStationService } from './datastation.service';
import {
  AirTime2CastDto,
  AirtimePurchaseDto,
  CardPurchaseDto,
  ElectricityPaymentDto,
  ExamPinPurchaseDto,
} from './dto/datastation.dto';
import { Response, Request } from 'express';
import { ApiOperation } from '@nestjs/swagger';

@Controller('datastation')
export class DataStationController {
  constructor(private readonly DataStationService: DataStationService) {}

  @ApiOperation({ summary: 'Get current price of data (Leemah Tech)' })
  @Get('data-pricing')
  async getDataPricing() {
    try {
      const data = await this.DataStationService.getDataPricing();
      return {
        status: 'success',
        data,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message:
            error?.response?.data?.message || 'Failed to fetch data pricing',
        },
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'All transaction in Datastation' })
  @Get('transaction')
  async getallDataTransaction() {
    try {
      const data = await this.DataStationService.getMyDataStationDetails();
      return {
        status: 'success',
        data,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message:
            error?.response?.data?.message || 'Failed to fetch data pricing',
        },
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
