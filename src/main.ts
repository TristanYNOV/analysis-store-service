import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { setupMetrics } from './observability/metrics';
import { httpMetricsFallbackMiddleware } from './observability/http-metrics-fallback.middleware';

const API_PREFIX = 'api';
setupMetrics();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix(API_PREFIX, { exclude: ['metrics'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.use(httpMetricsFallbackMiddleware);

  await app.listen(configService.port);

  logger.log(
    `analysis-store-service started on ${await app.getUrl()} (env: ${configService.nodeEnv})`,
  );
  logger.log(`Health endpoint: /${API_PREFIX}/health`);
}

bootstrap();
