import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import {
  AirTime2CastDto,
  AirtimePurchaseDto,
  CardPurchaseDto,
  ElectricityPaymentDto,
  ExamPinPurchaseDto,
  HusmodDataDto,
} from './dto/husmod.dto';
import { WalletService } from 'src/wallet/wallet.service';
import { Amount } from 'src/payment-gateway/opay/dto/opay.dto';

import { PrismaService } from 'src/db/prisma.service';
import { DataDto } from 'src/data-plan/dto/data.dto';
import { Decimal } from 'generated/prisma/runtime/library';

@Injectable()
export class HusmodService {
  constructor(
    private readonly httpService: HttpService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  async getMyHusmodDetails(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://husmodataapi.com/api/user/', {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      const {
        user,
        notification,
        percentage,
        topuppercentage,
        Admin_number,
        Exam,
        banks,
        banners,
        Dataplans,
        Cableplan,
        support_phone_number,
        recharge,
      } = response.data;

      const {
        id,
        email,
        FullName,
        Phone,
        Account_Balance,
        wallet_balance,
        bonus_balance,
      } = user;
      const acct_bal = user.bank_accounts;

      return {
        id,
        email,
        FullName,
        Phone,
        Account_Balance,
        wallet_balance,
        bonus_balance,
        acct_bal,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Error fetching data from DataStation';
      const status = error?.response?.status || 500;
      throw new InternalServerErrorException({ status, message });
    }
  }

  async getDataPricing(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://husmodataapi.com/api/network/', {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Error fetching data from DataStation';
      const status = error?.response?.status || 500;
      throw new InternalServerErrorException({ status, message });
    }
  }

  async buyData(userId: string, data: HusmodDataDto, selling_price: Decimal) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    console.log(user?.wallet.balance, selling_price);

    if (
      !user ||
      !user.wallet ||
      user.wallet.balance.lt(new Decimal(selling_price))
    ) {
      throw new Error('Insufficient wallet balance');
    }

    // Create Ledger
    const ledger = await this.prisma.ledger.create({
      data: {
        description: `Buy Data - ${data.plan}`,
        createdBy: userId,
      },
    });

    // Debit Wallet Entry
    await this.prisma.entry.create({
      data: {
        walletId: user.wallet.id,
        ledgerId: ledger.id,
        amount: selling_price,
        type: 'DEBIT',
      },
    });

    // Create Transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        txRef: `TX-${Date.now()}`,
        userId,
        amount: selling_price,
        walletId: user.wallet.id,
        status: 'PENDING',
        channel: 'App',
        provider: 'datastation',
      },
    });

    //Create DataPurchase Record
    const dataPurchase = await this.prisma.dataPurchase.create({
      data: {
        userId,
        network: data.network,
        planName: data.plan,
        planSize: data.planSize,
        planVolume: data.planSize,
        amount: selling_price,
        status: 'PENDING',
      },
    });

    // Call the API
    try {
      const payloadToSend = {
        network: data.network,
        mobile_number: data.mobile_number,
        plan: data.plan,
        Ported_number: data.Ported_number,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          'https://husmodataapi.com/api/data',
          payloadToSend,
          {
            headers: {
              Authorization: `Token ${process.env.DataStation_API_KEY}`,
            },
          },
        ),
      );

      //Update transaction and data purchase
      await Promise.all([
        this.prisma.dataPurchase.update({
          where: { id: dataPurchase.id },
          data: {
            status: 'SUCCESS',
            response: response.data,
          },
        }),
        this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SUCCESS',
            completedAt: new Date(),
          },
        }),
      ]);

      return response.data;
    } catch (error) {
      // Step 7: On Failure, update transaction and data purchase
      await Promise.all([
        this.prisma.dataPurchase.update({
          where: { id: dataPurchase.id },
          data: {
            status: 'FAILED',
            response: error?.response?.data || { message: error.message },
          },
        }),
        this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        }),
      ]);

      throw error;
    }
  }

  async getallDataTransaction(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://husmodataapi.com/api/data/', {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async queryDataTransaction(id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://husmodataapi.com/api/data/${id}`, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async queryBillPayment(id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://husmodataapi.com/api/billpayment/${id}`, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async queryCableSub(id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://husmodataapi.com/api/cablesub/${id}`, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async validateIUC(id: string, iuc: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://husmodataapi.com/api/validateiuc?smart_card_number=${iuc}& &cablename=${id}`,
          {
            headers: {
              Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
            },
          },
        ),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async validateMeter(id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://husmodataapi.com/api/data/', {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async airtimeToCash(data: AirTime2CastDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://husmodataapi.com/api/Airtime_funding',
          data,
          {
            headers: {
              Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
            },
          },
        ),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async electricityBillPayment(data: ElectricityPaymentDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://husmodataapi.com/api/cablesub/', data, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async buyResultCheckerPin(data: ExamPinPurchaseDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://husmodataapi.com/api/epin/', data, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async generateRechargePin(data: CardPurchaseDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://husmodataapi.com/api/rechargepin',
          data,
          {
            headers: {
              Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
            },
          },
        ),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }

  async buyAirtime(data: AirtimePurchaseDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://husmodataapi.com/api/topup', data, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('DataStation API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }
}
