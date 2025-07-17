import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { DataStationModule } from 'src/providers/datastation/datastation.module';
import { HusmodModule } from 'src/providers/husmod/husmod.module';

@Module({
  imports: [DataStationModule, HusmodModule],
  providers: [AccountService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
