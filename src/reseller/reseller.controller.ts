import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

import { ResellerDataService } from './reseller.service';
import { DataDto, UpdataResellerDataDto } from './dto/reseller.dto';

import { ResellerRoute } from 'src/decorators/reseller.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';

@ApiTags('Reseller Data Plans')
@ApiSecurity('x-api-key')
@Controller('reseller/data')
@ResellerRoute()
export class ResellerDataController {
  constructor(private readonly resellerDataService: ResellerDataService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get all data plans for resellers' })
  @ApiResponse({
    status: 200,
    description: 'List of all data plans for resellers',
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({
    status: 403,
    description: 'User is not an active or verified reseller',
  })
  async getAllDataPlans() {
    try {
      const plans = await this.resellerDataService.getAllDataPlans();
      return { status: 'success', data: plans };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Failed to fetch data plans',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('buy')
  @ApiOperation({ summary: 'Purchase a data plan for resellers' })
  @ApiBody({ type: DataDto })
  @ApiResponse({ status: 200, description: 'Data plan purchased successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or failed transaction',
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({
    status: 403,
    description: 'User is not an active or verified reseller',
  })
  async buyDataPlan(@CurrentUser() user: any, @Body() data: DataDto) {
    try {
      const response = await this.resellerDataService.buyData(user.sub, data);
      return { status: 'success', data: response };
    } catch (error) {
      const statusCode =
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          status: 'error',
          message:
            error?.response?.data?.message ||
            error.message ||
            'Failed to purchase data plan',
          error: { statusCode, details: error?.response?.data || null },
        },
        statusCode,
      );
    }
  }

  // @Put('update/:id')
  // @ApiOperation({ summary: 'Update a data plan for resellers' })
  // @ApiBody({ type: UpdataResellerDataDto })
  // @ApiResponse({ status: 200, description: 'Data plan updated successfully' })
  // @ApiResponse({ status: 400, description: 'Invalid request or failed update' })
  // @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  // @ApiResponse({
  //   status: 403,
  //   description: 'User is not an active or verified reseller',
  // })
  // async updateDataPlan(
  //   @CurrentUser() user: any,
  //   @Param('id') id: string,
  //   @Body() data: UpdataResellerDataDto,
  // ) {
  //   try {
  //     const response = await this.resellerDataService.updateDataPlan(data);
  //     return { status: 'success', data: response };
  //   } catch (error) {
  //     const statusCode =
  //       error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
  //     throw new HttpException(
  //       {
  //         status: 'error',
  //         message:
  //           error?.response?.data?.message ||
  //           error.message ||
  //           'Failed to update data plan',
  //         error: { statusCode, details: error?.response?.data || null },
  //       },
  //       statusCode,
  //     );
  //   }
  // }
}
