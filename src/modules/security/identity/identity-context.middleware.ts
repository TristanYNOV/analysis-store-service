import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { IdentityContextExtractor } from './identity-context.extractor';

@Injectable()
export class IdentityContextMiddleware implements NestMiddleware {
  constructor(private readonly extractor: IdentityContextExtractor) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const context = this.extractor.extract(req);
    req.identityContext = context;
    next();
  }
}
