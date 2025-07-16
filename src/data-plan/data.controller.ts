import { Controller, Get, Post } from '@nestjs/common';
import { DataService } from './data.service';
import { CreateOrUpdateDataPriceDto } from './dto/data.dto';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('init')
  async initializeDataPrice() {
    return this.dataService.initailDataPrice();
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
}
