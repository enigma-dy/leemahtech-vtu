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
        const host = configService.get<string>('SMTP_HOST', 'mailpit');
        const port = Number(configService.get<number>('SMTP_PORT', 1025));

        return {
          transport: {
            host: configService.get<string>('SMTP_HOST', 'mailpit'),
            port: port,
            secure: false,
            ignoreTLS: true,
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: `"No Reply" <${configService.get<string>('MAIL_FROM', 'noreply@leemah.com')}>`,
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
