import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL', '');
  }

  get dbName(): string {
    return this.configService.get<string>('DB_NAME', 'analysis_store');
  }

  get masterKey(): string {
    return this.configService.get<string>('MASTER_KEY', 'change-me');
  }

  get cryptoKeyVersion(): string {
    return this.configService.get<string>('CRYPTO_KEY_VERSION', 'v1');
  }
}
