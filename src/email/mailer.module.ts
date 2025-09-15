import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SESClient } from '@aws-sdk/client-ses';
import { EmailService } from './mail.service';
import { UserCreatedListener } from './listerner/mail.listerner';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailService,
    UserCreatedListener,
    {
      provide: 'SES_CLIENT',
      useFactory: (configService: ConfigService) => {
        const region = configService.get<string>('AWS_REGION', 'eu-north-1');
        const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        );

        if (!accessKeyId || !secretAccessKey) {
          throw new Error(
            'AWS credentials (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY) are missing',
          );
        }

        return new SESClient({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
