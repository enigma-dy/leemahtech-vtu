import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { DataStationService } from './datastation.service';
import { DataStationDto } from './dto/datastation.dto';
import { Response, Request } from 'express';

@Controller('datastation')
export class DataStationController {
  constructor(private readonly DataStationService: DataStationService) {}

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

  @Get('me')
  async getMyDataStationDetails() {
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

  @Post('buy')
  async buyDataPlan(
    @Body() data: DataStationDto,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    try {
      const response = await this.DataStationService.buyData(data);

      return res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      console.error('Buy Data Plan Error:', error);

      const statusCode =
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        status: 'error',
        message:
          error?.response?.data?.message ||
          error.message ||
          'Failed to fetch data pricing',
        error: {
          statusCode,
          details: error?.response?.data || null,
        },
      });
    }
  }
}
