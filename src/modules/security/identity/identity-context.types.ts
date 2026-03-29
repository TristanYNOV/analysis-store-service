export const IDENTITY_HEADERS = {
  userId: 'x-auth-user-id',
  clubIds: 'x-auth-club-ids',
  roles: 'x-auth-roles',
} as const;

export interface IdentityContext {
  userId: string;
  clubIds: string[];
  roles: string[];
  claims?: Record<string, string | string[] | undefined>;
}
