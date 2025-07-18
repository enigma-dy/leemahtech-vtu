import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { LeemahModule } from 'src/providers/leemah/leemah.module';
import { HusmodModule } from 'src/providers/husmod/husmod.module';
import { DataStationModule } from 'src/providers/datastation/datastation.module';
import { SmeProviderModule } from 'src/providers/provider.module';

@Module({
  imports: [LeemahModule, HusmodModule, DataStationModule, SmeProviderModule],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
