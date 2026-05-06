import { Injectable } from '@nestjs/common';
import {
  analysisUserCleanupDurationSeconds,
  analysisUserCleanupResourcesTotal,
  rabbitmqBusinessEventProcessingDurationSeconds,
  rabbitmqBusinessEventPublishDurationSeconds,
  rabbitmqBusinessEventsConsumedTotal,
  rabbitmqBusinessEventsPublishedTotal,
} from './metrics';

type PublishResult = 'success' | 'failure';
type ConsumeResult = 'success' | 'failure' | 'ignored' | 'duplicate' | 'invalid';
type CleanupResult = 'success' | 'failure' | 'duplicate' | 'invalid';
type CleanupResource = 'timeline' | 'private_panel' | 'public_panel';
type CleanupAction = 'deleted' | 'anonymized';

export type UserCleanupResourceCounts = {
  deletedResources: {
    timelines: number;
    privatePanels: number;
  };
  anonymizedResources: {
    publicPanels: number;
  };
};

const EVENT_TYPES = new Set([
  'user.deletion.requested',
  'user.data.anonymized',
]);
const ROUTING_KEYS = EVENT_TYPES;

@Injectable()
export class RabbitmqBusinessMetricsService {
  recordPublishedEvent(
    eventType: string,
    routingKey: string,
    result: PublishResult,
  ): void {
    safeRecord(() => {
      rabbitmqBusinessEventsPublishedTotal
        .labels(eventLabel(eventType), routingKeyLabel(routingKey), result)
        .inc();
    });
  }

  recordConsumedEvent(
    eventType: string,
    routingKey: string,
    result: ConsumeResult,
  ): void {
    safeRecord(() => {
      rabbitmqBusinessEventsConsumedTotal
        .labels(eventLabel(eventType), routingKeyLabel(routingKey), result)
        .inc();
    });
  }

  startPublishTimer(
    eventType: string,
    routingKey: string,
  ): (result: PublishResult) => void {
    const start = process.hrtime.bigint();
    return (result) => {
      safeRecord(() => {
        rabbitmqBusinessEventPublishDurationSeconds
          .labels(eventLabel(eventType), routingKeyLabel(routingKey), result)
          .observe(durationSecondsSince(start));
      });
    };
  }

  startProcessingTimer(
    eventType: string,
    routingKey: string,
  ): (result: ConsumeResult) => void {
    const start = process.hrtime.bigint();
    return (result) => {
      safeRecord(() => {
        rabbitmqBusinessEventProcessingDurationSeconds
          .labels(eventLabel(eventType), routingKeyLabel(routingKey), result)
          .observe(durationSecondsSince(start));
      });
    };
  }

  startCleanupTimer(): (result: CleanupResult) => void {
    const start = process.hrtime.bigint();
    return (result) => {
      safeRecord(() => {
        analysisUserCleanupDurationSeconds
          .labels(result)
          .observe(durationSecondsSince(start));
      });
    };
  }

  recordCleanupResources(resources: UserCleanupResourceCounts): void {
    this.recordCleanupResource(
      'timeline',
      'deleted',
      resources.deletedResources.timelines,
    );
    this.recordCleanupResource(
      'private_panel',
      'deleted',
      resources.deletedResources.privatePanels,
    );
    this.recordCleanupResource(
      'public_panel',
      'anonymized',
      resources.anonymizedResources.publicPanels,
    );
  }

  private recordCleanupResource(
    resource: CleanupResource,
    action: CleanupAction,
    count: number,
  ): void {
    if (count <= 0) {
      return;
    }

    safeRecord(() => {
      analysisUserCleanupResourcesTotal.labels(resource, action).inc(count);
    });
  }
}

function safeRecord(record: () => void): void {
  try {
    record();
  } catch {
    // Metrics must never affect the application flow.
  }
}

function eventLabel(value: string): string {
  return EVENT_TYPES.has(value) ? value : 'unknown';
}

function routingKeyLabel(value: string): string {
  return ROUTING_KEYS.has(value) ? value : 'unknown';
}

function durationSecondsSince(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1e9;
}
