import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { AppConfigService } from '../../config/app-config.service';
import { DbService } from '../../db/db.service';
import { processedEvents } from '../../db/schema';
import { RabbitmqBusinessMetricsService } from '../../observability/rabbitmq-business-metrics.service';
import {
  USER_DATA_ANONYMIZED,
  USER_DELETION_REQUESTED,
  UserDataAnonymizedEvent,
  UserDeletionRequestedEvent,
} from './event-contracts';
import { RabbitmqService } from './rabbitmq.service';
import { UserDeletionCleanupService } from './user-deletion-cleanup.service';

type RabbitMessage = {
  content: Buffer;
};

type RabbitChannel = {
  ack(message: RabbitMessage): void;
  nack(message: RabbitMessage, allUpTo?: boolean, requeue?: boolean): void;
};

@Injectable()
export class UserDeletionConsumerService implements OnModuleInit {
  private readonly logger = new Logger(UserDeletionConsumerService.name);
  private consumerStarted = false;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly cleanupService: UserDeletionCleanupService,
    private readonly dbService: DbService,
    private readonly metrics: RabbitmqBusinessMetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.rabbitmqService.isConfigured || this.appConfig.nodeEnv === 'test') {
      this.logger.warn('RabbitMQ consumer disabled: RABBITMQ_URL is not configured or NODE_ENV=test.');
      return;
    }

    void this.startConsumerWithRetry();
  }

  async handleEvent(event: UserDeletionRequestedEvent): Promise<UserDataAnonymizedEvent | null> {
    const endProcessingTimer = this.metrics.startProcessingTimer(
      event?.eventType ?? 'unknown',
      USER_DELETION_REQUESTED,
    );
    const endCleanupTimer = this.metrics.startCleanupTimer();

    try {
      this.assertValidEvent(event);

      const alreadyProcessed = await this.dbService.db.query.processedEvents.findFirst({
        where: eq(processedEvents.eventId, event.eventId),
      });

      if (alreadyProcessed) {
        this.logger.log(`Ignoring already processed event ${event.eventId}`);
        this.metrics.recordConsumedEvent(USER_DELETION_REQUESTED, USER_DELETION_REQUESTED, 'duplicate');
        endProcessingTimer('duplicate');
        endCleanupTimer('duplicate');
        return null;
      }

      this.logger.log(`Processing ${USER_DELETION_REQUESTED} for user ${event.data.userId}`);
      const cleanupResult = await this.cleanupService.cleanupUserData(event.data.userId);
      this.metrics.recordCleanupResources(cleanupResult);

      const confirmation: UserDataAnonymizedEvent = {
        eventId: randomUUID(),
        eventType: USER_DATA_ANONYMIZED,
        version: 1,
        occurredAt: new Date().toISOString(),
        producer: 'analysis-store-service',
        correlationId: event.correlationId,
        data: {
          userId: event.data.userId,
          service: 'analysis-store-service',
          deletedResources: cleanupResult.deletedResources,
          anonymizedResources: cleanupResult.anonymizedResources,
        },
      };

      await this.rabbitmqService.publish(USER_DATA_ANONYMIZED, confirmation);
      await this.dbService.db.insert(processedEvents).values({
        eventId: event.eventId,
        eventType: event.eventType,
        processedAt: new Date(),
      });

      this.metrics.recordConsumedEvent(USER_DELETION_REQUESTED, USER_DELETION_REQUESTED, 'success');
      endProcessingTimer('success');
      endCleanupTimer('success');

      this.logger.log(
        `Published ${USER_DATA_ANONYMIZED} for user ${event.data.userId}: ` +
          `${cleanupResult.deletedResources.timelines} timelines, ` +
          `${cleanupResult.deletedResources.privatePanels} private panels deleted, ` +
          `${cleanupResult.anonymizedResources.publicPanels} shared panels anonymized.`,
      );

      return confirmation;
    } catch (error) {
      const isInvalid = error instanceof Error && error.message.startsWith('Invalid event');
      const result = isInvalid ? 'invalid' : 'failure';
      this.metrics.recordConsumedEvent(USER_DELETION_REQUESTED, USER_DELETION_REQUESTED, result);
      endProcessingTimer(result);
      endCleanupTimer(result);
      throw error;
    }
  }

  private async handleRabbitMessage(message: RabbitMessage, channel: RabbitChannel): Promise<void> {
    const malformedMessageTimer = this.metrics.startProcessingTimer('unknown', USER_DELETION_REQUESTED);
    let parsed = false;

    try {
      const event = JSON.parse(message.content.toString('utf8')) as UserDeletionRequestedEvent;
      parsed = true;
      await this.handleEvent(event);
      channel.ack(message);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unknown RabbitMQ consumer error';
      this.logger.error(`Failed to process ${USER_DELETION_REQUESTED}: ${messageText}`);

      if (!parsed) {
        this.metrics.recordConsumedEvent('unknown', USER_DELETION_REQUESTED, 'invalid');
        malformedMessageTimer('invalid');
        channel.ack(message);
        return;
      }

      if (messageText.startsWith('Invalid event')) {
        channel.ack(message);
        return;
      }

      channel.nack(message, false, true);
    }
  }

  private assertValidEvent(event: UserDeletionRequestedEvent): void {
    if (
      !event ||
      event.eventType !== USER_DELETION_REQUESTED ||
      event.version !== 1 ||
      !event.eventId ||
      !event.correlationId ||
      !event.data?.userId
    ) {
      throw new Error(`Invalid event ${USER_DELETION_REQUESTED}`);
    }
  }

  private async startConsumerWithRetry(): Promise<void> {
    let attempt = 1;

    while (!this.consumerStarted) {
      try {
        await this.rabbitmqService.consume(
          this.appConfig.rabbitmqQueueAnalysisStore,
          USER_DELETION_REQUESTED,
          (message, channel) => this.handleRabbitMessage(message, channel),
        );
        this.consumerStarted = true;
        this.logger.log(`Listening for ${USER_DELETION_REQUESTED} on ${this.appConfig.rabbitmqQueueAnalysisStore}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown RabbitMQ connection error';
        const delayMs = Math.min(30000, attempt * 2000);
        this.logger.warn(
          `RabbitMQ consumer startup failed (attempt ${attempt}): ${message}. Retrying in ${delayMs}ms.`,
        );
        await this.delay(delayMs);
        attempt += 1;
      }
    }
  }

  private delay(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }
}
