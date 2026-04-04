import { Injectable } from '@nestjs/common';
import {
  IMPORT_SCHEMA_VERSION,
  ImportType,
  PanelImportPreview,
  ReadableValidationError,
  TimelineImportPreview,
} from './import-validation.schemas';
import { PANEL_TYPE, TIMELINE_TYPE } from './schemas/constants/import-format-v1.constants';
import { sequencerPanelImportSchemaV1 } from './schemas/zod/panel/sequencer-panel-import.schema';
import { analysisTimelineImportSchemaV1 } from './schemas/zod/timeline/analysis-timeline-import.schema';

@Injectable()
export class ImportsService {
  validateTimelineImport(payload: unknown): TimelineImportPreview {
    const detectedType = this.readDetectedType(payload);

    if (detectedType !== null && detectedType !== TIMELINE_TYPE) {
      return {
        type: TIMELINE_TYPE,
        schemaVersion: IMPORT_SCHEMA_VERSION,
        valid: false,
        detectedType,
        summary: {
          timelineName: null,
          eventDefCount: 0,
          labelDefCount: 0,
          occurrenceCount: 0,
        },
        normalizedPayload: null,
        errors: [
          {
            code: 'TYPE_MISMATCH',
            path: ['type'],
            message: `Expected import type "${TIMELINE_TYPE}" for this endpoint, received "${detectedType}".`,
          },
        ],
      };
    }

    const parsed = analysisTimelineImportSchemaV1.safeParse(payload);

    if (!parsed.success) {
      return {
        type: TIMELINE_TYPE,
        schemaVersion: IMPORT_SCHEMA_VERSION,
        valid: false,
        detectedType,
        summary: {
          timelineName: null,
          eventDefCount: 0,
          labelDefCount: 0,
          occurrenceCount: 0,
        },
        normalizedPayload: null,
        errors: this.mapIssues(parsed.error.issues),
      };
    }

    return {
      type: TIMELINE_TYPE,
      schemaVersion: parsed.data.schemaVersion,
      valid: true,
      detectedType: parsed.data.type,
      summary: {
        timelineName: parsed.data.timelineName,
        eventDefCount: parsed.data.eventDefs.length,
        labelDefCount: parsed.data.labelDefs.length,
        occurrenceCount: parsed.data.occurrences.length,
      },
      normalizedPayload: parsed.data,
      errors: [],
    };
  }

  validatePanelImport(payload: unknown): PanelImportPreview {
    const detectedType = this.readDetectedType(payload);

    if (detectedType !== null && detectedType !== PANEL_TYPE) {
      return {
        type: PANEL_TYPE,
        schemaVersion: IMPORT_SCHEMA_VERSION,
        valid: false,
        detectedType,
        summary: {
          panelName: null,
          buttonCount: 0,
          eventButtonCount: 0,
          labelButtonCount: 0,
          statButtonCount: 0,
        },
        normalizedPayload: null,
        errors: [
          {
            code: 'TYPE_MISMATCH',
            path: ['type'],
            message: `Expected import type "${PANEL_TYPE}" for this endpoint, received "${detectedType}".`,
          },
        ],
      };
    }

    const parsed = sequencerPanelImportSchemaV1.safeParse(payload);

    if (!parsed.success) {
      return {
        type: PANEL_TYPE,
        schemaVersion: IMPORT_SCHEMA_VERSION,
        valid: false,
        detectedType,
        summary: {
          panelName: null,
          buttonCount: 0,
          eventButtonCount: 0,
          labelButtonCount: 0,
          statButtonCount: 0,
        },
        normalizedPayload: null,
        errors: this.mapIssues(parsed.error.issues),
      };
    }

    const eventButtonCount = parsed.data.btnList.filter((button) => button.type === 'event').length;
    const labelButtonCount = parsed.data.btnList.filter((button) => button.type === 'label').length;
    const statButtonCount = parsed.data.btnList.filter((button) => button.type === 'stat').length;

    return {
      type: PANEL_TYPE,
      schemaVersion: parsed.data.schemaVersion,
      valid: true,
      detectedType: parsed.data.type,
      summary: {
        panelName: parsed.data.panelName,
        buttonCount: parsed.data.btnList.length,
        eventButtonCount,
        labelButtonCount,
        statButtonCount,
      },
      normalizedPayload: parsed.data,
      errors: [],
    };
  }

  private readDetectedType(payload: unknown): ImportType | null {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return null;
    }

    const value = (payload as Record<string, unknown>).type;

    if (value === TIMELINE_TYPE || value === PANEL_TYPE) {
      return value;
    }

    return null;
  }

  private mapIssues(
    issues: Array<{
      path: Array<string | number>;
      message: string;
    }>,
  ): ReadableValidationError[] {
    return issues.map((issue) => ({
      code: 'invalid_payload',
      path: issue.path,
      message: issue.message,
    }));
  }
}
