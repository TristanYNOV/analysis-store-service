import { BadRequestException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { timelines } from '../../db/schema';
import { DbService } from '../../db/db.service';
import { IdentityContext } from '../security/identity/identity-context.types';
import { AccessControlService } from '../security/access/access-control.service';
import { CreateTimelineDto, PatchTimelineDto, TimelineResourceResponseDto } from './timelines.dto';
import { RESOURCE_VISIBILITY } from '../security/access/resource-visibility';

@Injectable()
export class TimelinesService {
  constructor(
    private readonly dbService: DbService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async create(identity: IdentityContext, dto: CreateTimelineDto): Promise<TimelineResourceResponseDto> {
    const [created] = await this.dbService.db
      .insert(timelines)
      .values({
        ownerUserId: identity.userId,
        visibility: RESOURCE_VISIBILITY.private,
        title: dto.title,
        description: dto.description ?? null,
        contentJson: dto.contentJson,
        hasAnonymizedContent: dto.hasAnonymizedContent ?? false,
      })
      .returning();

    if (!created) {
      throw new BadRequestException('Timeline creation failed');
    }

    return this.toResponse(created);
  }

  async list(identity: IdentityContext): Promise<TimelineResourceResponseDto[]> {
    const resources = await this.dbService.db.query.timelines.findMany({
      where: eq(timelines.ownerUserId, identity.userId),
    });

    return resources.map((resource) => this.toResponse(resource));
  }

  async getById(timelineId: string, identity: IdentityContext): Promise<TimelineResourceResponseDto> {
    const existing = await this.dbService.db.query.timelines.findFirst({
      where: eq(timelines.id, timelineId),
    });

    this.accessControlService.assertTimelineOwner(identity, existing);
    return this.toResponse(existing);
  }

  async patchById(
    timelineId: string,
    identity: IdentityContext,
    dto: PatchTimelineDto,
  ): Promise<TimelineResourceResponseDto> {
    const existing = await this.dbService.db.query.timelines.findFirst({
      where: eq(timelines.id, timelineId),
    });

    this.accessControlService.assertTimelineOwner(identity, existing);

    const [updated] = await this.dbService.db
      .update(timelines)
      .set({
        title: dto.title ?? existing.title,
        description: dto.description === undefined ? existing.description : dto.description,
        contentJson: dto.contentJson,
        hasAnonymizedContent: dto.hasAnonymizedContent ?? existing.hasAnonymizedContent,
        updatedAt: new Date(),
      })
      .where(eq(timelines.id, timelineId))
      .returning();

    if (!updated) {
      throw new BadRequestException('Timeline update failed');
    }

    return this.toResponse(updated);
  }

  async deleteById(timelineId: string, identity: IdentityContext): Promise<void> {
    const existing = await this.dbService.db.query.timelines.findFirst({
      where: eq(timelines.id, timelineId),
    });

    this.accessControlService.assertTimelineOwner(identity, existing);

    await this.dbService.db.delete(timelines).where(eq(timelines.id, timelineId));
  }

  private toResponse(resource: typeof timelines.$inferSelect): TimelineResourceResponseDto {
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
