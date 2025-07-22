import { Controller, Post, Req, Res, HttpCode, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import { VtuTelegramBotService } from './bot.service';

@Controller('telegram-webhook')
export class TelegramWebhookController {
  constructor(private readonly telegramBotService: VtuTelegramBotService) {}

  @Post()
  async handleUpdate(@Body() body: any, @Req() req: Request) {
    // You might want to verify the request comes from Telegram here
    return console.log(body);
  }
}
