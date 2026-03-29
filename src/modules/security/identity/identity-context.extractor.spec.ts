import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { IdentityContextExtractor } from './identity-context.extractor';

function makeRequest(headers: Record<string, string>): Request {
  return { headers } as unknown as Request;
}

describe('IdentityContextExtractor', () => {
  const extractor = new IdentityContextExtractor();

  it('returns null when user id header is missing', () => {
    expect(extractor.extract(makeRequest({}))).toBeNull();
  });

  it('extracts identity context from headers', () => {
    const context = extractor.extract(
      makeRequest({
        'x-auth-user-id': 'user-1',
        'x-auth-club-ids': 'club-1,club-2',
        'x-auth-roles': '["analyst"]',
      }),
    );

    expect(context).toEqual({
      userId: 'user-1',
      clubIds: ['club-1', 'club-2'],
      roles: ['analyst'],
      claims: {
        'x-auth-user-id': 'user-1',
        'x-auth-club-ids': ['club-1', 'club-2'],
        'x-auth-roles': ['analyst'],
      },
    });
  });

  it('throws when user id is invalid', () => {
    expect(() => extractor.extract(makeRequest({ 'x-auth-user-id': 'ab' }))).toThrow(
      BadRequestException,
    );
  });
});
