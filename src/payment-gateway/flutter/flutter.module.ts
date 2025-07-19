import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FlutterwaveService } from './flutter.service';
import { ConfigModule } from '@nestjs/config';
import { FlutterwaveController } from './flutter.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [FlutterwaveController],
  providers: [FlutterwaveService],
  exports: [FlutterwaveService],
})
export class FlutterwaveModule {}
