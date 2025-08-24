import { Injectable } from '@nestjs/common';
import { Telegraf, Markup, Scenes } from 'telegraf';
import { PrismaService } from 'src/db/prisma.service';
import { UserHandler } from './user.handler';
import { WalletHandler } from './wallet.handler';
import { BotContext, BotWizardSession } from '../interface/bot.interfaces';
import { Decimal } from '@prisma/client/runtime/library';
import { DataPrice } from '@prisma/client';

@Injectable()
export class DataPurchaseHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHandler: UserHandler,
    private readonly walletHandler: WalletHandler,
  ) {}

  public register(bot: Telegraf<BotContext>) {
    bot.command('buy', (ctx) => ctx.scene.enter('buy-data'));
    bot.command('plans', (ctx) => this.showDataPlans(ctx));

    bot.action(/^select_plan_(.+)$/, (ctx) => this.onPlanSelected(ctx));
    bot.action(/^confirm_purchase_(.+)$/, (ctx) =>
      this.onPurchaseConfirmed(ctx),
    );
    bot.action('cancel_purchase', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('Purchase cancelled.');
      return ctx.scene.leave();
    });
    bot.action('cancel_buy_data', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('Operation cancelled.');
      return ctx.scene.leave();
    });
  }

  public getScene(): Scenes.WizardScene<BotContext> {
    const scene = new Scenes.WizardScene<BotContext>(
      'buy-data',
      (ctx) => this.askForNetwork(ctx),
      (ctx) => this.askForPlan(ctx),
    );
    scene.leave(async (ctx) => {
      delete (ctx.scene.session as BotWizardSession).awaitingPhone;
      delete (ctx.scene.session as BotWizardSession).pendingPlan;
      await ctx.reply('Returning to main menu.', Markup.removeKeyboard());
    });
    return scene;
  }

  private async askForNetwork(ctx: BotContext) {
    await ctx.reply(
      'Select network:',
      Markup.keyboard(['MTN', 'Airtel', 'Glo', '9mobile', 'Cancel'])
        .oneTime()
        .resize(),
    );
    return ctx.wizard.next();
  }

  private async askForPlan(ctx: BotContext) {
    if (
      !ctx.message ||
      !('text' in ctx.message) ||
      ctx.message.text === 'Cancel'
    ) {
      await ctx.reply('Operation cancelled.');
      return ctx.scene.leave();
    }

    const network = ctx.message.text;
    (ctx.wizard.state as BotWizardSession).network = network;

    const plans = await this.prisma.dataPrice.findMany({
      where: { network_name: network },
      orderBy: { Affilliate_price: 'asc' },
    });

    if (plans.length === 0) {
      await ctx.reply('No plans available for this network.');
      return ctx.scene.leave();
    }

    const keyboard = plans.map((plan) => [
      Markup.button.callback(
        `${plan.plan_size} (${plan.validity}) - ₦${Number(plan.Affilliate_price).toFixed(2)}`,
        `select_plan_${plan.id}`,
      ),
    ]);
    keyboard.push([Markup.button.callback('Cancel', 'cancel_buy_data')]);

    await ctx.reply('Select a data plan:', Markup.inlineKeyboard(keyboard));
  }

  private async onPlanSelected(ctx: BotContext) {
    //  FIX: Add a check to ensure ctx.match exists before using it.
    if (!ctx.match) return;

    const planId = ctx.match[1];
    const plan = await this.prisma.dataPrice.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      await ctx.answerCbQuery('Invalid plan selected.');
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `Confirm purchase: ${plan.plan_size} for ₦${Number(plan.Affilliate_price).toFixed(2)}?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirm', `confirm_purchase_${plan.id}`)],
        [Markup.button.callback('❌ Cancel', 'cancel_purchase')],
      ]),
    );
  }

  private async onPurchaseConfirmed(ctx: BotContext) {
    if (!ctx.match) return;

    const planId = ctx.match[1];
    const plan = await this.prisma.dataPrice.findUnique({
      where: { id: planId },
    });
    if (!plan) return ctx.answerCbQuery('Plan not found.');

    const user = await this.userHandler.getUser(ctx, { createIfNeeded: false });
    if (!user) {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'You need an account to buy data. Use /start to create one.',
      );
      return ctx.scene.leave();
    }

    const planPrice = new Decimal(plan.Affilliate_price);
    const userBalance = new Decimal(user.wallet.balance);

    if (userBalance.lt(planPrice)) {
      await ctx.answerCbQuery();
      await this.walletHandler.promptFunding(ctx, plan, userBalance);
      return;
    }

    await ctx.answerCbQuery('Processing...');
    await this.processDataPurchase(ctx, plan);
    return ctx.scene.leave();
  }

  private async processDataPurchase(ctx: BotContext, plan: DataPrice) {
    const user = await this.userHandler.getUser(ctx);
    if (!user) return;

    try {
      const planPrice = new Decimal(plan.Affilliate_price);
      const updatedWallet = await this.prisma.wallet.update({
        where: { id: user.walletId },
        data: { balance: { decrement: planPrice } },
      });

      console.log(`PURCHASE: User ${user.id} bought ${plan.plan_size}`);

      await ctx.editMessageText(
        `✅ Success! You've purchased ${plan.plan_size}. New balance: ₦${updatedWallet.balance.toFixed(2)}`,
      );
    } catch (error) {
      console.error('Error in final purchase step:', error);
      await ctx.editMessageText('An error occurred. Please contact support.');
    }
  }

  private async showDataPlans(ctx: BotContext) {
    await ctx.reply(
      'To see all plans, please start the purchase flow with /buy.',
    );
  }
}
