import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { SecurityModule } from '../security/security.module';
import { PanelsController } from './panels.controller';
import { PanelsService } from './panels.service';

@Module({
  imports: [DbModule, SecurityModule],
  controllers: [PanelsController],
  providers: [PanelsService],
})
export class PanelsModule {}
