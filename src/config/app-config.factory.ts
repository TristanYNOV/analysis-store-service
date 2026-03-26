import { registerAs } from '@nestjs/config';
import { buildAppConfig } from './app-config.validation';

export const appConfig = registerAs('app', () => buildAppConfig(process.env));
