import { Controller, Post, Body, Get } from '@nestjs/common';
import { ProviderSettingService } from './provider.service';
import { SetSmeProviderDto } from './dto/provider.dto';

@Controller('sme-provider')
export class SmeProviderController {
  constructor(private readonly providerService: ProviderSettingService) {}

  @Get()
  async getProvider() {
    return await this.providerService.getActiveProvider();
  }

  @Post('set-provider')
  async setProvider(@Body() dto: SetSmeProviderDto) {
    await this.providerService.setActiveProvider(dto);
    return { message: `Active provider set to ${dto.provider}` };
  }
}
