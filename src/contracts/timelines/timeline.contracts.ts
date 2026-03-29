import { ResourceVisibilityDto } from '../shared/resource-visibility.contract';

export interface CreateTimelineDto {
  title: string;
  description?: string;
  visibility: ResourceVisibilityDto;
  clubId?: string;
  content: Record<string, unknown>;
}

export interface TimelineResponseDto {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  visibility: ResourceVisibilityDto;
  clubId?: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineImportPreviewDto {
  dryRunId: string;
  sourceType: 'csv' | 'json';
  parsedItems: number;
  warnings: string[];
  dataPreview: Record<string, unknown>;
}
