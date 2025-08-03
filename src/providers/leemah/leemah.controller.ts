import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { LeemahService } from './leemah.service';

@Controller('leemah')
export class LeemahController {
  constructor(private readonly leemahService: LeemahService) {}

  @Get('data-pricing')
  async getDataPricing() {
    try {
      const data = await this.leemahService.getDataPricing();
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
