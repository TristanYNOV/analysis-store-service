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

describe('Panels and timelines redacted reads/exports (e2e)', () => {
  let app: INestApplication;

  const ownerHeaders = {
    'x-auth-user-id': 'user-owner',
    'x-auth-club-ids': 'club-1,club-2',
  };

  const panelReaderHeaders = {
    'x-auth-user-id': 'user-reader',
    'x-auth-club-ids': 'club-1',
  };

  const externalHeaders = {
    'x-auth-user-id': 'user-external',
    'x-auth-club-ids': 'club-9',
  };

  const redactedPanelPayload = {
    schemaVersion: '1.0.0',
    type: 'sequencer-panel',
    panelName: 'Sensitive panel',
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
        id: 'btn-event',
        name: 'henry',
        isAnonymized: true,
        eventProps: { eventName: 'henry', colorHex: '#00FFAA' },
        layout: { x: 0, y: 0, w: 2, h: 1, z: 0 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: [],
      },
      {
        id: 'btn-label',
        name: 'Phase',
        type: 'label',
        anonymized: true,
        labelProps: { label: 'Phase 1', colorHex: '#112233' },
        layout: { x: 2, y: 0, w: 2, h: 1, z: 1 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: [],
      },
      {
        id: 'btn-stat',
        name: 'Possession',
        type: 'stat',
        anonymizedFlag: true,
        stat: { statName: 'possession', value: 55, colorHex: '#445566' },
        layout: { x: 4, y: 0, w: 2, h: 1, z: 2 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: [],
      },
    ],
  };

  const timelinePayload = {
    schemaVersion: '1.0.0',
    type: 'analysis-timeline',
    timelineName: 'Owner timeline',
    meta: {
      createdAtIso: '2026-04-04T08:00:00Z',
      updatedAtIso: '2026-04-04T08:30:00Z',
      exportedAtIso: '2026-04-04T09:00:00+00:00',
      sourceUserId: null,
      sourceApp: 'analysis-store-service',
      sourceAppVersion: '1.0.0',
    },
    eventDefs: [{ id: 'evt-1', name: 'Goal', colorHex: '#00FFAA', isAnonymized: true }],
    labelDefs: [{ id: 'lbl-1', name: 'Phase', colorHex: '#112233' }],
    occurrences: [
      {
        id: 'occ-1',
        eventDefId: 'evt-1',
        labelDefId: null,
        occurredAtIso: '2026-04-04T08:10:00+00:00',
        durationMs: 3000,
        note: 'Visible for owner only',
      },
    ],
    ui: { zoom: 1, showLabels: true, selectedOccurrenceId: 'occ-1' },
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
    await app.close();
  });

  it('export timeline by owner succeeds and non-owner is forbidden', async () => {
    const createdTimeline = await request(app.getHttpServer())
      .post('/api/timelines')
      .set(ownerHeaders)
      .send({
        title: 'Timeline export owner',
        contentJson: timelinePayload,
        hasAnonymizedContent: true,
      })
      .expect(201);

    const timelineId = createdTimeline.body.id as string;

    const ownerExport = await request(app.getHttpServer())
      .get(`/api/timelines/${timelineId}/export`)
      .set(ownerHeaders)
      .expect(200);

    expect(ownerExport.body).toEqual(timelinePayload);

    await request(app.getHttpServer())
      .get(`/api/timelines/${timelineId}/export`)
      .set(panelReaderHeaders)
      .expect(403);
  });

  it('panel exports follow access rules and redact for authorized non-owner readers', async () => {
    const privatePanel = await request(app.getHttpServer())
      .post('/api/panels')
      .set(ownerHeaders)
      .send({
        title: 'Private panel',
        visibility: 'private',
        contentJson: redactedPanelPayload,
        hasAnonymizedContent: true,
      })
      .expect(201);

    const publicPanel = await request(app.getHttpServer())
      .post('/api/panels')
      .set(ownerHeaders)
      .send({
        title: 'Public panel',
        visibility: 'public',
        contentJson: redactedPanelPayload,
        hasAnonymizedContent: true,
      })
      .expect(201);

    const clubPanel = await request(app.getHttpServer())
      .post('/api/panels')
      .set(ownerHeaders)
      .send({
        title: 'Club panel',
        visibility: 'club',
        clubId: 'club-1',
        contentJson: redactedPanelPayload,
        hasAnonymizedContent: true,
      })
      .expect(201);

    const privatePanelId = privatePanel.body.id as string;
    const publicPanelId = publicPanel.body.id as string;
    const clubPanelId = clubPanel.body.id as string;

    const ownerPrivateExport = await request(app.getHttpServer())
      .get(`/api/panels/${privatePanelId}/export`)
      .set(ownerHeaders)
      .expect(200);
    expect(ownerPrivateExport.body).toEqual(redactedPanelPayload);

    const ownerPublicExport = await request(app.getHttpServer())
      .get(`/api/panels/${publicPanelId}/export`)
      .set(ownerHeaders)
      .expect(200);
    expect(ownerPublicExport.body).toEqual(redactedPanelPayload);

    const nonOwnerPublicExport = await request(app.getHttpServer())
      .get(`/api/panels/${publicPanelId}/export`)
      .set(panelReaderHeaders)
      .expect(200);

    const nonOwnerPublicGet = await request(app.getHttpServer())
      .get(`/api/panels/${publicPanelId}`)
      .set(panelReaderHeaders)
      .expect(200);

    expect(nonOwnerPublicExport.body).toEqual(nonOwnerPublicGet.body.contentJson);
    const firstButton = nonOwnerPublicExport.body.btnList[0] as Record<string, unknown>;
    expect(firstButton.name).toBe('Event anonymized 1');
    expect((firstButton.eventProps as Record<string, unknown>).eventName).toBe('Event anonymized 1');
    expect(nonOwnerPublicExport.body.panelName).toBe('Sensitive panel');

    const nonOwnerList = await request(app.getHttpServer())
      .get('/api/panels')
      .set(panelReaderHeaders)
      .expect(200);
    const listedPublicPanel = (nonOwnerList.body as Array<Record<string, unknown>>).find(
      (resource) => resource.id === publicPanelId,
    ) as Record<string, unknown>;
    const listedPublicFirstButton = ((listedPublicPanel.contentJson as Record<string, unknown>).btnList as Array<
      Record<string, unknown>
    >)[0] as Record<string, unknown>;
    expect(listedPublicFirstButton.name).toBe('Event anonymized 1');
    expect((listedPublicFirstButton.eventProps as Record<string, unknown>).eventName).toBe('Event anonymized 1');

    const nonOwnerClubExport = await request(app.getHttpServer())
      .get(`/api/panels/${clubPanelId}/export`)
      .set(panelReaderHeaders)
      .expect(200);
    expect((nonOwnerClubExport.body.btnList[0].eventProps as Record<string, unknown>).eventName).toBe(
      'Event anonymized 1',
    );
    expect((nonOwnerClubExport.body.btnList[1].labelProps as Record<string, unknown>).label).toBe(
      'Label anonymized 1',
    );
    expect((nonOwnerClubExport.body.btnList[2].stat as Record<string, unknown>).statName).toBe(
      'Stat anonymized 1',
    );

    await request(app.getHttpServer())
      .get(`/api/panels/${clubPanelId}/export`)
      .set(externalHeaders)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/panels/${privatePanelId}/export`)
      .set(externalHeaders)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/panels/${privatePanelId}`)
      .set(externalHeaders)
      .expect(403);
  });

  it('panel export keeps backend v1 structure valid and does not persist writes', async () => {
    const createdPanel = await request(app.getHttpServer())
      .post('/api/panels')
      .set(ownerHeaders)
      .send({
        title: 'Public panel for validation',
        visibility: 'public',
        contentJson: redactedPanelPayload,
        hasAnonymizedContent: true,
      })
      .expect(201);

    const panelId = createdPanel.body.id as string;

    const beforeRead = await request(app.getHttpServer())
      .get(`/api/panels/${panelId}`)
      .set(ownerHeaders)
      .expect(200);

    const exported = await request(app.getHttpServer())
      .get(`/api/panels/${panelId}/export`)
      .set(panelReaderHeaders)
      .expect(200);

    await request(app.getHttpServer()).post('/api/imports/panels/validate').send(exported.body).expect(201);

    const afterRead = await request(app.getHttpServer())
      .get(`/api/panels/${panelId}`)
      .set(ownerHeaders)
      .expect(200);

    expect(beforeRead.body.updatedAt).toBe(afterRead.body.updatedAt);
  });
});
