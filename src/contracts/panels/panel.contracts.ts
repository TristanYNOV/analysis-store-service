import { ResourceVisibilityDto } from '../shared/resource-visibility.contract';

export interface CreatePanelDto {
  timelineId: string;
  title: string;
  visibility: ResourceVisibilityDto;
  clubId?: string;
  content: Record<string, unknown>;
}

export interface PanelResponseDto {
  id: string;
  timelineId: string;
  ownerId: string;
  title: string;
  visibility: ResourceVisibilityDto;
  clubId?: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PanelImportPreviewDto {
  dryRunId: string;
  sourceType: 'csv' | 'json';
  parsedPanels: number;
  warnings: string[];
  dataPreview: Record<string, unknown>;
}
