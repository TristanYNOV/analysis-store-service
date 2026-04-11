import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { IDENTITY_HEADERS } from './identity-context.types';

@Injectable()
export class IdentityContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const identityContext = req.identityContext;

    if (!identityContext) {
      throw new UnauthorizedException(
        `Missing identity context header: ${IDENTITY_HEADERS.userId}. Service must run behind trusted gateway.`,
      );
    }

    return true;
  }
}
