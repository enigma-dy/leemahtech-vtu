import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Flutterwave from 'flutterwave-node-v3';

@Injectable()
export class FlutterwaveService implements OnModuleInit {
  private flw: any;
  private readonly logger = new Logger(FlutterwaveService.name);
  private enckey: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('FLUTTER_PUBLIC_KEY');
    const secretKey = this.configService.get<string>('FLUTTER_SECRET_KEY');
    const encryptionKey = this.configService.get<string>(
      'FLUTTER_ENCRYPTION_KEY',
    );

    if (!publicKey || !secretKey || !encryptionKey) {
      this.logger.error('Missing Flutterwave API credentials');
      throw new Error('Flutterwave API keys are not set');
    }

    this.flw = new Flutterwave(publicKey, secretKey);
    this.enckey = encryptionKey;
  }

  async chargeCard(payload: any): Promise<any> {
    try {
      const cardPayload = { ...payload, enckey: this.enckey };
      return await this.flw.Charge.card(payload);
    } catch (error) {
      this.logger.error(`Card charge failed: ${error.message}`);
      throw error;
    }
  }

  async initiateBankTransfer(payload: any): Promise<any> {
    try {
      return await this.flw.Charge.bank_transfer(payload);
    } catch (error) {
      this.logger.error(`Bank transfer initiation failed: ${error.message}`);
      throw error;
    }
  }

  async chargeNigeriaAccount(payload: any): Promise<any> {
    try {
      return await this.flw.Charge.ng_account(payload);
    } catch (error) {
      this.logger.error(`Nigeria Direct Debit failed: ${error.message}`);
      throw error;
    }
  }

  async chargeUSSD(payload: any): Promise<any> {
    try {
      return await this.flw.Charge.ussd(payload);
    } catch (error) {
      this.logger.error(`USSD payment failed: ${error.message}`);
      throw error;
    }
  }

  async chargeENaira(payload: any): Promise<any> {
    try {
      return await this.flw.Charge.enaira(payload);
    } catch (error) {
      this.logger.error(`eNaira payment failed: ${error.message}`);
      throw error;
    }
  }

  async verifyTransaction(id: string): Promise<any> {
    try {
      return await this.flw.Transaction.verify({ id });
    } catch (error) {
      this.logger.error(`Transaction verification failed: ${error.message}`);
      throw error;
    }
  }
}
