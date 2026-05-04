import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app-config.factory';
import { AppConfigModule } from './config/app-config.module';
import { HealthModule } from './modules/health/health.module';
import { TimelinesModule } from './modules/timelines/timelines.module';
import { PanelsModule } from './modules/panels/panels.module';
import { ImportsModule } from './modules/imports/imports.module';
import { SecurityModule } from './modules/security/security.module';
import { EventsModule } from './modules/events/events.module';
import { DbModule } from './db/db.module';
import { MetricsController } from './observability/metrics.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpMetricsInterceptor } from './observability/http-metrics.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    AppConfigModule,
    DbModule,
    HealthModule,
    TimelinesModule,
    PanelsModule,
    ImportsModule,
    SecurityModule,
    EventsModule,
  ],
  controllers: [MetricsController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class AppModule {}
