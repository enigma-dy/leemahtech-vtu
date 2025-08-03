import { Body, Controller, Post, Req } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';
import { OpayPaymentRequest, OpayStatusRequest } from './dto/opay.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpayService } from './opay.service';
import { Public } from 'src/decorators/auth.decorator';
import { WalletService } from 'src/wallet/wallet.service';
import { PrismaService } from 'src/db/prisma.service';
import { Decimal } from 'generated/prisma/runtime/library';
import { WalletDto } from 'src/wallet/dto/wallet.dto';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { OpayEvent } from 'src/email/events/mail.event';

@Controller('opay')
export class OpayController {
  constructor(
    private readonly opayService: OpayService,
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('credit')
  async creditAccount(@Body() data: WalletDto, @Req() request: Request) {
    const { sub } = request['user'];
    const user = await this.userService.getUserById(sub);
    if (!user) {
      throw new Error();
    }
    const tx_ref = `tx-${uuidv4()}`;
    const rawAmount = Number(data.amount);
    const redirect_url = process.env.REDIRECT_URL;

    const callbackUrl =
      this.configService.getOrThrow<string>('opay.callbackUrl');
    const returnUrl = this.configService.getOrThrow<string>('opay.returnUrl');
    const cancelUrl = this.configService.getOrThrow<string>('opay.cancelUrl');
    const displayName =
      this.configService.getOrThrow<string>('opay.displayName');
    const opayPayload: OpayPaymentRequest = {
      reference: tx_ref,
      country: 'NG',
      amount: {
        currency: 'NGN',
        total: rawAmount * 100,
      },
      callbackUrl,
      returnUrl,
      cancelUrl,
      displayName,
      expireAt: 30,
      userInfo: {
        userId: sub,
        userName: user.fullName ?? undefined,
        userMobile: user.phone ?? undefined,
        userEmail: user.email ?? undefined,
      },
      product: {
        name: 'Wallet Top-Up',
        description: `Wallet top-up for ${user.fullName}`,
        reference: tx_ref,
      },
      customerVisitSource: 'web',
    };

    const amount = data.amount;

    await this.prisma.transaction.create({
      data: {
        txRef: tx_ref,
        userId: user.id,
        amount: new Decimal(rawAmount),
        status: 'PENDING',
        provider: 'Opay',
      },
    });

    return await this.opayService.createPayment(opayPayload);
  }

  @Public()
  @Post('status')
  async checkPaymentStatus(@Body() payload) {
    const statusResult = await this.opayService.checkPaymentStatus(payload);

    const existingPayment = await this.prisma.transaction.findUnique({
      where: { txRef: statusResult.reference },
      include: {
        user: true,
      },
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

      this.eventEmitter.emit(
        'OpayFunding',
        new OpayEvent(
          existingPayment.user.email!,
          existingPayment.user.fullName!,
          Number(statusResult.amount) / 100,
          statusResult.reference,
        ),
      );
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
