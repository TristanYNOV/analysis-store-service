import { Body, Controller, Post } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { PanelImportPreview, TimelineImportPreview } from './import-validation.schemas';
import { recordImportValidation } from '../../observability/metrics';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('timelines/validate')
  validateTimeline(@Body() payload: unknown): TimelineImportPreview {
    const preview = this.importsService.validateTimelineImport(payload);
    recordImportValidation('timeline', preview.valid);
    return preview;
  }

  @Post('panels/validate')
  validatePanel(@Body() payload: unknown): PanelImportPreview {
    const preview = this.importsService.validatePanelImport(payload);
    recordImportValidation('panel', preview.valid);
    return preview;
  }
}
