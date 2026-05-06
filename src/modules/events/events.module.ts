import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { DbModule } from '../../db/db.module';
import { RabbitmqBusinessMetricsService } from '../../observability/rabbitmq-business-metrics.service';
import { RabbitmqService } from './rabbitmq.service';
import { UserDeletionCleanupService } from './user-deletion-cleanup.service';
import { UserDeletionConsumerService } from './user-deletion-consumer.service';

@Module({
  imports: [AppConfigModule, DbModule],
  providers: [
    RabbitmqBusinessMetricsService,
    RabbitmqService,
    UserDeletionCleanupService,
    UserDeletionConsumerService,
  ],
  exports: [
    RabbitmqBusinessMetricsService,
    RabbitmqService,
    UserDeletionCleanupService,
    UserDeletionConsumerService,
  ],
})
export class EventsModule {}
