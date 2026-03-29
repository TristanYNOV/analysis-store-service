import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { IDENTITY_HEADERS, IdentityContext } from './identity-context.types';
import { parseIdentityListHeader } from './identity-context.parser';

function readHeader(req: Request, headerName: string): string | undefined {
  const value = req.headers[headerName];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

@Injectable()
export class IdentityContextExtractor {
  extract(req: Request): IdentityContext | null {
    const userId = readHeader(req, IDENTITY_HEADERS.userId)?.trim();

    if (!userId) {
      return null;
    }

    if (userId.length < 3) {
      throw new BadRequestException(
        `Invalid identity header format for ${IDENTITY_HEADERS.userId}: value is too short`,
      );
    }

    const clubIds = parseIdentityListHeader(
      readHeader(req, IDENTITY_HEADERS.clubIds),
      IDENTITY_HEADERS.clubIds,
    );

    const roles = parseIdentityListHeader(
      readHeader(req, IDENTITY_HEADERS.roles),
      IDENTITY_HEADERS.roles,
    );

    return {
      userId,
      clubIds,
      roles,
      claims: {
        [IDENTITY_HEADERS.userId]: userId,
        [IDENTITY_HEADERS.clubIds]: clubIds,
        [IDENTITY_HEADERS.roles]: roles,
      },
    };
  }
}
