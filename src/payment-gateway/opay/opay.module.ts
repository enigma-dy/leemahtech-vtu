import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OpayService } from './opay.service';
import { OpayController } from './opay.controller';

@Module({
  imports: [HttpModule],
  providers: [OpayService],
  controllers: [OpayController],
  exports: [OpayService],
})
export class OpayModule {}
