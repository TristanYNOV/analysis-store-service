import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { SecurityModule } from '../security/security.module';
import { ResourceViewModule } from '../resource-view/resource-view.module';
import { PanelsController } from './panels.controller';
import { PanelsService } from './panels.service';

@Module({
  imports: [DbModule, SecurityModule, ResourceViewModule],
  controllers: [PanelsController],
  providers: [PanelsService],
})
export class PanelsModule {}
