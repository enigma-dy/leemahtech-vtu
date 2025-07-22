// import { Markup } from 'telegraf';
// import { BotContext } from '../interface/bot.interfaces';
// import { VtuTelegramBotService } from '../bot.service';

// export function registerStartCommand(service: VtuTelegramBotService) {
//   service.bot.start((ctx: BotContext) => {
//     if (!ctx.from) return;

//     const escapeHTML = (text: string): string =>
//       text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

//     const username = ctx.from.username
//       ? `@${escapeHTML(ctx.from.username)}`
//       : escapeHTML(ctx.from.first_name);

//     const welcomeMessage = `👋 Hello ${username}!\n\nWelcome to <b>VTU Data Bot</b>!`;

//     const keyboard = Markup.keyboard([
//       ['📊 Buy Data', '💰 Sell Data'],
//       ['💳 My Wallet', '🆘 Help'],
//     ]).resize();

//     return ctx.reply(welcomeMessage, {
//       parse_mode: 'HTML',
//       ...keyboard,
//     });
//   });
// }

// export function registerHelpCommand(service: VtuTelegramBotService) {
//   service.bot.help((ctx: BotContext) =>
//     service.botActions.sendHelpMessage(ctx),
//   );
// }

// export function registerDataCommands(service: VtuTelegramBotService) {
//   service.bot.command('buy', (ctx: BotContext) => ctx.scene.enter('buy-data'));
//   service.bot.command('sell', (ctx: BotContext) =>
//     ctx.scene.enter('sell-data'),
//   );
//   service.bot.command('plans', (ctx: BotContext) =>
//     service.botActions.showDataPlans(ctx),
//   );
// }

// export function registerWalletCommands(service: VtuTelegramBotService) {
//   service.bot.command('wallet', (ctx: BotContext) =>
//     service.botActions.showWalletBalance(ctx),
//   );
//   service.bot.command('deposit', (ctx: BotContext) =>
//     service.botActions.initiateDeposit(ctx),
//   );
// }

// export function registerAdminCommands(service: VtuTelegramBotService) {
//   service.bot.command('addplan', (ctx: BotContext) => {
//     if (!ctx.from || ctx.from.id !== service.adminId) {
//       return ctx.reply('❌ Admin only command');
//     }
//     return ctx.reply('Admin command: Add Plan (not implemented)');
//   });
// }

// // ✅ Key integration inside vtu-telegram-bot.service.ts

// // Inside class:
// // private botActions: BotActions;

// // Inside onModuleInit():
// // this.botActions = new BotActions(() => this.users, () => this.dataPlans);

// // Inside registerMessageHandlers():
// /*
// this.bot.on(message('text'), async (ctx: BotContext) => {
//   const msg = ctx.message as Message.TextMessage;
//   const text = msg.text;

//   if (text === '📊 Buy Data') return ctx.scene.enter('buy-data');
//   if (text === '💰 Sell Data') return ctx.scene.enter('sell-data');
//   if (text === '🆘 Help') return this.botActions.sendHelpMessage(ctx);
//   if (text === '💳 My Wallet') return this.botActions.showWalletBalance(ctx);

//   if (!ctx.from) return;
//   const lower = text.toLowerCase();
//   if (lower.includes('hi') || lower.includes('hello')) {
//     const user = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
//     return ctx.reply(`Hello ${user}! Use /start for the main menu.`);
//   }
// });
// */
