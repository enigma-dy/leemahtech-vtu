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
  DataStationDto,
  ElectricityPaymentDto,
  ExamPinPurchaseDto,
} from './dto/datastation.dto';

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

  @Post('buy')
  async buyDataPlan(
    @Body() data: DataStationDto,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    try {
      const { sub, email } = request['user'];
      const response = await this.HusmodService.buyData(sub, data);

      return res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      const statusCode =
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      return res.status(statusCode).json({
        status: 'error',
        error,
        message:
          error?.response?.data?.message ||
          error.message ||
          'Failed to fetch data pricing',
        // error: {
        //   statusCode,
        //   details: error?.response?.data || null,
        // },
      });
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

  @Get('transaction/:id')
  async queryDataTransaction(@Param('id') id: string) {
    try {
      const data = await this.HusmodService.queryDataTransaction(id);
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
      const data = await this.HusmodService.queryBillPayment(id);
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
      const data = await this.HusmodService.queryCableSub(id);
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
      const data = await this.HusmodService.validateIUC(id, iuc);
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
      const data = await this.HusmodService.validateMeter(id);
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
      const response = await this.HusmodService.airtimeToCash(data);
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
      const response = await this.HusmodService.electricityBillPayment(data);
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
      const response = await this.HusmodService.buyResultCheckerPin(data);
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
      const response = await this.HusmodService.buyAirtime(data);
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
