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
import { ApiOperation } from '@nestjs/swagger';

@Controller('husmod')
export class HusmodController {
  constructor(private readonly HusmodService: HusmodService) {}

  @ApiOperation({ summary: 'Get data price (Husmod)' })
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

  @ApiOperation({ summary: 'All transaction in Husmod' })
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
