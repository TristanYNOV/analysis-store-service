import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig, NodeEnv } from './app-config.types';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  private get appConfig(): AppConfig {
    return this.configService.getOrThrow<AppConfig>('app', { infer: true });
  }

  get nodeEnv(): NodeEnv {
    return this.appConfig.nodeEnv;
  }

  get port(): number {
    return this.appConfig.port;
  }

  get databaseUrl(): string {
    return this.appConfig.databaseUrl;
  }

  get dbName(): string {
    return this.appConfig.dbName;
  }

  get masterKey(): string {
    return this.appConfig.masterKey;
  }

  get cryptoKeyVersion(): string {
    return this.appConfig.cryptoKeyVersion;
  }
}
