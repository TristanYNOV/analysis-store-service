import { RESOURCE_VISIBILITY } from '../security/access/resource-visibility';
import { PanelsService } from './panels.service';

describe('PanelsService', () => {
  it('lets a panel owner make a public panel private without resending contentJson', async () => {
    const existingPanel = {
      id: 'panel-public',
      ownerUserId: 'owner-1',
      title: 'Shared Panel',
      description: null,
      visibility: RESOURCE_VISIBILITY.public,
      clubId: null,
      contentJson: { btnList: [{ id: 'btn-1' }] },
      hasAnonymizedContent: false,
      sensitivePayloadEncrypted: null,
      cryptoSuite: null,
      keyVersion: null,
      createdAt: new Date('2026-04-17T00:00:00.000Z'),
      updatedAt: new Date('2026-04-17T00:00:00.000Z'),
    };

    const updatedPanel = {
      ...existingPanel,
      visibility: RESOURCE_VISIBILITY.private,
      updatedAt: new Date('2026-04-18T00:00:00.000Z'),
    };

    const returning = jest.fn().mockResolvedValue([updatedPanel]);
    const where = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({ set });

    const dbService = {
      db: {
        query: {
          panels: {
            findFirst: jest.fn().mockResolvedValue(existingPanel),
          },
        },
        update,
      },
    };

    const accessControlService = {
      assertPanelOwner: jest.fn(),
    };

    const resourceViewService = {
      toPanelResponse: jest.fn().mockReturnValue({ id: 'panel-public', visibility: RESOURCE_VISIBILITY.private }),
    };

    const service = new PanelsService(dbService as never, accessControlService as never, resourceViewService as never);

    const result = await service.patchById('panel-public', { userId: 'owner-1', clubIds: [], roles: [] }, {
      visibility: RESOURCE_VISIBILITY.private,
      clubId: null,
    });

    expect(result).toEqual({ id: 'panel-public', visibility: RESOURCE_VISIBILITY.private });
    expect(accessControlService.assertPanelOwner).toHaveBeenCalledWith(
      { userId: 'owner-1', clubIds: [], roles: [] },
      existingPanel,
    );
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        contentJson: existingPanel.contentJson,
        visibility: RESOURCE_VISIBILITY.private,
        clubId: null,
      }),
    );
  });

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
