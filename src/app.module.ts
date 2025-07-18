import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PrismaModule } from './db/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
// import { FlutterwaveModule } from './payment-gateway/flutter/flutter.module';
import { LeemahModule } from './providers/leemah/leemah.module';
import { DataStationModule } from './providers/datastation/datastation.module';
import { HusmodModule } from './providers/husmod/husmod.module';
import { DataModule } from './data-plan/data.module';
import { SmeProviderModule } from './providers/provider.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    AuthModule,
    AccountModule,
    // FlutterwaveModule,
    LeemahModule,
    DataStationModule,
    HusmodModule,
    DataModule,
    SmeProviderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
