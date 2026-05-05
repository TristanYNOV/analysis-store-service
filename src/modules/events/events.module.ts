import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { DbModule } from '../../db/db.module';
import { RabbitmqService } from './rabbitmq.service';
import { UserDeletionCleanupService } from './user-deletion-cleanup.service';
import { UserDeletionConsumerService } from './user-deletion-consumer.service';

@Module({
  imports: [AppConfigModule, DbModule],
  providers: [RabbitmqService, UserDeletionCleanupService, UserDeletionConsumerService],
  exports: [RabbitmqService, UserDeletionCleanupService, UserDeletionConsumerService],
})
export class EventsModule {}
