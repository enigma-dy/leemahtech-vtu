import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'body-parser';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { VtuTelegramBotService } from './telegram-bot/bot.service';
import { MetricsService } from './metrics/metrics.service';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalFilters(new AllExceptionsFilter());

  const botService = app.get(VtuTelegramBotService);
  botService.appRef = app;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

  app.use(helmet());
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
