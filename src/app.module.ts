import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigModule } from './config/app-config.module';
import { HealthModule } from './modules/health/health.module';
import { TimelinesModule } from './modules/timelines/timelines.module';
import { PanelsModule } from './modules/panels/panels.module';
import { ImportsModule } from './modules/imports/imports.module';
import { SecurityModule } from './modules/security/security.module';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    HealthModule,
    TimelinesModule,
    PanelsModule,
    ImportsModule,
    SecurityModule,
    EventsModule,
  ],
})
export class AppModule {}
