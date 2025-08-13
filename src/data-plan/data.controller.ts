import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DataDto, UpdataDataDto } from './dto/data.dto';
import { DataService } from './data.service';

@ApiTags('Data Plans')
@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('sync')
  @ApiOperation({ summary: 'Sync data plans from provider' })
  @ApiResponse({ status: 200, description: 'Data plans synced successfully' })
  async syncDataPrice() {
    return this.dataService.fetchAndStoreAllPlans();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all data plans' })
  @ApiResponse({ status: 200, description: 'List of all data plans' })
  async getAllDataPlans() {
    return this.dataService.getAllDataPlans();
  }

  @Post('update')
  @ApiOperation({ summary: 'Update selling price of a data plan' })
  @ApiBody({ type: UpdataDataDto })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  async updateDataPrice(@Body() data: UpdataDataDto) {
    const result = await this.dataService.updateDataPlan(data);
    return {
      message: 'Plan saved successfully',
      result,
    };
  }

  @Post('buy')
  @ApiOperation({ summary: 'Purchase a data plan' })
  @ApiBody({ type: DataDto })
  @ApiResponse({ status: 200, description: 'Data plan purchased successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or failed transaction',
  })
  async buyDataPlan(
    @Body() data: DataDto,
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
