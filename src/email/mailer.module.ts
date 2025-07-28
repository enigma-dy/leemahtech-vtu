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

      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: 25,
          secure: false,
          // auth: {
          //   user: configService.get<string>('MAIL_USER'),
          //   pass: configService.get<string>('MAIL_PASSWORD'),
          // },
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('MAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
    }),
  ],
  providers: [EmailService, UserCreatedListener],
  exports: [EmailService],
})
export class EmailModule {}
