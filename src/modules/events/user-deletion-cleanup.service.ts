import { Injectable } from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import { DbService } from '../../db/db.service';
import { panels, timelines } from '../../db/schema';
import { RESOURCE_VISIBILITY } from '../security/access/resource-visibility';

export type UserDeletionCleanupResult = {
  deletedResources: {
    timelines: number;
    privatePanels: number;
  };
  anonymizedResources: {
    publicPanels: number;
  };
};

const DELETED_USER_OWNER_ID = 'deleted-user';
const DELETED_USER_PANEL_TITLE = 'Panel utilisateur supprime';

@Injectable()
export class UserDeletionCleanupService {
  constructor(private readonly dbService: DbService) {}

  async cleanupUserData(userId: string): Promise<UserDeletionCleanupResult> {
    const deletedTimelines = await this.dbService.db
      .delete(timelines)
      .where(eq(timelines.ownerUserId, userId))
      .returning({ id: timelines.id });

    const deletedPrivatePanels = await this.dbService.db
      .delete(panels)
      .where(and(eq(panels.ownerUserId, userId), eq(panels.visibility, RESOURCE_VISIBILITY.private)))
      .returning({ id: panels.id });

    const anonymizedPanels = await this.dbService.db
      .update(panels)
      .set({
        ownerUserId: DELETED_USER_OWNER_ID,
        title: DELETED_USER_PANEL_TITLE,
        description: null,
        hasAnonymizedContent: true,
        sensitivePayloadEncrypted: null,
        cryptoSuite: null,
        keyVersion: null,
        updatedAt: new Date(),
      })
      .where(and(eq(panels.ownerUserId, userId), ne(panels.visibility, RESOURCE_VISIBILITY.private)))
      .returning({ id: panels.id });

    return {
      deletedResources: {
        timelines: deletedTimelines.length,
        privatePanels: deletedPrivatePanels.length,
      },
      anonymizedResources: {
        publicPanels: anonymizedPanels.length,
      },
    };
  }
}
