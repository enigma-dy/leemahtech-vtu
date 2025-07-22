import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../mail.service';
import { EmailEvent } from '../events/mail.event';

@Injectable()
export class UserCreatedListener {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent('user.created')
  async handleUserCreatedEvent(event: EmailEvent) {
    await this.emailService.sendWelcomeEmail(event.email, event.name);
  }
}
