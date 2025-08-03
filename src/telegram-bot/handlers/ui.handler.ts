import { Injectable } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { BotContext } from '../interface/bot.interfaces';
import { UserHandler } from './user.handler';
import { WalletHandler } from './wallet.handler';

@Injectable()
export class UiHandler {
  constructor(
    private readonly userHandler: UserHandler,
    private readonly walletHandler: WalletHandler,
  ) {}

  public register(bot: Telegraf<BotContext>) {
    bot.start((ctx) => this.sendWelcomeMessage(ctx));
    bot.help((ctx) => this.sendHelpMessage(ctx));

    // Handle main menu text buttons
    bot.on(message('text'), async (ctx) => {
      // Avoid interfering with scenes
      if (ctx.scene.current) return;

      switch (ctx.message.text) {
        case '📊 Buy Data':
          return ctx.scene.enter('buy-data');
        case '💳 My Wallet':
          return this.walletHandler.showWalletBalance(ctx);
        case '🆘 Help':
          return this.sendHelpMessage(ctx);
      }
    });
  }

  private async sendWelcomeMessage(ctx: BotContext) {
    // ✅ FIX: Add a check to ensure ctx.from exists before using it.
    if (!ctx.from) {
      console.warn('Received /start command without a "from" user. Ignoring.');
      return;
    }

    const user = await this.userHandler.getUser(ctx);
    let welcomeMessage = `👋 Hello ${ctx.from.first_name}!\nWelcome to *VTU Data Bot*!`;
    if (!user) {
      welcomeMessage += `\n\nIt looks like you're new. We'll create an account for you automatically when you make your first purchase or deposit.`;
    }

    const keyboard = Markup.keyboard([
      ['📊 Buy Data'],
      ['💳 My Wallet', '🆘 Help'],
    ]).resize();

    await ctx.replyWithMarkdown(welcomeMessage, keyboard);
  }

  private sendHelpMessage(ctx: BotContext) {
    const helpText =
      '*VTU Bot Commands:*\n\n' +
      '/start - Show welcome message\n' +
      '/buy - Buy a data plan\n' +
      '/wallet - Check your balance\n' +
      '/deposit - Fund your wallet\n' +
      '/link <token> - Link your web account\n' +
      '/help - Show this message';

    return ctx.replyWithMarkdown(helpText);
  }
}
