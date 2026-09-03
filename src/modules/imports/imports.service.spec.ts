import { ImportsService } from './imports.service';

describe('ImportsService', () => {
  const service = new ImportsService();

  const validTimeline = {
    schemaVersion: '1.0.0',
    type: 'analysis-timeline',
    timelineName: 'Timeline Alpha',
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

  const validPanel = {
    schemaVersion: '1.0.0',
    type: 'sequencer-panel',
    panelName: 'Panel Beta',
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
        eventProps: { eventName: 'Goal', colorHex: '#00FFAA', kind: 'indefinite', preMs: 1000, postMs: 2000 },
        layout: { x: 0, y: 0, w: 2, h: 1, z: 0 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: ['btn-stat'],
      },
      {
        id: 'btn-label',
        name: 'Phase',
        type: 'label',
        isAnonymized: true,
        labelProps: { label: 'Phase 1', colorHex: '#112233', mode: 'indefinite' },
        layout: { x: 2, y: 0, w: 2, h: 1, z: 1 },
        hotkeyNormalized: null,
        deactivateIds: ['btn-evt'],
        activateIds: [],
      },
      {
        id: 'btn-stat',
        name: 'Possession',
        type: 'stat',
        stat: {
          statName: 'possession',
          value: 55,
          colorHex: '#445566',
          definition: {
            mode: 'simple',
            query: {
              eventIds: ['btn-evt'],
              labelIds: ['btn-label'],
              labelColorById: { 'btn-label': '#112233' },
              metric: 'count',
              labelMatch: 'all',
            },
          },
        },
        layout: { x: 4, y: 0, w: 2, h: 1, z: 2 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: [],
      },
    ],
  };

  it('validates timeline payload with backend schema and returns preview', () => {
    const result = service.validateTimelineImport(validTimeline);

    expect(result).toMatchObject({
      type: 'analysis-timeline',
      valid: true,
      detectedType: 'analysis-timeline',
      summary: {
        timelineName: 'Timeline Alpha',
        eventDefCount: 1,
        labelDefCount: 1,
        occurrenceCount: 1,
      },
      errors: [],
    });
  });

  it('validates panel payload with backend schema and returns preview', () => {
    const result = service.validatePanelImport(validPanel);

    expect(result).toMatchObject({
      type: 'sequencer-panel',
      valid: true,
      detectedType: 'sequencer-panel',
      summary: {
        panelName: 'Panel Beta',
        buttonCount: 3,
        eventButtonCount: 1,
        labelButtonCount: 1,
        statButtonCount: 1,
      },
      errors: [],
    });
    expect(result.normalizedPayload?.btnList[0]).toMatchObject({
      eventProps: { kind: 'indefinite', preMs: 1000, postMs: 2000 },
    });
    expect(result.normalizedPayload?.btnList[1]).toMatchObject({
      isAnonymized: true,
      labelProps: { mode: 'indefinite', colorHex: '#112233' },
    });
    expect(result.normalizedPayload?.btnList[2]).toMatchObject({
      stat: {
        definition: {
          mode: 'simple',
          query: {
            eventIds: ['btn-evt'],
            labelIds: ['btn-label'],
            labelColorById: { 'btn-label': '#112233' },
          },
        },
      },
    });
  });

  it('rejects type mismatch on wrong endpoint', () => {
    const result = service.validateTimelineImport(validPanel);

    expect(result.valid).toBe(false);
    expect(result.detectedType).toBe('sequencer-panel');
    expect(result.errors[0]).toMatchObject({ code: 'TYPE_MISMATCH', path: ['type'] });
  });

  it('returns readable errors when payload is invalid', () => {
    const result = service.validatePanelImport({
      schemaVersion: '1.0.0',
      type: 'sequencer-panel',
      panelName: '',
      meta: {},
      btnList: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        code: 'invalid_payload',
        path: expect.any(Array),
        message: expect.any(String),
      }),
    );
  });
});
