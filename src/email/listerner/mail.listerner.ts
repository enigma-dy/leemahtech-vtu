import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../mail.service';
import { DataPurchaseEvent, EmailEvent, OpayEvent } from '../events/mail.event';
import { name } from 'ejs';

@Injectable()
export class UserCreatedListener {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent('user.created')
  async handleUserCreatedEvent(event: EmailEvent) {
    await this.emailService.sendWelcomeEmail(
      event.email,
      event.name,
      event.meta?.token,
    );
  }

  @OnEvent('OpayFunding')
  async handleSendOpayReciept(event: OpayEvent) {
    await this.emailService.sendOpayReciept(
      event.to,
      event.name,
      event.amount,
      event.txRef,
    );
  }

  @OnEvent('data.purchase')
  async handleDataPurchase(event: DataPurchaseEvent) {
    await this.emailService.sendDataPurchaseReceipt(
      event.to,
      event.name,
      event.network,
      event.planName,
      event.planSize,
      event.phone,
      event.amount,
      event.txRef,
    );
  }
}
