import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { HusmodController } from './husmod.controller';
import { HusmodService } from './husmod.service';

@Module({
  imports: [HttpModule],
  controllers: [HusmodController],
  providers: [HusmodService],
  exports: [HusmodService],
})
export class HusmodModule {}
