import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [AppConfigModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
