import { Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { SmeProviderController } from './provider.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [SmeProviderController],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class SmeProviderModule {}
