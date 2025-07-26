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

@Injectable()
export class DataStationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
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

  async buyData(userId: string, data: DataStationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet || user.wallet.balance < data.price) {
      throw new Error('Insufficient wallet balance');
    }

    // Step 1: Create Ledger
    const ledger = await this.prisma.ledger.create({
      data: {
        description: `Buy Data - ${data.plan}`,
        createdBy: userId,
      },
    });

    // Step 2: Debit User Wallet Entry
    await this.prisma.entry.create({
      data: {
        walletId: user.wallet.id,
        ledgerId: ledger.id,
        amount: data.price,
        type: 'DEBIT',
      },
    });

    // Step 3: Create Transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        txRef: `TX-${Date.now()}`,
        userId,
        amount: data.price,
        walletId: user.wallet.id,
        status: 'PENDING',
        channel: 'App',
        provider: 'datastation',
      },
    });

    // Step 4: Create DataPurchase
    const dataPurchase = await this.prisma.dataPurchase.create({
      data: {
        userId,
        network: data.network,
        planName: data.plan,
        planSize: data.plan_size,
        planVolume: data.plan_volume,
        amount: data.price,
        status: 'PENDING',
      },
    });

    try {
      // Step 5: Call API
      const { price, ...planDetails } = data;
      const response = await firstValueFrom(
        this.httpService.post(
          'https://datastationapi.com/api/data/',
          planDetails,
          {
            headers: {
              Authorization: `Token ${process.env.DataStation_API_KEY}`,
            },
          },
        ),
      );

      console.log(response);

      // Step 6: Update Records on Success
      // await Promise.all([
      //   this.prisma.dataPurchase.update({
      //     where: { id: dataPurchase.id },
      //     data: {
      //       status: 'SUCCESS',
      //       response: response.data,
      //     },
      //   }),
      //   this.prisma.transaction.update({
      //     where: { id: transaction.id },
      //     data: {
      //       status: 'SUCCESS',
      //       completedAt: new Date(),
      //     },
      //   }),
      // ]);

      // return response.data;
    } catch (error) {
      // Step 7: Update Records on Failure
      // await Promise.all([
      //   this.prisma.dataPurchase.update({
      //     where: { id: dataPurchase.id },
      //     data: {
      //       status: 'FAILED',
      //       response: error?.response?.data || { message: error.message },
      //     },
      //   }),
      //   this.prisma.transaction.update({
      //     where: { id: transaction.id },
      //     data: {
      //       status: 'FAILED',
      //       errorMessage: error.message,
      //     },
      //   }),
      // ]);

      throw error;
    }
  }

  async getallDataTransaction(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://datastationapi.com/api/data/', {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
        this.httpService.get(`https://datastationapi.com/api/data/${id}`, {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
        this.httpService.get(
          `https://datastationapi.com/api/billpayment/${id}`,
          {
            headers: {
              Authorization: `Token ${process.env.DataStation_API_KEY}`,
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

  async queryCableSub(id: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://datastationapi.com/api/cablesub/${id}`, {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
          `https://datastationapi.com/api/validateiuc?smart_card_number=${iuc}& &cablename=${id}`,
          {
            headers: {
              Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
        this.httpService.get('https://datastationapi.com/api/data/', {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
          'https://datastationapi.com/api/Airtime_funding',
          data,
          {
            headers: {
              Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
        this.httpService.post(
          'https://datastationapi.com/api/cablesub/',
          data,
          {
            headers: {
              Authorization: `Token ${process.env.DataStation_API_KEY}`,
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

  async buyResultCheckerPin(data: ExamPinPurchaseDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://datastationapi.com/api/epin/', data, {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
          'https://datastationapi.com/api/rechargepin',
          data,
          {
            headers: {
              Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
        this.httpService.post('https://datastationapi.com/api/topup', data, {
          headers: {
            Authorization: `Token ${process.env.DataStation_API_KEY}`,
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
