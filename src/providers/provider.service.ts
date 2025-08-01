import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { SetSmeProviderDto } from './dto/provider.dto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProviderService {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private getProviderConfig(provider: string) {
    switch (provider) {
      case 'datastation':
        return {
          baseUrl: this.configService.get('https://datastationapi.com/api'),
          token: this.configService.get('DataStation_API_KEY'),
        };
      case 'husmodata':
        return {
          baseUrl: this.configService.get('HUSMOD_URL'),
          token: this.configService.get('HUSMOD_TOKEN'),
        };
      case 'direct':
        throw new Error('Direct provider is not yet implemented');
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async getActiveProvider(): Promise<string> {
    const setting = await this.prisma.providerSetting.findUnique({
      where: { id: 1 },
    });
    return setting?.activeProvider || 'datastation';
  }

  async setActiveProvider(dto: SetSmeProviderDto): Promise<void> {
    await this.prisma.providerSetting.upsert({
      where: { id: 1 },
      update: { activeProvider: dto.provider },
      create: {
        id: 1,
        activeProvider: dto.provider,
      },
    });
  }

  async sendAirtime(network_id: number, amount: number, phone: string) {
    const activeProvider = await this.getActiveProvider();
    const { baseUrl, token } = this.getProviderConfig(activeProvider);

    const url = `${baseUrl}/topup`;
    const data = {
      network: network_id,
      amount,
      mobile_number: phone,
      Ported_number: true,
      airtime_type: 'VTU',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          maxBodyLength: Infinity,
        }),
      );

      return response.data;
    } catch (err) {
      console.error(err.response?.data || err.message);
      throw new Error('Airtime purchase failed');
    }
  }

  async sendBillPayment(
    disco_name: string,
    amount: number,
    meter_number: string,
    MeterType: number,
  ) {
    const activeProvider = await this.getActiveProvider();
    const { baseUrl, token } = this.getProviderConfig(activeProvider);

    const url = `${baseUrl}/billpayment`;
    const data = {
      disco_name,
      amount,
      meter_number,
      MeterType,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (err) {
      console.error(err.response?.data || err.message);
      throw new Error('Bill payment failed');
    }
  }

  async subscribeCable(
    cablename: number,
    cableplan: number,
    smart_card_number: string,
  ) {
    const activeProvider = await this.getActiveProvider();
    const { baseUrl, token } = this.getProviderConfig(activeProvider);

    const url = `${baseUrl}/cablesub/`;
    const data = {
      cablename,
      cableplan,
      smart_card_number,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (err) {
      console.error(err.response?.data || err.message);
      throw new Error('Cable subscription failed');
    }
  }

  async getRechargePin(
    network: number,
    network_amount: number,
    quantity: number,
    name_on_card: string,
  ) {
    const activeProvider = await this.getActiveProvider();
    const { baseUrl, token } = this.getProviderConfig(activeProvider);

    if (activeProvider !== 'datastation') {
      throw new Error(
        'This feature is only available for the datastation provider.',
      );
    }

    const url = `${baseUrl}/rechargepin/`;
    const data = {
      network,
      network_amount,
      quantity,
      name_on_card,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (err) {
      console.error(err.response?.data || err.message);
      throw new Error('Recharge pin purchase failed');
    }
  }

  async getExamPin(exam_name: string, quantity: number) {
    const activeProvider = await this.getActiveProvider();
    const { baseUrl, token } = this.getProviderConfig(activeProvider);

    if (activeProvider !== 'datastation') {
      throw new Error(
        'This feature is only available for the datastation provider.',
      );
    }

    const url = `${baseUrl}/epin/`;
    const data = {
      exam_name,
      quantity,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (err) {
      console.error(err.response?.data || err.message);
      throw new Error('Exam pin purchase failed');
    }
  }

  async queryDataPlan(id: number) {
    const activeProvider = await this.getActiveProvider();
    const { baseUrl, token } = this.getProviderConfig(activeProvider);

    const url = `${baseUrl}/data/${id}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Token ${token}`,
          },
        }),
      );

      return response.data;
    } catch (err) {
      console.error(err.response?.data || err.message);
      throw new Error('Failed to fetch data plan');
    }
  }
}
