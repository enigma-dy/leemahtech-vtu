import { Injectable } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { PrismaService } from 'src/db/prisma.service';
import { UserHandler } from './user.handler';
import { BotContext } from '../interface/bot.interfaces';
import { Decimal } from 'generated/prisma/runtime/library';
import { DataPrice } from 'generated/prisma';

@Injectable()
export class WalletHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHandler: UserHandler,
  ) {}

  public register(bot: Telegraf<BotContext>) {
    bot.command('wallet', (ctx) => this.showWalletBalance(ctx));
    bot.command('deposit', (ctx) => this.initiateDeposit(ctx));

    bot.action(/^deposit_(\d+)$/, async (ctx) => {
      const amount = parseInt(ctx.match[1], 10);
      await this.processDeposit(ctx, amount);
    });

    bot.action(/^fund_wallet_(.+)$/, async (ctx) => {
      const amount = ctx.match[1];
      await ctx.answerCbQuery();
      const paymentUrl = `https://yourpaygate.com/pay?amount=${amount}&ref=${ctx.from?.id}`;
      await ctx.reply(
        `To continue, please fund your wallet by clicking the link:\n${paymentUrl}`,
      );
    });
  }

  public async showWalletBalance(ctx: BotContext) {
    const user = await this.userHandler.getUser(ctx, { createIfNeeded: true });
    if (!user) return ctx.reply('Could not find or create your account.');

    const balance = new Decimal(user.wallet.balance).toFixed(2);
    await ctx.reply(`*Your Wallet Balance:*\n\n💰 *₦${balance}*`, {
      parse_mode: 'Markdown',
    });
  }

  public async promptFunding(
    ctx: BotContext,
    plan: DataPrice,
    currentBalance: Decimal,
  ) {
    const price = new Decimal(plan.Affilliate_price);
    const diff = price.minus(currentBalance).toFixed(2);

    await ctx.reply(
      `You need ₦${price.toFixed(2)} but you only have ₦${currentBalance.toFixed(2)}.\n\nWhat do you want to do?`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            `💰 Fund Wallet (₦${diff})`,
            `fund_wallet_${diff}`,
          ),
        ],
        [Markup.button.callback('❌ Cancel', 'cancel_purchase')],
      ]),
    );
  }

  private async initiateDeposit(ctx: BotContext) {
    const amounts = [100, 500, 1000, 5000];
    await ctx.reply(
      'Select a deposit amount:',
      Markup.inlineKeyboard(
        amounts.map((amount) =>
          Markup.button.callback(`₦${amount}`, `deposit_${amount}`),
        ),
      ),
    );
  }

  private async processDeposit(ctx: BotContext, amount: number) {
    const user = await this.userHandler.getUser(ctx, { createIfNeeded: true });
    if (!user) {
      await ctx.answerCbQuery('Could not find your account.');
      return ctx.editMessageText('Could not find or create your account.');
    }

    try {
      const depositAmount = new Decimal(amount);
      const updatedWallet = await this.prisma.wallet.update({
        where: { id: user.walletId },
        data: { balance: { increment: depositAmount } },
      });

      await ctx.editMessageText(
        `✅ Deposit of ₦${amount} successful! New balance: ₦${updatedWallet.balance.toFixed(2)}`,
      );
    } catch (error) {
      console.error('Error processing deposit:', error);
      await ctx.answerCbQuery('An error occurred.');
      await ctx.editMessageText('An error occurred. Please contact support.');
    }
  }
}
