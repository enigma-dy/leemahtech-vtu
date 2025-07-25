import { Body, Controller, Post } from '@nestjs/common';
import { OpayPaymentRequest, OpayStatusRequest } from './dto/opay.dto';
import { OpayService } from './opay.service';
import { Public } from 'src/decorators/auth.decorator';
import { WalletService } from 'src/wallet/wallet.service';
import { PrismaService } from 'src/db/prisma.service';
import { Decimal } from 'generated/prisma/runtime/library';

@Controller('payments/opay')
export class OpayController {
  constructor(
    private readonly opayService: OpayService,
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  @Public()
  @Post('status')
  async checkPaymentStatus(@Body() payload) {
    const statusResult = await this.opayService.checkPaymentStatus(payload);

    const existingPayment = await this.prisma.transaction.findUnique({
      where: { txRef: statusResult.reference },
    });

    if (!existingPayment) {
      throw new Error('Payment record not found');
    }

    if (existingPayment.status === 'SUCCESS') {
      return { message: 'Payment already processed' };
    }

    console.log(statusResult.amount);

    if (statusResult.status === 'SUCCESS') {
      await this.walletService.creditWallet(
        existingPayment.userId,
        new Decimal(statusResult.amount).dividedBy(100),
      );

      await this.prisma.transaction.update({
        where: { txRef: statusResult.reference },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
        },
      });

      return { message: 'Wallet credited successfully' };
    } else {
      await this.prisma.transaction.update({
        where: { txRef: statusResult.reference },
        data: {
          status: 'FAILED',
          errorMessage: statusResult.errorCode || 'Payment failed',
          completedAt: new Date(),
        },
      });

      return { message: 'Payment failed or was cancelled' };
    }
  }
}
