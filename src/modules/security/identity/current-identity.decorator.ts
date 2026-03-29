import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IDENTITY_CONTEXT_REQUEST_KEY } from './identity-context.constants';
import { IdentityContext } from './identity-context.types';

export const CurrentIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IdentityContext | null => {
    const req = context.switchToHttp().getRequest<Request>();
    return (req[IDENTITY_CONTEXT_REQUEST_KEY] as IdentityContext | null | undefined) ?? null;
  },
);
