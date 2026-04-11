import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { SecurityModule } from '../security/security.module';
import { ResourceViewModule } from '../resource-view/resource-view.module';
import { TimelinesController } from './timelines.controller';
import { TimelinesService } from './timelines.service';

@Module({
  imports: [DbModule, SecurityModule, ResourceViewModule],
  controllers: [TimelinesController],
  providers: [TimelinesService],
})
export class TimelinesModule {}
