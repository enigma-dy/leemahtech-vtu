import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { User, Wallet } from 'generated/prisma';
import { PrismaService } from 'src/db/prisma.service';
import { BotContext } from '../interface/bot.interfaces';

@Injectable()
export class UserHandler {
  constructor(private readonly prisma: PrismaService) {}

  public register(bot: Telegraf<BotContext>) {
    bot.command('link', (ctx) => this.linkAccount(ctx));
  }

  public async getUser(
    ctx: BotContext,
    options: { createIfNeeded: boolean } = { createIfNeeded: false },
  ): Promise<(User & { wallet: Wallet }) | null> {
    if (!ctx.from) {
      throw new Error('User information is missing from the context.');
    }
    const telegramId = BigInt(ctx.from.id);

    let user = await this.prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true },
    });

    if (!user && options.createIfNeeded) {
      console.log(`Creating new user for telegramId: ${telegramId}`);
      user = await this.prisma.user.create({
        data: {
          telegramId,
          telegramFirstName: ctx.from.first_name,
          telegramUsername: ctx.from.username,
          wallet: {
            create: { name: `${ctx.from.first_name}'s Wallet`, balance: 0 },
          },
        },
        include: { wallet: true },
      });
    }

    return user && user.wallet ? user : null;
  }

  private async linkAccount(ctx: BotContext) {
    if (!ctx.from) {
      return ctx.reply('Could not identify your Telegram account.');
    }
    const { id, first_name, username } = ctx.from;
    const token = ctx.payload?.trim() || '';

    if (!token) {
      return ctx.reply('Please provide a token. Usage: /link <your-token>');
    }

    if (
      await this.prisma.user.findUnique({ where: { telegramId: BigInt(id) } })
    ) {
      return ctx.reply('This Telegram account is already linked to a user.');
    }

    try {
      const linkToken = await this.prisma.accountLinkToken.findFirst({
        where: { token, expiresAt: { gte: new Date() } },
      });

      if (!linkToken) {
        return ctx.reply(
          'Invalid or expired token. Please generate a new one.',
        );
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: linkToken.userId },
          data: {
            telegramId: BigInt(id),
            telegramFirstName: first_name,
            telegramUsername: username,
          },
        });
        await tx.accountLinkToken.delete({ where: { id: linkToken.id } });
      });

      await ctx.reply('✅ Success! Your account has been linked.');
    } catch (error) {
      console.error('Error linking account:', error);
      await ctx.reply(
        'An error occurred. The account might already be linked.',
      );
    }
  }
}
