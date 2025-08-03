import { Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { SmeProviderController } from './provider.controller';
import { HttpModule } from '@nestjs/axios';
import { HusmodModule } from './husmod/husmod.module';
import { DataStationModule } from './datastation/datastation.module';

@Module({
  imports: [HttpModule, HusmodModule, DataStationModule],
  controllers: [SmeProviderController],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class SmeProviderModule {}
