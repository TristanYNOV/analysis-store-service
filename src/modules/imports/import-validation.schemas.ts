import {
  PANEL_TYPE,
  SCHEMA_VERSION_V1,
  SupportedImportType,
  TIMELINE_TYPE,
} from './schemas/constants/import-format-v1.constants';
import { SequencerPanelImportSchemaV1 } from './schemas/zod/panel/sequencer-panel-import.schema';
import { AnalysisTimelineImportSchemaV1 } from './schemas/zod/timeline/analysis-timeline-import.schema';

export const IMPORT_SCHEMA_VERSION = SCHEMA_VERSION_V1;

export type ImportType = SupportedImportType;

export type RawTimelineImport = AnalysisTimelineImportSchemaV1;
export type RawPanelImport = SequencerPanelImportSchemaV1;

export interface ReadableValidationError {
  code: string;
  path: Array<string | number>;
  message: string;
}

export interface TimelineImportPreview {
  type: typeof TIMELINE_TYPE;
  schemaVersion: typeof SCHEMA_VERSION_V1;
  valid: boolean;
  detectedType: ImportType | null;
  summary: {
    timelineName: string | null;
    eventDefCount: number;
    labelDefCount: number;
    occurrenceCount: number;
  };
  normalizedPayload: RawTimelineImport | null;
  errors: ReadableValidationError[];
}

export interface PanelImportPreview {
  type: typeof PANEL_TYPE;
  schemaVersion: typeof SCHEMA_VERSION_V1;
  valid: boolean;
  detectedType: ImportType | null;
  summary: {
    panelName: string | null;
    buttonCount: number;
    eventButtonCount: number;
    labelButtonCount: number;
    statButtonCount: number;
  };
  normalizedPayload: RawPanelImport | null;
  errors: ReadableValidationError[];
}
