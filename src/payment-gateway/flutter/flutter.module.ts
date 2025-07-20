import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FlutterwaveService } from './flutter.service';
import { ConfigModule } from '@nestjs/config';
import { FlutterwaveController } from './flutter.controller';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => WalletModule),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [FlutterwaveController],
  providers: [FlutterwaveService],
  exports: [FlutterwaveService],
})
export class FlutterwaveModule {}
