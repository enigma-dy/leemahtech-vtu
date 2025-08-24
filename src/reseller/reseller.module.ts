import { Module } from '@nestjs/common';
import { DataStationModule } from 'src/providers/datastation/datastation.module';
import { HusmodModule } from 'src/providers/husmod/husmod.module';
import { LeemahModule } from 'src/providers/leemah/leemah.module';
import { SmeProviderModule } from 'src/providers/provider.module';
import { ResellerDataController } from './reseller.controller';
import { ResellerDataService } from './reseller.service';
import { DataModule } from 'src/data-plan/data.module';

@Module({
  imports: [
    LeemahModule,
    HusmodModule,
    DataStationModule,
    SmeProviderModule,
    DataModule,
  ],
  controllers: [ResellerDataController],
  providers: [ResellerDataService],
  exports: [ResellerDataService],
})
export class ResellerModule {}
