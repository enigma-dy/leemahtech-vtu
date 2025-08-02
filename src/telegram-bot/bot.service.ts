import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Telegraf, Scenes, session } from 'telegraf';
import * as https from 'https';
import { BotContext } from './interface/bot.interfaces';
import { UserHandler } from './handlers/user.handler';
import { WalletHandler } from './handlers/wallet.handler';
import { UiHandler } from './handlers/ui.handler';
import { DataPurchaseHandler } from './handlers/data-purchase.handler';

@Injectable()
export class VtuTelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VtuTelegramBotService.name);
  private bot: Telegraf<BotContext>;

  constructor(
    private readonly userHandler: UserHandler,
    private readonly walletHandler: WalletHandler,
    private readonly uiHandler: UiHandler,
    private readonly dataPurchaseHandler: DataPurchaseHandler,
  ) {}

  async onModuleInit() {
    const token = process.env.TG_BOT_TOKEN;
    if (!token) throw new Error('TG_BOT_TOKEN not set');

    const agent = new https.Agent({ keepAlive: true });
    this.bot = new Telegraf<BotContext>(token, { telegram: { agent } });

    // Scenes setup
    const buyDataScene = this.dataPurchaseHandler.getScene();
    const stage = new Scenes.Stage<BotContext>([buyDataScene], {});
    this.bot.use(session());
    this.bot.use(stage.middleware());

    // Register handlers
    this.userHandler.register(this.bot);
    this.walletHandler.register(this.bot);
    this.dataPurchaseHandler.register(this.bot);
    this.uiHandler.register(this.bot);

    // Catch all bot errors
    this.bot.catch((err: unknown, ctx) => {
      const error = err as Error;
      console.log(
        `Bot error on ${ctx.updateType}`,
        error.stack || error.message,
      );
    });

    // Catch polling/network errors
    (this.bot as any).on('polling_error', (err: unknown) => {
      const error = err as Error;
      console.error(`Polling error: ${error.message}`);
    });
    // Handle unhandled rejections so Node doesn't crash
    process.on('unhandledRejection', (reason) => {
      console.log(`Unhandled Rejection: ${reason}`);
    });

    process.on('uncaughtException', (err) => {
      console.log(`Uncaught Exception: ${err.message}`, err.stack);
    });

    await this.launchWithRetries();

    this.setupGracefulShutdown();
  }

  private async launchWithRetries(retries = 5, delayMs = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.bot.launch();
        this.logger.log('🚀 VTU Bot started with polling');
        return;
      } catch (err) {
        this.logger.error(`Launch attempt ${attempt} failed: ${err.message}`);
        if (attempt < retries) {
          this.logger.log(`Retrying in ${delayMs / 1000} seconds...`);
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }
    this.logger.error(
      'Max retries reached. Bot not started. App will keep running.',
    );
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
      this.logger.log(`Stopping bot due to ${signal || 'module destroy'}...`);
      this.bot.stop(signal);
    }
  }
}
