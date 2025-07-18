import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { SetSmeProviderDto } from './dto/provider.dto';

@Injectable()
export class ProviderSettingService {
  constructor(private prisma: PrismaService) {}

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
