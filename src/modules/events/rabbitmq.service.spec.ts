import { RabbitmqBusinessMetricsService } from '../../observability/rabbitmq-business-metrics.service';
import { AppConfigService } from '../../config/app-config.service';
import { USER_DATA_ANONYMIZED } from './event-contracts';
import { RabbitmqService } from './rabbitmq.service';

describe('RabbitmqService metrics', () => {
  function buildMetrics() {
    return {
      recordPublishedEvent: jest.fn(),
      startPublishTimer: jest.fn(() => jest.fn()),
    } as unknown as RabbitmqBusinessMetricsService;
  }

  const appConfig = {
    rabbitmqExchange: 'domain.events',
    rabbitmqUrl: 'amqp://test',
  } as AppConfigService;

  it('records successful business event publication', async () => {
    const metrics = buildMetrics();
    const service = new RabbitmqService(appConfig, metrics);
    const channel = {
      publish: jest.fn().mockReturnValue(true),
    };
    (service as unknown as { channel: typeof channel }).channel = channel;

    await service.publish(USER_DATA_ANONYMIZED, {
      eventId: 'event-1',
      eventType: USER_DATA_ANONYMIZED,
      version: 1,
      occurredAt: '2026-05-06T00:00:00.000Z',
      producer: 'analysis-store-service',
      correlationId: 'workflow-1',
      data: {},
    });

    expect(metrics.recordPublishedEvent).toHaveBeenCalledWith(
      USER_DATA_ANONYMIZED,
      USER_DATA_ANONYMIZED,
      'success',
    );
  });

  it('records failed business event publication', async () => {
    const metrics = buildMetrics();
    const service = new RabbitmqService(appConfig, metrics);
    const channel = {
      publish: jest.fn().mockReturnValue(false),
    };
    (service as unknown as { channel: typeof channel }).channel = channel;

    await expect(
      service.publish(USER_DATA_ANONYMIZED, {
        eventId: 'event-1',
        eventType: USER_DATA_ANONYMIZED,
        version: 1,
        occurredAt: '2026-05-06T00:00:00.000Z',
        producer: 'analysis-store-service',
        correlationId: 'workflow-1',
        data: {},
      }),
    ).rejects.toThrow('RabbitMQ publish returned false');

    expect(metrics.recordPublishedEvent).toHaveBeenCalledWith(
      USER_DATA_ANONYMIZED,
      USER_DATA_ANONYMIZED,
      'failure',
    );
  });
});
