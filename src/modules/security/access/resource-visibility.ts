export const RESOURCE_VISIBILITY = {
  private: 'private',
  club: 'club',
  public: 'public',
} as const;

export type ResourceVisibility = (typeof RESOURCE_VISIBILITY)[keyof typeof RESOURCE_VISIBILITY];
