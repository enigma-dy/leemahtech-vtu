import {
  Injectable,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Decimal } from 'generated/prisma/runtime/library';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor(
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
  ) {}

  async initiatePayment(paymentData: any, userId: string): Promise<any> {
    try {
      const payload = {
        ...paymentData,
        meta: {
          userId,
          type: 'wallet_fuding',
        },
      };
      const secretKey = this.configService.get<string>('FLUTTER_SECRET_KEY');

      const response = await axios.post(`${this.baseUrl}/payments`, payload, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        'Payment initiation failed',
        error?.response?.data || error.message,
      );
      throw error;
    }
  }

  async handleWebhook(data) {
    const rawBody = (data as any).rawBody;
    console.log('webhook was called');
    const signature = data.headers['verif-hash'];
    const secret = this.configService.get('FLUTTER_SECRET_KEY');

    if (signature !== secret) {
      throw new UnauthorizedException('Invalid signature');
    }

    const event = data.body as FlutterwaveWebhookEvent;

    if (
      event?.event === 'charge.completed' &&
      event.data?.status === 'successful'
    ) {
      const userId = event.data.meta?.userId as string;
      const amount = new Decimal(event.data.amount);
      await this.walletService.creditWallet(userId, amount);
    }

    return { status: 'success' };
  }
}

export interface FlutterwaveWebhookEvent {
  event: string;
  data: {
    status: string;
    amount: string;
    meta?: {
      userId?: string;
    };
  };
}
