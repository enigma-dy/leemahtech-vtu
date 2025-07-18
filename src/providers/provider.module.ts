import { Module } from '@nestjs/common';
import { ProviderSettingService } from './provider.service';
import { SmeProviderController } from './provider.controller';

@Module({
  controllers: [SmeProviderController],
  providers: [ProviderSettingService],
  exports: [ProviderSettingService],
})
export class SmeProviderModule {}
