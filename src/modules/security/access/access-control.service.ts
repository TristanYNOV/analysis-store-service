import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IdentityContext } from '../identity/identity-context.types';
import { PanelAccessResource, TimelineOwnership } from './access-control.types';
import { RESOURCE_VISIBILITY } from './resource-visibility';

@Injectable()
export class AccessControlService {
  canAccessTimeline(identity: IdentityContext, resource: TimelineOwnership): boolean {
    return identity.userId === resource.ownerId;
  }

  canAccessPanel(identity: IdentityContext, resource: PanelAccessResource): boolean {
    if (resource.visibility === RESOURCE_VISIBILITY.public) {
      return true;
    }

    if (resource.visibility === RESOURCE_VISIBILITY.private) {
      return identity.userId === resource.ownerId;
    }

    if (resource.visibility === RESOURCE_VISIBILITY.club) {
      if (!resource.clubId) {
        return false;
      }

      return identity.clubIds.includes(resource.clubId);
    }

    return false;
  }

  assertTimelineAccess(
    identity: IdentityContext,
    resource: TimelineOwnership | null,
    resourceLabel = 'Timeline',
  ): asserts resource is TimelineOwnership {
    if (!resource) {
      throw new NotFoundException(`${resourceLabel} not found`);
    }

    if (!this.canAccessTimeline(identity, resource)) {
      throw new ForbiddenException(`${resourceLabel} access denied`);
    }
  }

  assertPanelAccess(
    identity: IdentityContext,
    resource: PanelAccessResource | null,
    resourceLabel = 'Panel',
  ): asserts resource is PanelAccessResource {
    if (!resource) {
      throw new NotFoundException(`${resourceLabel} not found`);
    }

    if (!this.canAccessPanel(identity, resource)) {
      throw new ForbiddenException(`${resourceLabel} access denied`);
    }
  }

  assertTimelineOwner(
    identity: IdentityContext,
    resource: { ownerUserId: string } | null | undefined,
    resourceLabel = 'Timeline',
  ): asserts resource is { ownerUserId: string } {
    if (!resource) {
      throw new NotFoundException(`${resourceLabel} not found`);
    }

    if (resource.ownerUserId !== identity.userId) {
      throw new ForbiddenException(`${resourceLabel} access denied`);
    }
  }

  assertPanelOwner(
    identity: IdentityContext,
    resource: { ownerUserId: string } | null | undefined,
    resourceLabel = 'Panel',
  ): asserts resource is { ownerUserId: string } {
    if (!resource) {
      throw new NotFoundException(`${resourceLabel} not found`);
    }

    if (resource.ownerUserId !== identity.userId) {
      throw new ForbiddenException(`${resourceLabel} access denied`);
    }
  }
}
