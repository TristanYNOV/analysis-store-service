import { Injectable } from '@nestjs/common';
import { panels, timelines } from '../../db/schema';
import { IdentityContext } from '../security/identity/identity-context.types';
import { PanelResourceResponseDto } from '../panels/panels.dto';
import { TimelineResourceResponseDto } from '../timelines/timelines.dto';
import { RedactionService } from './redaction.service';

@Injectable()
export class ResourceViewService {
  constructor(private readonly redactionService: RedactionService) {}

  toPanelResponse(resource: typeof panels.$inferSelect, identity: IdentityContext): PanelResourceResponseDto {
    const isOwner = resource.ownerUserId === identity.userId;

    return {
      id: resource.id,
      ownerUserId: resource.ownerUserId,
      title: resource.title,
      description: resource.description,
      visibility: resource.visibility,
      clubId: resource.clubId,
      contentJson: this.resolvePanelContent(resource.contentJson, resource.hasAnonymizedContent, isOwner),
      hasAnonymizedContent: resource.hasAnonymizedContent,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    };
  }

  toPanelExport(resource: typeof panels.$inferSelect, identity: IdentityContext): Record<string, unknown> {
    const isOwner = resource.ownerUserId === identity.userId;
    return this.resolvePanelContent(resource.contentJson, resource.hasAnonymizedContent, isOwner);
  }

  toTimelineResponse(resource: typeof timelines.$inferSelect, identity: IdentityContext): TimelineResourceResponseDto {
    const isOwner = resource.ownerUserId === identity.userId;

    return {
      id: resource.id,
      ownerUserId: resource.ownerUserId,
      title: resource.title,
      description: resource.description,
      visibility: resource.visibility,
      clubId: resource.clubId,
      contentJson: this.resolveTimelineContent(resource.contentJson, resource.hasAnonymizedContent, isOwner),
      hasAnonymizedContent: resource.hasAnonymizedContent,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    };
  }

  toTimelineExport(resource: typeof timelines.$inferSelect, identity: IdentityContext): Record<string, unknown> {
    const isOwner = resource.ownerUserId === identity.userId;
    return this.resolveTimelineContent(resource.contentJson, resource.hasAnonymizedContent, isOwner);
  }

  private resolvePanelContent(
    contentJson: Record<string, unknown>,
    hasAnonymizedContent: boolean,
    isOwner: boolean,
  ): Record<string, unknown> {
    if (isOwner || !hasAnonymizedContent) {
      return contentJson;
    }

    return this.redactionService.redactPanelContent(contentJson);
  }

  private resolveTimelineContent(
    contentJson: Record<string, unknown>,
    hasAnonymizedContent: boolean,
    isOwner: boolean,
  ): Record<string, unknown> {
    if (isOwner || !hasAnonymizedContent) {
      return contentJson;
    }

    return this.redactionService.redactTimelineContent(contentJson);
  }
}
