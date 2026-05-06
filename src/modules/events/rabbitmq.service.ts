import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { RabbitmqBusinessMetricsService } from '../../observability/rabbitmq-business-metrics.service';
import { DomainEvent } from './event-contracts';

type RabbitMessage = {
  content: Buffer;
};

type RabbitChannel = {
  assertExchange(exchange: string, type: string, options: { durable: boolean }): Promise<unknown>;
  assertQueue(queue: string, options: { durable: boolean }): Promise<unknown>;
  bindQueue(queue: string, exchange: string, routingKey: string): Promise<unknown>;
  prefetch(count: number): Promise<unknown>;
  publish(exchange: string, routingKey: string, content: Buffer, options: Record<string, unknown>): boolean;
  consume(queue: string, onMessage: (message: RabbitMessage | null) => void, options: { noAck: boolean }): Promise<unknown>;
  ack(message: RabbitMessage): void;
  nack(message: RabbitMessage, allUpTo?: boolean, requeue?: boolean): void;
  close(): Promise<void>;
};

type RabbitConnection = {
  createChannel(): Promise<RabbitChannel>;
  close(): Promise<void>;
};

@Injectable()
export class RabbitmqService implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection?: RabbitConnection;
  private channel?: RabbitChannel;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly metrics: RabbitmqBusinessMetricsService,
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.appConfig.rabbitmqUrl);
  }

  async publish<TData extends Record<string, unknown>>(
    routingKey: string,
    event: DomainEvent<TData>,
  ): Promise<void> {
    const endTimer = this.metrics.startPublishTimer(event.eventType, routingKey);

    try {
      const channel = await this.getChannel();
      const published = channel.publish(
        this.appConfig.rabbitmqExchange,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          contentType: 'application/json',
          deliveryMode: 2,
          persistent: true,
          messageId: event.eventId,
          correlationId: event.correlationId,
          timestamp: Date.now(),
        },
      );

      if (!published) {
        throw new Error(`RabbitMQ publish returned false for ${routingKey}`);
      }

      this.metrics.recordPublishedEvent(event.eventType, routingKey, 'success');
      endTimer('success');
    } catch (error) {
      this.metrics.recordPublishedEvent(event.eventType, routingKey, 'failure');
      endTimer('failure');
      throw error;
    }
  }

  async consume(
    queueName: string,
    routingKey: string,
    handler: (message: RabbitMessage, channel: RabbitChannel) => Promise<void>,
  ): Promise<void> {
    const channel = await this.getChannel();
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, this.appConfig.rabbitmqExchange, routingKey);
    await channel.prefetch(1);
    await channel.consume(
      queueName,
      (message) => {
        if (!message) {
          return;
        }

        void handler(message, channel);
      },
      { noAck: false },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch((error: unknown) => {
      this.logger.warn(`RabbitMQ channel close failed: ${(error as Error).message}`);
    });
    await this.connection?.close().catch((error: unknown) => {
      this.logger.warn(`RabbitMQ connection close failed: ${(error as Error).message}`);
    });
  }

  private async getChannel(): Promise<RabbitChannel> {
    if (this.channel) {
      return this.channel;
    }

    if (!this.appConfig.rabbitmqUrl) {
      throw new Error('RabbitMQ is not configured: missing RABBITMQ_URL');
    }

    const amqpModule = (await import('amqplib')) as {
      default?: { connect(url: string): Promise<RabbitConnection> };
      connect?: (url: string) => Promise<RabbitConnection>;
    };
    const amqp = amqpModule.default ?? amqpModule;
    if (!amqp.connect) {
      throw new Error('Invalid amqplib module: missing connect');
    }

    try {
      this.connection = await amqp.connect(this.appConfig.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.appConfig.rabbitmqExchange, 'topic', {
        durable: true,
      });

      return this.channel;
    } catch (error) {
      await this.resetConnection();
      throw error;
    }
  }

  private async resetConnection(): Promise<void> {
    const channel = this.channel;
    const connection = this.connection;
    this.channel = undefined;
    this.connection = undefined;

    await channel?.close().catch(() => undefined);
    await connection?.close().catch(() => undefined);
  }
}
