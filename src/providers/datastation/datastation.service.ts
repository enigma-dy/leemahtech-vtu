import { HttpService } from '@nestjs/axios';
import { Body, Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  AirTime2CastDto,
  AirtimePurchaseDto,
  CardPurchaseDto,
  DataStationDto,
  ElectricityPaymentDto,
  ExamPinPurchaseDto,
} from './dto/datastation.dto';
import { PrismaService } from 'src/db/prisma.service';
import { Decimal } from 'generated/prisma/runtime/library';
import { DataPurchaseEvent } from 'src/email/events/mail.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DataStationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMyDataStationDetails(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://datastationapi.com/api/user/', {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
        this.httpService.get('https://datastationapi.com/api/get/network/', {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
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

  async buyData(userId: string, data: DataStationDto, selling_price: Decimal) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (
      !user ||
      !user.wallet ||
      user.wallet.balance.lt(new Decimal(selling_price))
    ) {
      throw new Error('Insufficient wallet balance');
    }

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

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://datastationapi.com/api/data/',
          {
            network: data.network,
            mobile_number: data.mobile_number,
            plan: data.plan,
            Ported_number: data.Ported_number,
          },
          {
            headers: {
              Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      await this.prisma.wallet.update({
        where: { id: user.wallet.id },
        data: {
          balance: {
            decrement: selling_price,
          },
        },
      });

      const ledger = await this.prisma.ledger.create({
        data: {
          description: `Buy Data - ${data.plan}`,
          createdBy: userId,
        },
      });

      await this.prisma.entry.create({
        data: {
          walletId: user.wallet.id,
          ledgerId: ledger.id,
          amount: selling_price,
          type: 'DEBIT',
        },
      });

      const txRef = `TX-${Date.now()}`;

      await this.prisma.transaction.create({
        data: {
          txRef,
          userId,
          amount: selling_price,
          walletId: user.wallet.id,
          status: 'SUCCESS',
          channel: 'App',
          provider: 'husmod',
          completedAt: new Date(),
        },
      });

      await this.prisma.dataPurchase.update({
        where: { id: dataPurchase.id },
        data: {
          status: 'SUCCESS',
          response: response.data,
        },
      });
      this.eventEmitter.emit(
        'data.purchase',
        new DataPurchaseEvent(
          user.email!,
          user.fullName!,
          String(data.network),
          data.plan,
          data.planSize,
          data.mobile_number,
          selling_price,
          txRef!,
        ),
      );
      return response.data;
    } catch (error) {
      const errorResponse = error?.response?.data || { message: error.message };

      await this.prisma.dataPurchase.update({
        where: { id: dataPurchase.id },
        data: {
          status: 'FAILED',
          response: errorResponse,
        },
      });

      throw new Error(
        errorResponse?.error?.[0] ||
          errorResponse?.message ||
          'Data purchase failed',
      );
    }
  }

  async getallDataTransaction(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://datastationapi.com/api/data/', {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Husmod API Error:', {
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
        this.httpService.get(`https://datastationapi.com/api/data/${id}`, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Husmond API Error:', {
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
        this.httpService.get(
          `https://datastationapi.com/api/billpayment/${id}`,
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
      console.error('Husmod API Error:', {
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
        this.httpService.get(`https://datastationapi.com/api/cablesub/${id}`, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Husmod API Error:', {
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
          `https://datastationapi.com/api/validateiuc?smart_card_number=${iuc}& &cablename=${id}`,
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
      console.error('Husmod API Error:', {
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
        this.httpService.get('https://datastationapi.com/api/data/', {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Husmod API Error:', {
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
          'https://datastationapi.com/api/Airtime_funding',
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
      console.error('Husmod API Error:', {
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
        this.httpService.post(
          'https://datastationapi.com/api/cablesub/',
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
      console.error('Husmod API Error:', {
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
        this.httpService.post('https://datastationapi.com/api/epin/', data, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Husmod API Error:', {
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
          'https://datastationapi.com/api/rechargepin',
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
      console.error('Husmod API Error:', {
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
        this.httpService.post('https://datastationapi.com/api/topup', data, {
          headers: {
            Authorization: `Token ${process.env.HUSMOD_API_KEY}`,
          },
        }),
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Husmod API Error:', {
        message: error?.message,
        responseData: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack,
      });

      throw error;
    }
  }
}
