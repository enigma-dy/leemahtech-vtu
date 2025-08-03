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
          baseUrl: 'https://datastationapi.com/api',
          token: this.configService.get('DataStation_API_KEY'),
        };
      case 'husmodata':
        return {
          baseUrl: 'https://husmodataapi.com',
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
}
