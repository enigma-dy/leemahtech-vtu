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
              Authorization: `Token ${process.env.DataStation_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      console.log('secondhere');
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
      const errorResponse = error?.response?.data || { message: error.message };

      // Update DB records
      await Promise.all([
        this.prisma.dataPurchase.update({
          where: { id: dataPurchase.id },
          data: {
            status: 'FAILED',
            response: errorResponse,
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

      // Throw a sanitized error to avoid dumping Axios internals
      throw new Error(
        errorResponse?.error?.[0] ||
          errorResponse?.message ||
          'Data purchase failed',
      );
    }
  }
}
