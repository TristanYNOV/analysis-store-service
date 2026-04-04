import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DbService } from '../src/db/db.service';

describe('Health and imports endpoints (e2e)', () => {
  let app: INestApplication;

  const validPanelPayload = {
    schemaVersion: '1.0.0',
    type: 'sequencer-panel',
    panelName: 'Panel From UI',
    meta: {
      createdAtIso: '2026-04-04T08:00:00Z',
      updatedAtIso: '2026-04-04T08:30:00Z',
      exportedAtIso: '2026-04-04T09:00:00+00:00',
      sourceUserId: null,
      sourceApp: 'analysis-store-service',
      sourceAppVersion: '1.0.0',
    },
    btnList: [
      {
        id: 'btn-evt',
        name: 'Goal',
        type: 'event',
        eventProps: { eventName: 'Goal', colorHex: '#00FFAA' },
        layout: { x: 0, y: 0, w: 2, h: 1, z: 0 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: ['btn-stat'],
      },
      {
        id: 'btn-label',
        name: 'Phase',
        type: 'label',
        labelProps: { label: 'Phase 1', colorHex: '#112233' },
        layout: { x: 2, y: 0, w: 2, h: 1, z: 1 },
        hotkeyNormalized: null,
        deactivateIds: ['btn-evt'],
        activateIds: [],
      },
      {
        id: 'btn-stat',
        name: 'Possession',
        type: 'stat',
        stat: { statName: 'possession', value: 55, colorHex: '#445566' },
        layout: { x: 4, y: 0, w: 2, h: 1, z: 2 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: [],
      },
    ],
  };

  const validTimelinePayload = {
    schemaVersion: '1.0.0',
    type: 'analysis-timeline',
    timelineName: 'Timeline From UI',
    meta: {
      createdAtIso: '2026-04-04T08:00:00Z',
      updatedAtIso: '2026-04-04T08:30:00Z',
      exportedAtIso: '2026-04-04T09:00:00+00:00',
      sourceUserId: null,
      sourceApp: 'analysis-store-service',
      sourceAppVersion: '1.0.0',
    },
    eventDefs: [{ id: 'evt-1', name: 'Goal', colorHex: '#00FFAA' }],
    labelDefs: [{ id: 'lbl-1', name: 'Phase', colorHex: '#112233' }],
    occurrences: [
      {
        id: 'occ-1',
        eventDefId: 'evt-1',
        labelDefId: null,
        occurredAtIso: '2026-04-04T08:10:00+00:00',
        durationMs: 3000,
        note: null,
      },
    ],
    ui: {
      zoom: 1,
      showLabels: true,
      selectedOccurrenceId: 'occ-1',
    },
  };

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

  it('/api/imports/panels/validate (POST) validates panel payload on proper endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/imports/panels/validate')
      .send(validPanelPayload)
      .expect(201);

    expect(response.body).toMatchObject({
      valid: true,
      detectedType: 'sequencer-panel',
      schemaVersion: '1.0.0',
      summary: {
        panelName: 'Panel From UI',
        buttonCount: 3,
      },
      errors: [],
    });
  });

  it('/api/imports/timelines/validate (POST) validates timeline payload on proper endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/imports/timelines/validate')
      .send(validTimelinePayload)
      .expect(201);

    expect(response.body).toMatchObject({
      valid: true,
      detectedType: 'analysis-timeline',
      schemaVersion: '1.0.0',
      summary: {
        timelineName: 'Timeline From UI',
        occurrenceCount: 1,
      },
      errors: [],
    });
  });

  it('rejects panel payload on timeline endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/imports/timelines/validate')
      .send(validPanelPayload)
      .expect(201);

    expect(response.body).toMatchObject({
      valid: false,
      detectedType: 'sequencer-panel',
      errors: [{ code: 'TYPE_MISMATCH', path: ['type'] }],
    });
  });

  it('rejects timeline payload on panel endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/imports/panels/validate')
      .send(validTimelinePayload)
      .expect(201);

    expect(response.body).toMatchObject({
      valid: false,
      detectedType: 'analysis-timeline',
      errors: [{ code: 'TYPE_MISMATCH', path: ['type'] }],
    });
  });

  it('returns readable errors on invalid payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/imports/panels/validate')
      .send({
        schemaVersion: '1.0.0',
        type: 'sequencer-panel',
        panelName: '',
        meta: {},
        btnList: [],
      })
      .expect(201);

    expect(response.body.valid).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.errors[0]).toEqual(
      expect.objectContaining({
        code: 'invalid_payload',
        path: expect.any(Array),
        message: expect.any(String),
      }),
    );
  });

  it('does not trigger database persistence while validating imports', async () => {
    const dbService = app.get(DbService);
    const executeSpy = jest.spyOn(dbService.db, 'execute');

    await request(app.getHttpServer()).post('/api/imports/timelines/validate').send(validTimelinePayload).expect(201);

    await request(app.getHttpServer()).post('/api/imports/panels/validate').send(validPanelPayload).expect(201);

    expect(executeSpy).not.toHaveBeenCalled();
  });
});
