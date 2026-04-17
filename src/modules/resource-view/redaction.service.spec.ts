import { RedactionService } from './redaction.service';

describe('RedactionService', () => {
  const service = new RedactionService();

  it('pseudonymizes anonymized buttons with stable aliases and keeps panelName + structure readable', () => {
    const payload = {
      schemaVersion: '1.0.0',
      type: 'sequencer-panel',
      panelName: 'Panel joueurs saison',
      btnList: [
        {
          id: 'btn-evt-1',
          type: 'event',
          name: 'Alex Martin',
          isAnonymized: true,
          eventProps: { eventName: 'But Alex Martin', colorHex: '#00FFAA' },
          layout: { x: 0, y: 0, w: 1, h: 1, z: 0 },
          deactivateIds: [],
          activateIds: ['btn-label-1'],
          hotkeyNormalized: null,
        },
        {
          id: 'btn-evt-2',
          type: 'event',
          name: 'Samir Doe',
          anonymized: true,
          eventProps: { eventName: 'Passe Samir Doe', colorHex: '#AA00FF' },
          layout: { x: 1, y: 0, w: 1, h: 1, z: 1 },
          deactivateIds: ['btn-evt-1'],
          activateIds: [],
          hotkeyNormalized: null,
        },
        {
          id: 'btn-label-1',
          type: 'label',
          name: 'Profil Alex Martin',
          anonymizedFlag: true,
          labelProps: { label: 'Nom complet Alex Martin', colorHex: '#112233' },
          layout: { x: 2, y: 0, w: 1, h: 1, z: 2 },
          deactivateIds: [],
          activateIds: [],
          hotkeyNormalized: null,
        },
        {
          id: 'btn-label-2',
          type: 'label',
          name: 'Profil Samir Doe',
          isAnonymized: true,
          labelProps: { label: 'Nom complet Samir Doe', colorHex: '#332211' },
          layout: { x: 3, y: 0, w: 1, h: 1, z: 3 },
          deactivateIds: [],
          activateIds: [],
          hotkeyNormalized: null,
        },
        {
          id: 'btn-stat-1',
          type: 'stat',
          name: 'Indice Alex Martin',
          isAnonymized: true,
          stat: { statName: 'Indice Alex Martin', value: 55, colorHex: '#445566' },
          layout: { x: 4, y: 0, w: 1, h: 1, z: 4 },
          deactivateIds: [],
          activateIds: [],
          hotkeyNormalized: null,
        },
        {
          id: 'btn-tech-1',
          type: 'event',
          name: 'Pressing haut',
          eventProps: { eventName: 'Pressing haut', colorHex: '#123456' },
          layout: { x: 5, y: 0, w: 1, h: 1, z: 5 },
          deactivateIds: [],
          activateIds: [],
          hotkeyNormalized: null,
        },
      ],
    };

    const redacted = service.redactPanelContent(payload);

    expect(redacted.panelName).toBe('Panel joueurs saison');
    const buttons = redacted.btnList as Array<Record<string, unknown>>;

    expect(buttons[0].name).toBe('Event anonymized 1');
    expect((buttons[0].eventProps as Record<string, unknown>).eventName).toBe('Event anonymized 1');
    expect(buttons[1].name).toBe('Event anonymized 2');
    expect((buttons[1].eventProps as Record<string, unknown>).eventName).toBe('Event anonymized 2');

    expect(buttons[2].name).toBe('Label anonymized 1');
    expect((buttons[2].labelProps as Record<string, unknown>).label).toBe('Label anonymized 1');
    expect(buttons[3].name).toBe('Label anonymized 2');
    expect((buttons[3].labelProps as Record<string, unknown>).label).toBe('Label anonymized 2');

    expect(buttons[4].name).toBe('Stat anonymized 1');
    expect((buttons[4].stat as Record<string, unknown>).statName).toBe('Stat anonymized 1');
    expect((buttons[4].stat as Record<string, unknown>).value).toBe(55);

    expect(buttons[5].name).toBe('Pressing haut');
    expect((buttons[5].eventProps as Record<string, unknown>).eventName).toBe('Pressing haut');

    expect(buttons[0].id).toBe('btn-evt-1');
    expect(buttons[0].activateIds).toEqual(['btn-label-1']);
    expect(buttons[1].deactivateIds).toEqual(['btn-evt-1']);
    expect(buttons[2].layout).toEqual({ x: 2, y: 0, w: 1, h: 1, z: 2 });
    expect(buttons[3].hotkeyNormalized).toBeNull();
  });

  it('keeps non-anonymized payload unchanged', () => {
    const payload = {
      type: 'sequencer-panel',
      panelName: 'No anonymized data',
      btnList: [
        {
          id: 'btn-1',
          type: 'event',
          name: 'Pressing',
          eventProps: { eventName: 'Pressing', colorHex: '#000000' },
        },
      ],
    };

    expect(service.redactPanelContent(payload)).toEqual(payload);
  });

  it('detects anonymized content from panel payload', () => {
    expect(
      service.panelContentHasAnonymizedData({
        btnList: [{ id: 'btn-1', isAnonymized: true }],
      }),
    ).toBe(true);

    expect(
      service.panelContentHasAnonymizedData({
        btnList: [{ id: 'btn-1', isAnonymized: false }],
      }),
    ).toBe(false);
  });

  it('redacts anonymized button values even when button type is missing but props are present', () => {
    const payload = {
      btnList: [
        {
          id: 'btn-evt-1',
          name: 'henry',
          isAnonymized: true,
          eventProps: { eventName: 'henry', colorHex: '#00FFAA' },
        },
      ],
    };

    const redacted = service.redactPanelContent(payload);
    const button = (redacted.btnList as Array<Record<string, unknown>>)[0] as Record<string, unknown>;

    expect(button.name).toBe('Event anonymized 1');
    expect((button.eventProps as Record<string, unknown>).eventName).toBe('Event anonymized 1');
  });
});
