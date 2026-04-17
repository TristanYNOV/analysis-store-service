import { ResourceViewService } from './resource-view.service';
import { RedactionService } from './redaction.service';

describe('ResourceViewService', () => {
  const redactionService = new RedactionService();
  const service = new ResourceViewService(redactionService);

  const basePanelContent = {
    btnList: [
      {
        id: 'btn-evt-1',
        name: 'henry',
        isAnonymized: true,
        eventProps: { eventName: 'henry', colorHex: '#00FFAA' },
      },
    ],
  };

  const panel = {
    id: 'panel-1',
    ownerUserId: 'owner-1',
    title: 'Panel',
    description: null,
    visibility: 'public' as const,
    clubId: null,
    contentJson: basePanelContent,
    hasAnonymizedContent: false,
    sensitivePayloadEncrypted: null,
    cryptoSuite: null,
    keyVersion: null,
    createdAt: new Date('2026-04-17T00:00:00.000Z'),
    updatedAt: new Date('2026-04-17T00:00:00.000Z'),
  };

  it('returns full content to owner', () => {
    const response = service.toPanelResponse(panel, { userId: 'owner-1', clubIds: [], roles: [] });

    const firstButton = (response.contentJson.btnList as Array<Record<string, unknown>>)[0] as Record<string, unknown>;
    expect(firstButton.name).toBe('henry');
    expect((firstButton.eventProps as Record<string, unknown>).eventName).toBe('henry');
  });

  it('returns redacted content for authorized non-owner even when hasAnonymizedContent flag is false', () => {
    const response = service.toPanelResponse(panel, { userId: 'reader-1', clubIds: [], roles: [] });

    const firstButton = (response.contentJson.btnList as Array<Record<string, unknown>>)[0] as Record<string, unknown>;
    expect(firstButton.name).toBe('Event anonymized 1');
    expect((firstButton.eventProps as Record<string, unknown>).eventName).toBe('Event anonymized 1');
  });

  it('exports redacted content for authorized non-owner', () => {
    const exported = service.toPanelExport(panel, { userId: 'reader-1', clubIds: [], roles: [] });

    const firstButton = (exported.btnList as Array<Record<string, unknown>>)[0] as Record<string, unknown>;
    expect(firstButton.name).toBe('Event anonymized 1');
    expect((firstButton.eventProps as Record<string, unknown>).eventName).toBe('Event anonymized 1');
  });
});
