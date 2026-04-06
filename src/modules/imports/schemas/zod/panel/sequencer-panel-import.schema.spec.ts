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
        type: 'event',
        eventProps: {
          eventName: 'Goal',
          colorHex: '#00FFAA',
        },
        layout: { x: 0, y: 0, w: 2, h: 1, z: 0 },
        hotkeyNormalized: null,
        deactivateIds: [],
        activateIds: ['btn-stat-1'],
      },
      {
        id: 'btn-label-1',
        name: 'Label Marker',
        type: 'label',
        labelProps: {
          label: 'Phase 1',
          colorHex: '#112233',
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
    const firstButton = payload.btnList[0] as { eventProps: { eventName: string; colorHex: string } };
    firstButton.eventProps.eventName = '';
    firstButton.eventProps.colorHex = 'blue';

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
