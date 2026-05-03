import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

const ownerHeaders = { 'x-auth-user-id': 'owner-user', 'x-auth-club-ids': 'club-1' };
const otherHeaders = { 'x-auth-user-id': 'other-user', 'x-auth-club-ids': 'club-2' };

const timelineContent = {
  schemaVersion: '1.0.0',
  type: 'analysis-timeline',
  timelineName: 'Timeline e2e',
  meta: { createdAtIso: '2026-01-01T00:00:00Z', updatedAtIso: '2026-01-01T00:00:00Z', exportedAtIso: '2026-01-01T00:00:00Z', sourceUserId: null, sourceApp: 'analysis-store-service', sourceAppVersion: '1.0.0' },
  eventDefs: [{ id: 'evt-1', name: 'Goal', colorHex: '#ffffff' }],
  labelDefs: [],
  occurrences: [{ id: 'occ-1', eventDefId: 'evt-1', labelDefId: null, occurredAtIso: '2026-01-01T00:00:01Z', durationMs: 1000, note: null }],
  ui: { zoom: 1, showLabels: true, selectedOccurrenceId: null },
};

const panelContent = {
  schemaVersion: '1.0.0',
  type: 'sequencer-panel',
  panelName: 'Panel e2e',
  meta: { createdAtIso: '2026-01-01T00:00:00Z', updatedAtIso: '2026-01-01T00:00:00Z', exportedAtIso: '2026-01-01T00:00:00Z', sourceUserId: null, sourceApp: 'analysis-store-service', sourceAppVersion: '1.0.0' },
  btnList: [{ id: 'btn-1', name: 'event', type: 'event', eventProps: { eventName: 'Goal', colorHex: '#00ff00' }, layout: { x: 0, y: 0, w: 1, h: 1, z: 0 }, hotkeyNormalized: null, deactivateIds: [], activateIds: [] }],
};

describe('Timelines and panels ownership/visibility (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('timelines enforce owner-only read/update/delete/export', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/timelines')
      .set(ownerHeaders)
      .send({ title: 'owner timeline', contentJson: timelineContent, hasAnonymizedContent: false })
      .expect(201);

    const id = created.body.id as string;

    await request(app.getHttpServer()).get('/api/timelines').set(ownerHeaders).expect(200);
    await request(app.getHttpServer()).get(`/api/timelines/${id}`).set(ownerHeaders).expect(200);
    await request(app.getHttpServer()).get(`/api/timelines/${id}/export`).set(ownerHeaders).expect(200);

    await request(app.getHttpServer()).get(`/api/timelines/${id}`).set(otherHeaders).expect(403);
    await request(app.getHttpServer()).get(`/api/timelines/${id}/export`).set(otherHeaders).expect(403);

    await request(app.getHttpServer())
      .patch(`/api/timelines/${id}`)
      .set(ownerHeaders)
      .send({ title: 'updated timeline' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/timelines/${id}`)
      .set(otherHeaders)
      .send({ title: 'forbidden update' })
      .expect(403);

    await request(app.getHttpServer()).delete(`/api/timelines/${id}`).set(otherHeaders).expect(403);
    await request(app.getHttpServer()).delete(`/api/timelines/${id}`).set(ownerHeaders).expect(204);
    await request(app.getHttpServer()).get(`/api/timelines/${id}`).set(ownerHeaders).expect(404);
    await request(app.getHttpServer()).get('/api/timelines/not-a-uuid').set(ownerHeaders).expect(400);
  });

  it('panels enforce private/public visibility and ownership', async () => {
    const privatePanel = await request(app.getHttpServer())
      .post('/api/panels')
      .set(ownerHeaders)
      .send({ title: 'private panel', contentJson: panelContent, hasAnonymizedContent: false })
      .expect(201);

    expect(privatePanel.body.visibility).toBe('private');

    const publicPanel = await request(app.getHttpServer())
      .post('/api/panels')
      .set(ownerHeaders)
      .send({ title: 'public panel', visibility: 'public', contentJson: panelContent, hasAnonymizedContent: false })
      .expect(201);

    const privateId = privatePanel.body.id as string;
    const publicId = publicPanel.body.id as string;

    await request(app.getHttpServer()).get(`/api/panels/${privateId}`).set(otherHeaders).expect(403);
    await request(app.getHttpServer()).get(`/api/panels/${publicId}`).set(otherHeaders).expect(200);
    await request(app.getHttpServer()).get(`/api/panels/${publicId}/export`).set(otherHeaders).expect(200);

    await request(app.getHttpServer())
      .patch(`/api/panels/${publicId}`)
      .set(ownerHeaders)
      .send({ title: 'public panel updated' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/panels/${publicId}`)
      .set(otherHeaders)
      .send({ title: 'forbidden update' })
      .expect(403);

    await request(app.getHttpServer()).delete(`/api/panels/${publicId}`).set(otherHeaders).expect(403);
    await request(app.getHttpServer()).delete(`/api/panels/${publicId}`).set(ownerHeaders).expect(204);
    await request(app.getHttpServer()).get(`/api/panels/${publicId}`).set(ownerHeaders).expect(404);
    await request(app.getHttpServer()).get('/api/panels/not-a-uuid').set(ownerHeaders).expect(400);
  });
});
