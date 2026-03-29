import { IdentityContext } from '../modules/security/identity/identity-context.types';

declare module 'express-serve-static-core' {
  interface Request {
    identityContext?: IdentityContext | null;
  }
}
