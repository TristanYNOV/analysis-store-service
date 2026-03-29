import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { RESOURCE_VISIBILITY } from './resource-visibility';

const identity = {
  userId: 'user-1',
  clubIds: ['club-1', 'club-2'],
  roles: ['analyst'],
};

describe('AccessControlService', () => {
  const service = new AccessControlService();

  it('allows timeline access only for owner', () => {
    expect(service.canAccessTimeline(identity, { ownerId: 'user-1' })).toBe(true);
    expect(service.canAccessTimeline(identity, { ownerId: 'user-2' })).toBe(false);
  });

  it('enforces panel visibility private/public/club', () => {
    expect(
      service.canAccessPanel(identity, {
        ownerId: 'user-2',
        visibility: RESOURCE_VISIBILITY.public,
      }),
    ).toBe(true);

    expect(
      service.canAccessPanel(identity, {
        ownerId: 'user-1',
        visibility: RESOURCE_VISIBILITY.private,
      }),
    ).toBe(true);

    expect(
      service.canAccessPanel(identity, {
        ownerId: 'user-2',
        visibility: RESOURCE_VISIBILITY.private,
      }),
    ).toBe(false);

    expect(
      service.canAccessPanel(identity, {
        ownerId: 'user-2',
        visibility: RESOURCE_VISIBILITY.club,
        clubId: 'club-1',
      }),
    ).toBe(true);

    expect(
      service.canAccessPanel(identity, {
        ownerId: 'user-2',
        visibility: RESOURCE_VISIBILITY.club,
        clubId: 'club-9',
      }),
    ).toBe(false);
  });

  it('throws consistent errors for missing or unauthorized resources', () => {
    expect(() => service.assertTimelineAccess(identity, null)).toThrow(NotFoundException);
    expect(() =>
      service.assertTimelineAccess(identity, {
        ownerId: 'other',
      }),
    ).toThrow(ForbiddenException);

    expect(() => service.assertPanelAccess(identity, null)).toThrow(NotFoundException);
    expect(() =>
      service.assertPanelAccess(identity, {
        ownerId: 'other',
        visibility: RESOURCE_VISIBILITY.private,
      }),
    ).toThrow(ForbiddenException);
  });
});
