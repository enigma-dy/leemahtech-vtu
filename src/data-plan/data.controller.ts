import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { DataService } from './data.service';
import { CreateOrUpdateDataPriceDto } from './dto/data.dto';
import { Response, Request } from 'express';
import { DataStationDto } from 'src/providers/datastation/dto/datastation.dto';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('init')
  async initializeDataPrice() {
    return this.dataService.initailDataPrice();
  }

  @Get('sync')
  async syncDataPrice() {
    return this.dataService.fetchAndStoreAllPlans();
  }

  @Get('all')
  async getAllDataPlans() {
    return this.dataService.getAllDataPlans();
  }

  @Post('update')
  async updateDataPrice(data: CreateOrUpdateDataPriceDto) {
    const result = await this.dataService.createOrUpdateDataPlan(data);
    return {
      message: 'Plan saved successfully',
      result,
    };
  }

  @Post('buy')
  async buyDataPlan(
    @Body() data: DataStationDto,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    try {
      const { sub } = request['user'];
      const response = await this.dataService.buyData(sub, data);

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
