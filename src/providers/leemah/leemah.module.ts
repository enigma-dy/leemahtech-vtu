import { Module } from '@nestjs/common';
import { LeemahController } from './leemah.controller';
import { LeemahService } from './leemah.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [LeemahController],
  providers: [LeemahService],
  exports: [LeemahService],
})
export class LeemahModule {}
