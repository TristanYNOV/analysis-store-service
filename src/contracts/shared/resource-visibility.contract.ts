export const RESOURCE_VISIBILITIES = ['private', 'club', 'public'] as const;
export type ResourceVisibilityDto = (typeof RESOURCE_VISIBILITIES)[number];
