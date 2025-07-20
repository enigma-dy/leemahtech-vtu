import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';

import { FlutterwaveService, FlutterwaveWebhookEvent } from './flutter.service';

@Controller('flutter')
export class FlutterwaveController {
  constructor(private readonly flutterwaveService: FlutterwaveService) {}

  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const event = req.body as FlutterwaveWebhookEvent;
    return await this.flutterwaveService.handleWebhook(event);
  }
}
