import { AppConfigService } from '../../config/app-config.service';
import { USER_DATA_ANONYMIZED, USER_DELETION_REQUESTED, UserDeletionRequestedEvent } from './event-contracts';
import { RabbitmqService } from './rabbitmq.service';
import { UserDeletionCleanupService } from './user-deletion-cleanup.service';
import { UserDeletionConsumerService } from './user-deletion-consumer.service';

function buildEvent(overrides: Partial<UserDeletionRequestedEvent> = {}): UserDeletionRequestedEvent {
  return {
    eventId: 'event-1',
    eventType: USER_DELETION_REQUESTED,
    version: 1,
    occurredAt: '2026-05-04T15:00:00.000Z',
    producer: 'auth-service',
    correlationId: 'workflow-1',
    data: {
      userId: 'user-1',
      requestedBy: 'self',
      reason: 'user_request',
    },
    ...overrides,
  };
}

describe('UserDeletionConsumerService', () => {
  const metrics = {
    recordPublishedEvent: jest.fn(),
    recordConsumedEvent: jest.fn(),
    recordCleanupResources: jest.fn(),
    startPublishTimer: jest.fn(),
    startProcessingTimer: jest.fn(() => jest.fn()),
    startCleanupTimer: jest.fn(() => jest.fn()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes confirmation and records the processed event', async () => {
    const insertValues = jest.fn().mockResolvedValue(undefined);
    const dbService = {
      db: {
        query: {
          processedEvents: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        },
        insert: jest.fn().mockReturnValue({ values: insertValues }),
      },
    };

    const rabbitmqService = {
      publish: jest.fn().mockResolvedValue(undefined),
      isConfigured: true,
    };

    const cleanupService = {
      cleanupUserData: jest.fn().mockResolvedValue({
        deletedResources: { timelines: 2, privatePanels: 1 },
        anonymizedResources: { publicPanels: 3 },
      }),
    };

    const service = new UserDeletionConsumerService(
      { nodeEnv: 'test', rabbitmqQueueAnalysisStore: 'analysis-store-service.user-deletion' } as AppConfigService,
      rabbitmqService as unknown as RabbitmqService,
      cleanupService as unknown as UserDeletionCleanupService,
      dbService as never,
      metrics as never,
    );

    const confirmation = await service.handleEvent(buildEvent());

    expect(cleanupService.cleanupUserData).toHaveBeenCalledWith('user-1');
    expect(rabbitmqService.publish).toHaveBeenCalledWith(
      USER_DATA_ANONYMIZED,
      expect.objectContaining({
        eventType: USER_DATA_ANONYMIZED,
        correlationId: 'workflow-1',
        producer: 'analysis-store-service',
        data: expect.objectContaining({
          userId: 'user-1',
          service: 'analysis-store-service',
          deletedResources: { timelines: 2, privatePanels: 1 },
          anonymizedResources: { publicPanels: 3 },
        }),
      }),
    );
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-1',
        eventType: USER_DELETION_REQUESTED,
      }),
    );
    expect(confirmation?.eventType).toBe(USER_DATA_ANONYMIZED);
    expect(metrics.recordCleanupResources).toHaveBeenCalledWith({
      deletedResources: { timelines: 2, privatePanels: 1 },
      anonymizedResources: { publicPanels: 3 },
    });
    expect(metrics.recordConsumedEvent).toHaveBeenCalledWith(
      USER_DELETION_REQUESTED,
      USER_DELETION_REQUESTED,
      'success',
    );
  });

  it('is idempotent when the event was already processed', async () => {
    const dbService = {
      db: {
        query: {
          processedEvents: {
            findFirst: jest.fn().mockResolvedValue({ eventId: 'event-1' }),
          },
        },
      },
    };

    const rabbitmqService = {
      publish: jest.fn(),
      isConfigured: true,
    };
    const cleanupService = {
      cleanupUserData: jest.fn(),
    };

    const service = new UserDeletionConsumerService(
      { nodeEnv: 'test', rabbitmqQueueAnalysisStore: 'analysis-store-service.user-deletion' } as AppConfigService,
      rabbitmqService as unknown as RabbitmqService,
      cleanupService as unknown as UserDeletionCleanupService,
      dbService as never,
      metrics as never,
    );

    await expect(service.handleEvent(buildEvent())).resolves.toBeNull();
    expect(cleanupService.cleanupUserData).not.toHaveBeenCalled();
    expect(rabbitmqService.publish).not.toHaveBeenCalled();
    expect(metrics.recordConsumedEvent).toHaveBeenCalledWith(
      USER_DELETION_REQUESTED,
      USER_DELETION_REQUESTED,
      'duplicate',
    );
  });
});
