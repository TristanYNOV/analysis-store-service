import { RESOURCE_VISIBILITY } from '../security/access/resource-visibility';
import { PanelsService } from './panels.service';

describe('PanelsService', () => {
  it('copies projected redacted content when a non-owner copies an accessible panel', async () => {
    const sourcePanel = {
      id: 'panel-source',
      ownerUserId: 'owner-1',
      title: 'Custom Panel',
      description: null,
      visibility: 'public',
      clubId: null,
      contentJson: {
        btnList: [
          {
            id: 'btn-1',
            name: 'henry',
            isAnonymized: true,
            eventProps: { eventName: 'henry' },
          },
        ],
      },
      hasAnonymizedContent: true,
      sensitivePayloadEncrypted: null,
      cryptoSuite: null,
      keyVersion: null,
      createdAt: new Date('2026-04-17T00:00:00.000Z'),
      updatedAt: new Date('2026-04-17T00:00:00.000Z'),
    };

    const redactedExport = {
      btnList: [
        {
          id: 'btn-1',
          name: 'Event anonymized 1',
          isAnonymized: true,
          eventProps: { eventName: 'Event anonymized 1' },
        },
      ],
    };

    const copiedPanel = {
      ...sourcePanel,
      id: 'panel-copy',
      ownerUserId: 'reader-1',
      title: 'Custom Panel (copy)',
      visibility: RESOURCE_VISIBILITY.private,
      contentJson: redactedExport,
    };

    const returning = jest.fn().mockResolvedValue([copiedPanel]);
    const values = jest.fn().mockReturnValue({ returning });
    const insert = jest.fn().mockReturnValue({ values });

    const dbService = {
      db: {
        query: {
          panels: {
            findFirst: jest.fn().mockResolvedValue(sourcePanel),
          },
        },
        insert,
      },
    };

    const accessControlService = {
      assertPanelAccess: jest.fn(),
    };

    const resourceViewService = {
      toPanelExport: jest.fn().mockReturnValue(redactedExport),
      toPanelResponse: jest.fn().mockReturnValue({ id: 'panel-copy' }),
    };

    const service = new PanelsService(dbService as never, accessControlService as never, resourceViewService as never);

    await service.copyById('panel-source', { userId: 'reader-1', clubIds: [], roles: [] });

    expect(resourceViewService.toPanelExport).toHaveBeenCalledWith(sourcePanel, {
      userId: 'reader-1',
      clubIds: [],
      roles: [],
    });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: 'reader-1',
        contentJson: redactedExport,
      }),
    );
  });
});
