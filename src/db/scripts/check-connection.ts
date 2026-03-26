import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DbService } from '../db.service';

async function run(): Promise<void> {
  const logger = new Logger('DbCheck');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const dbService = app.get(DbService);
    await dbService.checkConnection();
    logger.log('Database connection OK.');
  } finally {
    await app.close();
  }
}

run().catch((error: unknown) => {
  const logger = new Logger('DbCheck');
  logger.error('Database connection failed.', error);
  process.exitCode = 1;
});
