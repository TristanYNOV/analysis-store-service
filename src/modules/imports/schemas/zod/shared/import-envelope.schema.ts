import {
  PANEL_TYPE,
  SCHEMA_VERSION_V1,
  SupportedImportType,
  TIMELINE_TYPE,
} from '../../constants/import-format-v1.constants';

export interface ImportEnvelopeV1 {
  schemaVersion: typeof SCHEMA_VERSION_V1;
  type: SupportedImportType;
}

export const SUPPORTED_IMPORT_TYPES: SupportedImportType[] = [TIMELINE_TYPE, PANEL_TYPE];
