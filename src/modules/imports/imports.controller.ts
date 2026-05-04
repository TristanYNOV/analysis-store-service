import { Body, Controller, Post } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { PanelImportPreview, TimelineImportPreview } from './import-validation.schemas';
import {
  analysisImportValidationFailedTotal,
  analysisImportValidationTotal,
} from '../../observability/metrics';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('timelines/validate')
  validateTimeline(@Body() payload: unknown): TimelineImportPreview {
    const preview = this.importsService.validateTimelineImport(payload);
    const result = preview.valid ? 'success' : 'failure';

    analysisImportValidationTotal
      .labels('timeline', 'validate_import', result)
      .inc();

    if (!preview.valid) {
      analysisImportValidationFailedTotal
        .labels('timeline', 'validate_import', 'failure')
        .inc();
    }

    return preview;
  }

  @Post('panels/validate')
  validatePanel(@Body() payload: unknown): PanelImportPreview {
    const preview = this.importsService.validatePanelImport(payload);
    const result = preview.valid ? 'success' : 'failure';

    analysisImportValidationTotal
      .labels('panel', 'validate_import', result)
      .inc();

    if (!preview.valid) {
      analysisImportValidationFailedTotal
        .labels('panel', 'validate_import', 'failure')
        .inc();
    }

    return preview;
  }
}
