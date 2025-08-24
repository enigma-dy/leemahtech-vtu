import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PrismaModule } from './db/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LeemahModule } from './providers/leemah/leemah.module';
import { DataStationModule } from './providers/datastation/datastation.module';
import { HusmodModule } from './providers/husmod/husmod.module';
import { DataModule } from './data-plan/data.module';
import { SmeProviderModule } from './providers/provider.module';
import { WalletModule } from './wallet/wallet.module';
import { OpayModule } from './payment-gateway/opay/opay.module';
import { FlutterwaveModule } from './payment-gateway/flutter/flutter.module';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { VtuTelegramBotModule } from './telegram-bot/bot.module';
import opayConfig from './payment-gateway/opay/config/opay.config';
import { AdminModule } from './admin/admin.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ResellerModule } from './reseller/reseller.module';
import { AccountingModule } from './accounting/accounting.modult';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [opayConfig],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    WalletModule,
    FlutterwaveModule,
    LeemahModule,
    DataStationModule,
    HusmodModule,
    DataModule,
    SmeProviderModule,
    OpayModule,
    ResellerModule,
    AccountingModule,
    // VtuTelegramBotModule,
    EventEmitterModule.forRoot(),
    AdminModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
