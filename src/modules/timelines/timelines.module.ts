import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { SecurityModule } from '../security/security.module';
import { TimelinesController } from './timelines.controller';
import { TimelinesService } from './timelines.service';

@Module({
  imports: [DbModule, SecurityModule],
  controllers: [TimelinesController],
  providers: [TimelinesService],
})
export class TimelinesModule {}
