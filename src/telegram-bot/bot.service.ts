import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Telegraf, Scenes, session } from 'telegraf';
import * as https from 'https';
import { BotContext } from './interface/bot.interfaces';
import { UserHandler } from './handlers/user.handler';
import { WalletHandler } from './handlers/wallet.handler';
import { UiHandler } from './handlers/ui.handler';
import { DataPurchaseHandler } from './handlers/data-purchase.handler';

@Injectable()
export class VtuTelegramBotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf<BotContext>;

  constructor(
    private readonly userHandler: UserHandler,
    private readonly walletHandler: WalletHandler,
    private readonly uiHandler: UiHandler,
    private readonly dataPurchaseHandler: DataPurchaseHandler,
  ) {}

  onModuleInit() {
    const token = process.env.TG_BOT_TOKEN;
    if (!token) throw new Error('TG_BOT_TOKEN not set');

    const agent = new https.Agent({ keepAlive: true });
    this.bot = new Telegraf<BotContext>(token, { telegram: { agent } });

    const buyDataScene = this.dataPurchaseHandler.getScene();
    const stage = new Scenes.Stage<BotContext>([buyDataScene], {});

    this.bot.use(session());
    this.bot.use(stage.middleware());

    this.userHandler.register(this.bot);
    this.walletHandler.register(this.bot);
    this.dataPurchaseHandler.register(this.bot);
    this.uiHandler.register(this.bot);

    this.bot.launch();
    console.log('🚀 VTU Bot started with polling (Modular Architecture)');
    this.setupGracefulShutdown();
  }

  onModuleDestroy() {
    this.stopBot();
  }

  private setupGracefulShutdown() {
    process.once('SIGINT', () => this.stopBot('SIGINT'));
    process.once('SIGTERM', () => this.stopBot('SIGTERM'));
  }

  private stopBot(signal?: string) {
    if (this.bot) {
      console.log(`Stopping bot due to ${signal}...`);
      this.bot.stop(signal);
    }
  }
}
