import { sequencerPanelImportSchemaV1 } from './sequencer-panel-import.schema';

function buildValidPanel() {
  return {
    schemaVersion: '1.0.0',
    type: 'sequencer-panel',
    panelName: 'Main Panel',
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
        id: 'btn-event-1',
        name: 'Goal Event',
        isAnonymized: false,
        type: 'event',
        eventProps: {
          eventName: 'Goal',
          colorHex: '#00FFAA',
          kind: 'indefinite',
          preMs: 1500,
          postMs: 2500,
        },
        layout: { x: 0, y: 0, w: 2, h: 1, z: 0 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: ['btn-stat-1'],
      },
      {
        id: 'btn-label-1',
        name: 'Label Marker',
        isAnonymized: true,
        type: 'label',
        labelProps: {
          label: 'Phase 1',
          colorHex: '#112233',
          mode: 'indefinite',
        },
        layout: { x: 2, y: 0, w: 2, h: 1, z: 1 },
        hotkeyNormalized: 'Ctrl+L',
        deactivateIds: ['btn-event-1'],
        activateIds: [],
      },
      {
        id: 'btn-stat-1',
        name: 'Possession',
        type: 'stat',
        stat: {
          statName: 'possession',
          value: 55,
          colorHex: '#445566',
          definition: {
            mode: 'complex',
            expression: {
              kind: 'group',
              left: {
                kind: 'query',
                query: {
                  eventIds: ['btn-event-1'],
                  labelIds: ['btn-label-1'],
                  labelColorById: { 'btn-label-1': '#112233' },
                  metric: 'count',
                  labelMatch: 'all',
                },
              },
              op: '+',
              right: { kind: 'constant', value: 2 },
            },
            editor: {
              terms: [
                {
                  id: 'term-1',
                  displayName: 'Goals in phase',
                  kind: 'query',
                  query: {
                    eventIds: ['btn-event-1'],
                    labelIds: ['btn-label-1'],
                    metric: 'count',
                    labelMatch: 'all',
                  },
                },
                {
                  id: 'term-2',
                  displayName: 'Bonus',
                  kind: 'constant',
                  constantValue: 2,
                },
              ],
              tokens: [
                { kind: 'term', termId: 'term-1' },
                { kind: 'operator', op: '+' },
                { kind: 'term', termId: 'term-2' },
              ],
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
}

describe('sequencerPanelImportSchemaV1', () => {
  it('accepts a valid panel payload', () => {
    const result = sequencerPanelImportSchemaV1.safeParse(buildValidPanel());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.btnList[0]).toMatchObject({
        isAnonymized: false,
        eventProps: {
          kind: 'indefinite',
          preMs: 1500,
          postMs: 2500,
        },
      });
      expect(result.data.btnList[1]).toMatchObject({
        isAnonymized: true,
        labelProps: {
          mode: 'indefinite',
          colorHex: '#112233',
        },
      });
      expect(result.data.btnList[2]).toMatchObject({
        stat: {
          definition: {
            mode: 'complex',
            expression: {
              kind: 'group',
            },
          },
        },
      });
    }
  });

  it('keeps legacy panel payloads compatible with safe defaults', () => {
    const payload = buildValidPanel();
    delete (payload.btnList[0] as { eventProps: { kind?: string; preMs?: number; postMs?: number } }).eventProps.kind;
    delete (payload.btnList[0] as { eventProps: { kind?: string; preMs?: number; postMs?: number } }).eventProps.preMs;
    delete (payload.btnList[0] as { eventProps: { kind?: string; preMs?: number; postMs?: number } }).eventProps.postMs;
    delete (payload.btnList[1] as { labelProps: { mode?: string } }).labelProps.mode;
    delete (payload.btnList[2] as { stat: { definition?: unknown } }).stat.definition;

    const result = sequencerPanelImportSchemaV1.safeParse(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.btnList[0]).toMatchObject({ eventProps: { kind: 'limited', preMs: 0, postMs: 0 } });
      expect(result.data.btnList[1]).toMatchObject({ labelProps: { mode: 'once' } });
      expect(result.data.btnList[2]).toMatchObject({ stat: { value: 55 } });
    }
  });

  it('rejects panel payload without schemaVersion', () => {
    const payload = buildValidPanel();
    delete (payload as { schemaVersion?: string }).schemaVersion;

    const result = sequencerPanelImportSchemaV1.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'schemaVersion')).toBe(true);
    }
  });

  it('rejects panel payload without type', () => {
    const payload = buildValidPanel();
    delete (payload as { type?: string }).type;

    const result = sequencerPanelImportSchemaV1.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'type')).toBe(true);
    }
  });

  it('rejects invalid button payload', () => {
    const payload = buildValidPanel();
    const firstButton = payload.btnList[0] as {
      eventProps: { eventName: string; colorHex: string; kind: string; preMs: number };
    };
    firstButton.eventProps.eventName = '';
    firstButton.eventProps.colorHex = 'blue';
    firstButton.eventProps.kind = 'timed';
    firstButton.eventProps.preMs = -1;

    const result = sequencerPanelImportSchemaV1.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('eventProps'))).toBe(true);
    }
  });

  it('rejects unknown references in deactivateIds/activateIds', () => {
    const payload = buildValidPanel();
    payload.btnList[0].activateIds = ['missing-btn'];

    const result = sequencerPanelImportSchemaV1.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path.includes('activateIds') &&
            issue.message.includes('Unknown button id reference "missing-btn"'),
        ),
      ).toBe(true);
    }
  });
});
