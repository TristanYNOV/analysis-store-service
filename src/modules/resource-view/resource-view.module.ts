import { Module } from '@nestjs/common';
import { RedactionService } from './redaction.service';
import { ResourceViewService } from './resource-view.service';

@Module({
  providers: [RedactionService, ResourceViewService],
  exports: [RedactionService, ResourceViewService],
})
export class ResourceViewModule {}
