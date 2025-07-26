import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { OpayService } from './opay.service';
import { OpayController } from './opay.controller';
import { WalletModule } from 'src/wallet/wallet.module';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [HttpModule, UserModule, forwardRef(() => WalletModule)],
  providers: [OpayService],
  controllers: [OpayController],
  exports: [OpayService],
})
export class OpayModule {}
