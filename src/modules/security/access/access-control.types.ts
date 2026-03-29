import { ResourceVisibility } from './resource-visibility';

export interface TimelineOwnership {
  ownerId: string;
}

export interface PanelAccessResource {
  ownerId: string;
  visibility: ResourceVisibility;
  clubId?: string | null;
}
