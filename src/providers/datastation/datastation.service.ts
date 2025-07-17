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

@Injectable()
export class DataStationService {
  constructor(private readonly httpService: HttpService) {}

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

  async buyData(data: DataStationDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://datastationapi.com/api/data/', data, {
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
