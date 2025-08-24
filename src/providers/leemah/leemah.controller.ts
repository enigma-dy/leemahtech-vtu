import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { LeemahService } from './leemah.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('leemah')
export class LeemahController {
  constructor(private readonly leemahService: LeemahService) {}

  @ApiOperation({ summary: 'Get current price of data (Leemah Tech)' })
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
