import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { LeemahModule } from 'src/providers/leemah/leemah.module';

@Module({
  imports: [LeemahModule],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
