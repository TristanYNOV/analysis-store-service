import { BadRequestException } from '@nestjs/common';
import { RESOURCE_VISIBILITY } from '../security/access/resource-visibility';
import { TimelinesService } from './timelines.service';

describe('TimelinesService', () => {
  const identity = { userId: 'user-1', clubIds: [], roles: [] };

  const existingTimeline = {
    id: 'timeline-1',
    ownerUserId: 'user-1',
    title: 'Match A',
    description: null,
    visibility: RESOURCE_VISIBILITY.private,
    clubId: null,
    contentJson: { eventDefs: [] },
    hasAnonymizedContent: false,
    createdAt: new Date('2026-04-17T00:00:00.000Z'),
    updatedAt: new Date('2026-04-17T00:00:00.000Z'),
  };

  function buildService(options?: {
    insertResult?: unknown[];
    findFirstResult?: typeof existingTimeline | null;
    updateResult?: unknown[];
  }) {
    const returningInsert = jest.fn().mockResolvedValue(options?.insertResult ?? [existingTimeline]);
    const values = jest.fn().mockReturnValue({ returning: returningInsert });
    const insert = jest.fn().mockReturnValue({ values });

    const returningUpdate = jest.fn().mockResolvedValue(options?.updateResult ?? [existingTimeline]);
    const whereUpdate = jest.fn().mockReturnValue({ returning: returningUpdate });
    const set = jest.fn().mockReturnValue({ where: whereUpdate });
    const update = jest.fn().mockReturnValue({ set });

    const whereDelete = jest.fn().mockResolvedValue(undefined);
    const deleteFn = jest.fn().mockReturnValue({ where: whereDelete });

    const dbService = {
      db: {
        insert,
        update,
        delete: deleteFn,
        query: {
          timelines: {
            findMany: jest.fn().mockResolvedValue([existingTimeline]),
            findFirst: jest.fn().mockResolvedValue(options?.findFirstResult ?? existingTimeline),
          },
        },
      },
    };

    const accessControlService = {
      assertTimelineOwner: jest.fn(),
    };

    const resourceViewService = {
      toTimelineResponse: jest.fn((resource) => ({ id: resource.id, ownerUserId: resource.ownerUserId })),
      toTimelineExport: jest.fn((resource) => ({ type: 'analysis-timeline', title: resource.title })),
    };

    const service = new TimelinesService(
      dbService as never,
      accessControlService as never,
      resourceViewService as never,
    );

    return {
      service,
      dbService,
      accessControlService,
      resourceViewService,
      values,
      set,
      whereDelete,
    };
  }

  it('creates private timelines owned by the current user', async () => {
    const { service, values, resourceViewService } = buildService();

    await service.create(identity, {
      title: 'Match A',
      description: 'Quarter final',
      contentJson: { eventDefs: [] },
      hasAnonymizedContent: true,
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: 'user-1',
        visibility: RESOURCE_VISIBILITY.private,
        title: 'Match A',
        description: 'Quarter final',
        contentJson: { eventDefs: [] },
        hasAnonymizedContent: true,
      }),
    );
    expect(resourceViewService.toTimelineResponse).toHaveBeenCalledWith(existingTimeline, identity);
  });

  it('fails clearly when the database does not return the created timeline', async () => {
    const { service } = buildService({ insertResult: [] });

    await expect(
      service.create(identity, {
        title: 'Match A',
        contentJson: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists only timelines owned by the current user and projects responses', async () => {
    const { service, dbService, resourceViewService } = buildService();

    const result = await service.list(identity);

    expect(dbService.db.query.timelines.findMany).toHaveBeenCalled();
    expect(resourceViewService.toTimelineResponse).toHaveBeenCalledWith(existingTimeline, identity);
    expect(result).toEqual([{ id: 'timeline-1', ownerUserId: 'user-1' }]);
  });

  it('checks ownership before exporting a timeline', async () => {
    const { service, accessControlService, resourceViewService } = buildService();

    const result = await service.exportById('timeline-1', identity);

    expect(accessControlService.assertTimelineOwner).toHaveBeenCalledWith(identity, existingTimeline);
    expect(resourceViewService.toTimelineExport).toHaveBeenCalledWith(existingTimeline, identity);
    expect(result).toEqual({ type: 'analysis-timeline', title: 'Match A' });
  });

  it('checks ownership and keeps existing values during partial updates', async () => {
    const { service, accessControlService, set } = buildService();

    await service.patchById('timeline-1', identity, {
      description: 'Updated',
      contentJson: { occurrences: [] },
    });

    expect(accessControlService.assertTimelineOwner).toHaveBeenCalledWith(identity, existingTimeline);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        title: existingTimeline.title,
        description: 'Updated',
        contentJson: { occurrences: [] },
        hasAnonymizedContent: existingTimeline.hasAnonymizedContent,
        updatedAt: expect.any(Date),
      }),
    );
  });

  it('checks ownership before deleting a timeline', async () => {
    const { service, accessControlService, whereDelete } = buildService();

    await service.deleteById('timeline-1', identity);

    expect(accessControlService.assertTimelineOwner).toHaveBeenCalledWith(identity, existingTimeline);
    expect(whereDelete).toHaveBeenCalled();
  });
});
