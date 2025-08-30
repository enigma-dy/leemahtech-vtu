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

  public appRef: any;

  constructor(
    private readonly userHandler: UserHandler,
    private readonly walletHandler: WalletHandler,
    private readonly uiHandler: UiHandler,
    private readonly dataPurchaseHandler: DataPurchaseHandler,
  ) {}

  async onModuleInit() {
    const token = process.env.TG_BOT_TOKEN;
    if (!token) throw new Error('TG_BOT_TOKEN not set');

    const mode = process.env.BOT_MODE || 'webhook';
    const publicUrl = process.env.FRONTEND_URL;
    const agent = new https.Agent({ keepAlive: true });
    this.bot = new Telegraf<BotContext>(token, { telegram: { agent } });


    const buyDataScene = this.dataPurchaseHandler.getScene();
    const stage = new Scenes.Stage<BotContext>([buyDataScene], {});
    this.bot.use(session());
    this.bot.use(stage.middleware());

    //handlers
    this.userHandler.register(this.bot);
    this.walletHandler.register(this.bot);
    this.dataPurchaseHandler.register(this.bot);
    this.uiHandler.register(this.bot);

    this.bot.catch((err: unknown, ctx) => {
      const error = err as Error;
      console.error(
        `Bot error on ${ctx?.updateType}`,
        error.stack || error.message,
      );
    });

    process.on('unhandledRejection', (reason) => {
      console.error(`Unhandled Rejection: ${reason}`);
    });

    process.on('uncaughtException', (err) => {
      console.error(`Uncaught Exception: ${err.message}`, err.stack);
    });

    if (mode === 'webhook' && publicUrl) {
      await this.startWebhookMode(publicUrl);
    } else {
      await this.launchWithRetries();
    }

    this.setupGracefulShutdown();
  }

  private async startWebhookMode(publicUrl: string) {
    const webhookPath = `/bot${process.env.TG_BOT_TOKEN}`;
    const webhookUrl = `${publicUrl}${webhookPath}`;

    try {
      await this.bot.telegram.setWebhook(webhookUrl);
      this.logger.log(`Webhook set successfully: ${webhookUrl}`);
    } catch (err) {
      this.logger.error(
        `Failed to set webhook: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }

    if (!this.appRef) {
      this.logger.warn('appRef not set — skipping webhook setup');
      return;
    }

    this.appRef.use(this.bot.webhookCallback(webhookPath));

    this.logger.log(`🚀 VTU Bot started in WEBHOOK mode at: ${webhookUrl}`);
  }

  private async launchWithRetries(retries = 5, delayMs = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.bot.launch();
        this.logger.log('🚀 VTU Bot started with POLLING');
        return;
      } catch (err) {
        this.logger.error(
          `Launch attempt ${attempt} failed: ${(err as Error).message}`,
        );
        if (attempt < retries) {
          this.logger.log(`Retrying in ${delayMs / 1000} seconds...`);
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }
    this.logger.error('Max retries reached. Bot not started.');
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
