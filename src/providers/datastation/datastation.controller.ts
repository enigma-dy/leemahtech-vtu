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
  DataStationDto,
  ElectricityPaymentDto,
  ExamPinPurchaseDto,
} from './dto/datastation.dto';
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

  @Post('buy')
  async buyDataPlan(
    @Body() data: DataStationDto,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    try {
      const { sub, email } = request['user'];
      const response = await this.DataStationService.buyData(sub, data);

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

  @Get('transaction')
  async getallDataTransaction() {
    try {
      const data = await this.DataStationService.getallDataTransaction();
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

  @Get('transaction/:id')
  async queryDataTransaction(@Param('id') id: string) {
    try {
      const data = await this.DataStationService.queryDataTransaction(id);
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

  @Get('bill/:id')
  async queryBillPayment(@Param('id') id: string) {
    try {
      const data = await this.DataStationService.queryBillPayment(id);
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

  @Get('cable/:id')
  async queryCableSub(@Param('id') id: string) {
    try {
      const data = await this.DataStationService.queryCableSub(id);
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

  @Get(':iuc/:id')
  async validateIUC(@Param('id') id: string, @Query('iuc') iuc: string) {
    try {
      const data = await this.DataStationService.validateIUC(id, iuc);
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
  @Get('meter/:id')
  async validateMeter(@Param('id') id: string) {
    try {
      const data = await this.DataStationService.validateMeter(id);
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

  @Post('artime2cash')
  async airtimeToCash(@Body() data: AirTime2CastDto) {
    try {
      const response = await this.DataStationService.airtimeToCash(data);
      return {
        status: 'success',
        response,
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

  @Post('electric')
  async electricityBillPayment(@Body() data: ElectricityPaymentDto) {
    try {
      const response =
        await this.DataStationService.electricityBillPayment(data);
      return {
        status: 'success',
        response,
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

  @Post('result')
  async buyResultCheckerPin(@Body() data: ExamPinPurchaseDto) {
    try {
      const response = await this.DataStationService.buyResultCheckerPin(data);
      return {
        status: 'success',
        response,
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

  @Post('recharge')
  async generateRechargePin(@Body() data: AirtimePurchaseDto) {
    try {
      const response = await this.DataStationService.buyAirtime(data);
      return {
        status: 'success',
        response,
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
