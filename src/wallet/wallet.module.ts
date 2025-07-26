import { forwardRef, Module } from '@nestjs/common';

import { DataStationModule } from 'src/providers/datastation/datastation.module';
import { HusmodModule } from 'src/providers/husmod/husmod.module';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { FlutterwaveModule } from 'src/payment-gateway/flutter/flutter.module';
import { OpayModule } from 'src/payment-gateway/opay/opay.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
