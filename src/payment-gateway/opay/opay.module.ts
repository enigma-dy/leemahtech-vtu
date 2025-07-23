import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { OpayService } from './opay.service';
import { OpayController } from './opay.controller';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [HttpModule, forwardRef(() => WalletModule)],
  providers: [OpayService],
  controllers: [OpayController],
  exports: [OpayService],
})
export class OpayModule {}
