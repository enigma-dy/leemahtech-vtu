import { forwardRef, Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { HusmodController } from './husmod.controller';
import { HusmodService } from './husmod.service';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [HttpModule, WalletModule],
  controllers: [HusmodController],
  providers: [HusmodService],
  exports: [HusmodService],
})
export class HusmodModule {}
