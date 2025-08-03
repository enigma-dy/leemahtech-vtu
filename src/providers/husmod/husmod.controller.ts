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
import { HusmodService } from './husmod.service';

import { Response, Request } from 'express';
import {
  AirTime2CastDto,
  AirtimePurchaseDto,
  CardPurchaseDto,
  ElectricityPaymentDto,
  ExamPinPurchaseDto,
} from './dto/husmod.dto';
import { DataStationDto } from '../datastation/dto/datastation.dto';

@Controller('husmod')
export class HusmodController {
  constructor(private readonly HusmodService: HusmodService) {}

  @Get('data-pricing')
  async getDataPricing() {
    try {
      const data = await this.HusmodService.getDataPricing();
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

  @Get('transaction')
  async getallDataTransaction() {
    try {
      const data = await this.HusmodService.getallDataTransaction();
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
