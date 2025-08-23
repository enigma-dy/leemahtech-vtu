// // accounting.service.ts
// import { Injectable, BadRequestException } from '@nestjs/common';
// import { PrismaService } from 'src/db/prisma.service';

// @Injectable()
// export class AccountingService {
//   constructor(private prisma: PrismaService) {}

//   async recordSale(userId: string, amount: number, cost: number, txRef: string) {
//     const profit = amount - cost;

//     return this.prisma.$transaction(async (tx) => {
//       // Get wallets
//       const userWallet = await tx.wallet.findUnique({ where: { userId } });
//       if (!userWallet || userWallet.balance < amount) {
//         throw new BadRequestException('Insufficient balance');
//       }

//       const liabilityWallet = await tx.wallet.findUnique({ where: { name: 'PLATFORM_LIABILITY_WALLET' } });
//       const revenueWallet = await tx.wallet.findUnique({ where: { name: 'PLATFORM_REVENUE_WALLET' } });
//       const profitWallet = await tx.wallet.findUnique({ where: { name: 'PLATFORM_PROFIT_WALLET' } });

//       // 1. Debit user
//       await tx.wallet.update({
//         where: { id: userWallet.id },
//         data: { balance: { decrement: amount } },
//       });

//       // 2. Credit liability
//       await tx.wallet.update({
//         where: { id: liabilityWallet.id },
//         data: { balance: { increment: amount } },
//       });

//       // 3. Debit liability
//       await tx.wallet.update({
//         where: { id: liabilityWallet.id },
//         data: { balance: { decrement: amount } },
//       });

//       // 4. Credit revenue
//       await tx.wallet.update({
//         where: { id: revenueWallet.id },
//         data: { balance: { increment: amount } },
//       });

//       // 5. Credit profit (net only)
//       await tx.wallet.update({
//         where: { id: profitWallet.id },
//         data: { balance: { increment: profit } },
//       });

//       // 6. Provider cost = implicit (not tracked unless you create PROVIDER_WALLET)
//       // Example: debit profit / credit provider
//       // await tx.wallet.update({ where: { id: profitWallet.id }, data: { balance: { decrement: cost } } });

//       // Transaction record
//       await tx.transaction.create({
//         data: {
//           txRef,
//           userId,
//           amount,
//           type: 'SALE',
//           status: 'SUCCESS',
//         },
//       });

//       return { success: true, profit };
//     });
//   }

//   async recordRefund(userId: string, amount: number, profit: number, txRef: string) {
//     return this.prisma.$transaction(async (tx) => {
//       const userWallet = await tx.wallet.findUnique({ where: { userId } });
//       const liabilityWallet = await tx.wallet.findUnique({ where: { name: 'PLATFORM_LIABILITY_WALLET' } });
//       const revenueWallet = await tx.wallet.findUnique({ where: { name: 'PLATFORM_REVENUE_WALLET' } });
//       const profitWallet = await tx.wallet.findUnique({ where: { name: 'PLATFORM_PROFIT_WALLET' } });

//       // 1. Debit liability
//       await tx.wallet.update({
//         where: { id: liabilityWallet.id },
//         data: { balance: { decrement: amount } },
//       });

//       // 2. Credit user
//       await tx.wallet.update({
//         where: { id: userWallet.id },
//         data: { balance: { increment: amount } },
//       });

//       // 3. Debit revenue
//       await tx.wallet.update({
//         where: { id: revenueWallet.id },
//         data: { balance: { decrement: amount } },
//       });

//       // 4. Debit profit
//       await tx.wallet.update({
//         where: { id: profitWallet.id },
//         data: { balance: { decrement: profit } },
//       });

//       // Transaction record
//       await tx.transaction.create({
//         data: {
//           txRef,
//           userId,
//           amount,
//           type: 'REFUND',
//           status: 'SUCCESS',
//         },
//       });

//       return { success: true };
//     });
//   }
// }
