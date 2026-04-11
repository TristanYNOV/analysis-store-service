import { RedactionService } from './redaction.service';

describe('RedactionService', () => {
  const service = new RedactionService();

  it('redacts anonymized panel event/label/stat buttons while preserving structure', () => {
    const payload = {
      schemaVersion: '1.0.0',
      type: 'sequencer-panel',
      btnList: [
        {
          id: 'evt-1',
          type: 'event',
          name: 'Goal',
          isAnonymized: true,
          eventProps: { eventName: 'Goal', colorHex: '#00FFAA' },
          layout: { x: 0, y: 0, w: 1, h: 1, z: 0 },
          deactivateIds: [],
          activateIds: [],
        },
        {
          id: 'lbl-1',
          type: 'label',
          name: 'Phase',
          anonymized: true,
          labelProps: { label: 'Phase 1', colorHex: '#112233' },
          layout: { x: 1, y: 0, w: 1, h: 1, z: 1 },
          deactivateIds: [],
          activateIds: [],
        },
        {
          id: 'stat-1',
          type: 'stat',
          name: 'Possession',
          anonymizedFlag: true,
          stat: { statName: 'possession', value: 55, colorHex: '#445566' },
          layout: { x: 2, y: 0, w: 1, h: 1, z: 2 },
          deactivateIds: [],
          activateIds: [],
        },
      ],
    };

    const redacted = service.redactPanelContent(payload);

    expect(redacted.schemaVersion).toBe(payload.schemaVersion);
    expect(Array.isArray(redacted.btnList)).toBe(true);

    const [eventButton, labelButton, statButton] = redacted.btnList as Array<Record<string, unknown>>;
    expect((eventButton.eventProps as Record<string, unknown>).eventName).toBe('[redacted]');
    expect((eventButton.eventProps as Record<string, unknown>).colorHex).toBeNull();

    expect((labelButton.labelProps as Record<string, unknown>).label).toBe('[redacted]');
    expect((labelButton.labelProps as Record<string, unknown>).colorHex).toBeNull();

    expect((statButton.stat as Record<string, unknown>).statName).toBe('[redacted]');
    expect((statButton.stat as Record<string, unknown>).value).toBeNull();
  });
});
