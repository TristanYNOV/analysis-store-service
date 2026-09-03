import { TIMELINE_TYPE } from '../../constants/import-format-v1.constants';
import { analysisTimelineImportSchemaV1 } from './analysis-timeline-import.schema';

function buildTimelinePayload(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '1.0.0',
    type: TIMELINE_TYPE,
    timelineName: 'Match analysis',
    meta: {
      createdAtIso: '2026-06-01T10:00:00.000Z',
      updatedAtIso: '2026-06-01T10:05:00.000Z',
      exportedAtIso: '2026-06-01T10:10:00.000Z',
      sourceUserId: 'user-1',
      sourceApp: 'analyse-sport',
      sourceAppVersion: '1.0.0',
    },
    eventDefs: [{ id: 'event-shot', name: 'Shot', colorHex: '#ff0000' }],
    labelDefs: [{ id: 'label-goal', name: 'Goal', colorHex: '#0f0' }],
    occurrences: [
      {
        id: 'occurrence-1',
        eventDefId: 'event-shot',
        labelDefId: null,
        occurredAtIso: '2026-06-01T10:01:00.000Z',
        durationMs: 1200,
        note: 'near post',
      },
    ],
    ui: {
      zoom: 1,
      showLabels: true,
      selectedOccurrenceId: 'occurrence-1',
    },
    ...overrides,
  };
}

describe('analysisTimelineImportSchemaV1', () => {
  it('rejects duplicate event and label identifiers', () => {
    const result = analysisTimelineImportSchemaV1.safeParse(
      buildTimelinePayload({
        eventDefs: [
          { id: 'event-shot', name: 'Shot', colorHex: '#ff0000' },
          { id: 'event-shot', name: 'Duplicate shot', colorHex: '#00ff00' },
        ],
        labelDefs: [
          { id: 'label-goal', name: 'Goal', colorHex: '#0f0' },
          { id: 'label-goal', name: 'Duplicate goal', colorHex: null },
        ],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['eventDefs', 1, 'id'] }),
          expect.objectContaining({ path: ['labelDefs', 1, 'id'] }),
        ]),
      );
    }
  });

  it('rejects occurrences with unknown references or no event/label reference', () => {
    const result = analysisTimelineImportSchemaV1.safeParse(
      buildTimelinePayload({
        occurrences: [
          {
            id: 'occurrence-unknown',
            eventDefId: 'missing-event',
            labelDefId: 'missing-label',
            occurredAtIso: '2026-06-01T10:01:00.000Z',
            durationMs: 1200,
            note: null,
          },
          {
            id: 'occurrence-empty',
            eventDefId: null,
            labelDefId: null,
            occurredAtIso: '2026-06-01T10:02:00.000Z',
            durationMs: 500,
            note: null,
          },
        ],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['occurrences', 0, 'eventDefId'] }),
          expect.objectContaining({ path: ['occurrences', 0, 'labelDefId'] }),
          expect.objectContaining({ path: ['occurrences', 1] }),
        ]),
      );
    }
  });
});
