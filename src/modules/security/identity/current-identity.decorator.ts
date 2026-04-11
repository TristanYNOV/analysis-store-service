import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IdentityContext } from './identity-context.types';

export const CurrentIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IdentityContext | null => {
    const req = context.switchToHttp().getRequest<Request>();
    return req.identityContext ?? null;
  },
);
