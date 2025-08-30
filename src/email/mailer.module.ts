import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserCreatedListener } from './listerner/mail.listerner';
import { EmailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>(
          'SMTP_HOST',
          'email-smtp.eu-north-1.amazonaws.com',
        );
        const port = Number(configService.get<number>('SMTP_PORT', 587));

        return {
          transport: {
            host,
            port,
            secure: port === 465,
            auth: {
              user: configService.get<string>('SMTP_USER'),
              pass: configService.get<string>('SMTP_PASS'),
            },
          },
          defaults: {
            from: `"No Reply" <${configService.get<string>('MAIL_FROM', 'no-reply@myco.com.ng')}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
    }),
  ],
  providers: [EmailService, UserCreatedListener],
  exports: [EmailService],
})
export class EmailModule {}
