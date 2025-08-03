import { Module } from '@nestjs/common';
import { DataStationController } from './datastation.controller';
import { DataStationService } from './datastation.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DataStationController],
  providers: [DataStationService],
  exports: [DataStationService],
})
export class DataStationModule {}
