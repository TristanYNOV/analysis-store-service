import { Body, Controller, Post } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { PanelImportPreview, TimelineImportPreview } from './import-validation.schemas';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('timelines/validate')
  validateTimeline(@Body() payload: unknown): TimelineImportPreview {
    return this.importsService.validateTimelineImport(payload);
  }

  @Post('panels/validate')
  validatePanel(@Body() payload: unknown): PanelImportPreview {
    return this.importsService.validatePanelImport(payload);
  }
}
