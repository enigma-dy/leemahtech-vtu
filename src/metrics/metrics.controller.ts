import { Controller, Get, Header, Res } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Response } from 'express';
import { Public } from 'src/decorators/auth.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain');
    res.send(await this.metricsService.getMetrics());
  }
}
