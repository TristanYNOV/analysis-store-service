import { UserDeletionCleanupService } from './user-deletion-cleanup.service';

describe('UserDeletionCleanupService', () => {
  it('deletes owned timelines/private panels and anonymizes shared panels', async () => {
    const timelineReturning = jest.fn().mockResolvedValue([{ id: 'timeline-1' }, { id: 'timeline-2' }]);
    const privatePanelReturning = jest.fn().mockResolvedValue([{ id: 'panel-private' }]);
    const sharedPanelReturning = jest.fn().mockResolvedValue([{ id: 'panel-public' }]);

    const timelineWhere = jest.fn().mockReturnValue({ returning: timelineReturning });
    const privatePanelWhere = jest.fn().mockReturnValue({ returning: privatePanelReturning });
    const sharedPanelWhere = jest.fn().mockReturnValue({ returning: sharedPanelReturning });
    const set = jest.fn().mockReturnValue({ where: sharedPanelWhere });

    const dbService = {
      db: {
        delete: jest
          .fn()
          .mockReturnValueOnce({ where: timelineWhere })
          .mockReturnValueOnce({ where: privatePanelWhere }),
        update: jest.fn().mockReturnValue({ set }),
      },
    };

    const service = new UserDeletionCleanupService(dbService as never);
    const result = await service.cleanupUserData('user-1');

    expect(result).toEqual({
      deletedResources: {
        timelines: 2,
        privatePanels: 1,
      },
      anonymizedResources: {
        publicPanels: 1,
      },
    });
    expect(dbService.db.delete).toHaveBeenCalledTimes(2);
    expect(dbService.db.update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: 'deleted-user',
        title: 'Panel utilisateur supprime',
        description: null,
        hasAnonymizedContent: true,
      }),
    );
  });
});
