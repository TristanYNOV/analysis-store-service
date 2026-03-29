import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/health (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'analysis-store-service',
    });
  });

  it('/api/security/context (GET) requires x-auth-user-id', async () => {
    await request(app.getHttpServer()).get('/api/security/context').expect(401);
  });

  it('/api/security/context (GET) returns parsed context when headers are present', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/security/context')
      .set('x-auth-user-id', 'user-123')
      .set('x-auth-club-ids', 'club-1, club-2')
      .set('x-auth-roles', '["analyst","reader"]')
      .expect(200);

    expect(response.body).toMatchObject({
      userId: 'user-123',
      clubIds: ['club-1', 'club-2'],
      roles: ['analyst', 'reader'],
    });
  });
});
