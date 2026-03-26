import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class HealthService {
  constructor(private readonly appConfig: AppConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'analysis-store-service',
      env: this.appConfig.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }
}
