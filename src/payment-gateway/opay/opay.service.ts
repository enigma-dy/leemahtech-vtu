import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OpayPaymentRequest, OpayStatusRequest } from './dto/opay.dto';
import { firstValueFrom } from 'rxjs';
import * as qs from 'qs';
import { sha512 } from 'js-sha512';

@Injectable()
export class OpayService {
  constructor(private readonly httpService: HttpService) {}

  private generateHmacSignature(data: any): string {
    const privateKey = process.env.OPAY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('OPAY_PRIVATE_KEY is not configured');
    }
    const hash = sha512.hmac.create(privateKey);
    hash.update(JSON.stringify(data));
    return hash.hex();
  }

  async createPayment(data: OpayPaymentRequest) {
    try {
      if (
        !process.env.OPAY_PAYMENT_URL ||
        !process.env.OPAY_PUBLIC_KEY ||
        !process.env.OPAY_MERCHANT_ID
      ) {
        throw new Error('Opay configuration is incomplete');
      }

      const response = await firstValueFrom(
        this.httpService.post(process.env.OPAY_PAYMENT_URL, data, {
          headers: {
            Authorization: `Bearer ${process.env.OPAY_PUBLIC_KEY}`,
            MerchantId: process.env.OPAY_MERCHANT_ID,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Error creating Opay payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  async checkPaymentStatus(data: OpayStatusRequest) {
    try {
      if (
        !process.env.OPAY_STATUS_URL ||
        !process.env.OPAY_PRIVATE_KEY ||
        !process.env.OPAY_MERCHANT_ID
      ) {
        throw new Error('Opay configuration is incomplete');
      }

      const hmacSignature = this.generateHmacSignature(data);

      const response = await firstValueFrom(
        this.httpService.post(process.env.OPAY_STATUS_URL, data, {
          headers: {
            MerchantId: process.env.OPAY_MERCHANT_ID,
            Authorization: `Bearer ${hmacSignature}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }
}
