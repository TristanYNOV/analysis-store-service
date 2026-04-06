import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DbService } from '../../db/db.service';
import { panels } from '../../db/schema';
import { AccessControlService } from '../security/access/access-control.service';
import { RESOURCE_VISIBILITY } from '../security/access/resource-visibility';
import { IdentityContext } from '../security/identity/identity-context.types';
import { PanelResourceResponseDto, PatchPanelDto } from './panels.dto';

@Injectable()
export class PanelsService {
  constructor(
    private readonly dbService: DbService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async patchById(panelId: string, identity: IdentityContext, dto: PatchPanelDto): Promise<PanelResourceResponseDto> {
    const existing = await this.dbService.db.query.panels.findFirst({
      where: eq(panels.id, panelId),
    });

    this.accessControlService.assertPanelOwner(identity, existing);

    const resolvedVisibility = dto.visibility ?? existing.visibility;
    const resolvedClubId = dto.clubId === undefined ? existing.clubId : dto.clubId;

    this.assertPanelVisibilityConsistency(resolvedVisibility, resolvedClubId);

    const [updated] = await this.dbService.db
      .update(panels)
      .set({
        title: dto.title ?? existing.title,
        description: dto.description === undefined ? existing.description : dto.description,
        contentJson: dto.contentJson,
        visibility: resolvedVisibility,
        clubId: resolvedClubId,
        hasAnonymizedContent: dto.hasAnonymizedContent ?? existing.hasAnonymizedContent,
        updatedAt: new Date(),
      })
      .where(eq(panels.id, panelId))
      .returning();

    if (!updated) {
      throw new BadRequestException('Panel update failed');
    }

    return this.toResponse(updated);
  }

  async deleteById(panelId: string, identity: IdentityContext): Promise<void> {
    const existing = await this.dbService.db.query.panels.findFirst({
      where: eq(panels.id, panelId),
    });

    this.accessControlService.assertPanelOwner(identity, existing);

    await this.dbService.db.delete(panels).where(eq(panels.id, panelId));
  }

  async copyById(panelId: string, identity: IdentityContext): Promise<PanelResourceResponseDto> {
    const existing = await this.dbService.db.query.panels.findFirst({
      where: eq(panels.id, panelId),
    });

    if (!existing) {
      throw new NotFoundException('Panel not found');
    }

    this.accessControlService.assertPanelAccess(identity, this.mapForAccess(existing));

    const [copied] = await this.dbService.db
      .insert(panels)
      .values({
        ownerUserId: identity.userId,
        visibility: RESOURCE_VISIBILITY.private,
        clubId: existing.clubId,
        title: `${existing.title} (copy)`,
        description: existing.description,
        contentJson: existing.contentJson,
        hasAnonymizedContent: existing.hasAnonymizedContent,
      })
      .returning();

    if (!copied) {
      throw new BadRequestException('Panel copy failed');
    }

    return this.toResponse(copied);
  }

  private assertPanelVisibilityConsistency(
    visibility: string,
    clubId: string | null | undefined,
  ): void {
    if (visibility === RESOURCE_VISIBILITY.club && !clubId) {
      throw new BadRequestException('clubId is required when visibility is club');
    }
  }

  private mapForAccess(resource: typeof panels.$inferSelect | null | undefined) {
    if (!resource) {
      return null;
    }

    return {
      ownerId: resource.ownerUserId,
      visibility: resource.visibility,
      clubId: resource.clubId,
    };
  }

  private toResponse(resource: typeof panels.$inferSelect): PanelResourceResponseDto {
    return {
      id: resource.id,
      ownerUserId: resource.ownerUserId,
      title: resource.title,
      description: resource.description,
      visibility: resource.visibility,
      clubId: resource.clubId,
      contentJson: resource.contentJson,
      hasAnonymizedContent: resource.hasAnonymizedContent,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    };
  }
}
