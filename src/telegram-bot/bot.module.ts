import { Module } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { VtuTelegramBotService } from './bot.service';
import { DataPurchaseHandler } from './handlers/data-purchase.handler';
import { UiHandler } from './handlers/ui.handler';
import { UserHandler } from './handlers/user.handler';
import { WalletHandler } from './handlers/wallet.handler';

@Module({
  providers: [
    PrismaService,
    VtuTelegramBotService,
    UserHandler,
    WalletHandler,
    DataPurchaseHandler,
    UiHandler,
  ],
})
export class VtuTelegramBotModule {}
