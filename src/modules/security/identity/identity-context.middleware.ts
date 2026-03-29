import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { IdentityContextExtractor } from './identity-context.extractor';
import { IDENTITY_CONTEXT_REQUEST_KEY } from './identity-context.constants';

@Injectable()
export class IdentityContextMiddleware implements NestMiddleware {
  constructor(private readonly extractor: IdentityContextExtractor) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const context = this.extractor.extract(req);
    req[IDENTITY_CONTEXT_REQUEST_KEY] = context;
    next();
  }
}
