import {
  BadRequestException,
  Body,
  HttpStatus,
  Injectable,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateUnifiedPlanDto,
  DataDto,
  UpdataResellerDataDto,
} from './dto/reseller.dto';
import { DataService } from 'src/data-plan/data.service';

@Injectable()
export class ResellerDataService {
  constructor(
    private readonly dataService: DataService,
    private readonly prisma: PrismaService,
  ) {}

  async getAllDataPlans() {
    return this.dataService.getAllDataPlans(true);
  }

  async buyData(userId: string, data: DataDto) {
    return this.dataService.buyData(userId, data, true);
  }
}
