import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DbService } from '../../db/db.service';
import { panels } from '../../db/schema';
import { ResourceViewService } from '../resource-view/resource-view.service';
import { AccessControlService } from '../security/access/access-control.service';
import { RESOURCE_VISIBILITY } from '../security/access/resource-visibility';
import { IdentityContext } from '../security/identity/identity-context.types';
import { CreatePanelDto, PanelResourceResponseDto, PatchPanelDto } from './panels.dto';

@Injectable()
export class PanelsService {
  constructor(
    private readonly dbService: DbService,
    private readonly accessControlService: AccessControlService,
    private readonly resourceViewService: ResourceViewService,
  ) {}

  async create(identity: IdentityContext, dto: CreatePanelDto): Promise<PanelResourceResponseDto> {
    const visibility = dto.visibility ?? RESOURCE_VISIBILITY.private;
    this.assertPanelVisibilityConsistency(visibility, dto.clubId);

    const [created] = await this.dbService.db
      .insert(panels)
      .values({
        ownerUserId: identity.userId,
        visibility,
        clubId: dto.clubId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        contentJson: dto.contentJson,
        hasAnonymizedContent: dto.hasAnonymizedContent ?? false,
      })
      .returning();

    if (!created) {
      throw new BadRequestException('Panel creation failed');
    }

    return this.resourceViewService.toPanelResponse(created, identity);
  }

  async list(identity: IdentityContext): Promise<PanelResourceResponseDto[]> {
    const resources = await this.dbService.db.query.panels.findMany();
    return resources
      .filter((resource) =>
        this.accessControlService.canAccessPanel(identity, {
          ownerId: resource.ownerUserId,
          visibility: resource.visibility,
          clubId: resource.clubId,
        }),
      )
      .map((resource) => this.resourceViewService.toPanelResponse(resource, identity));
  }

  async getById(panelId: string, identity: IdentityContext): Promise<PanelResourceResponseDto> {
    const existing = await this.loadAccessiblePanel(panelId, identity);
    return this.resourceViewService.toPanelResponse(existing, identity);
  }

  async exportById(panelId: string, identity: IdentityContext): Promise<Record<string, unknown>> {
    const existing = await this.loadAccessiblePanel(panelId, identity);
    return this.resourceViewService.toPanelExport(existing, identity);
  }

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

    return this.resourceViewService.toPanelResponse(updated, identity);
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

    return this.resourceViewService.toPanelResponse(copied, identity);
  }

  private async loadAccessiblePanel(panelId: string, identity: IdentityContext): Promise<typeof panels.$inferSelect> {
    const existing = await this.dbService.db.query.panels.findFirst({
      where: eq(panels.id, panelId),
    });

    if (!existing) {
      throw new NotFoundException('Panel not found');
    }

    this.accessControlService.assertPanelAccess(identity, this.mapForAccess(existing));
    return existing;
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
}
