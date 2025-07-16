import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HusmodService } from './husmod.service';

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
}
