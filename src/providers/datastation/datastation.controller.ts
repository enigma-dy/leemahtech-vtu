import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { DataStationService } from './datastation.service';

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
}
