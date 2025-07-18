import { Module } from '@nestjs/common';

import { DataStationModule } from 'src/providers/datastation/datastation.module';
import { HusmodModule } from 'src/providers/husmod/husmod.module';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [DataStationModule, HusmodModule],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
