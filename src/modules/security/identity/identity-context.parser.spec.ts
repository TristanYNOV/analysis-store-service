import { BadRequestException } from '@nestjs/common';
import { parseIdentityListHeader } from './identity-context.parser';

describe('parseIdentityListHeader', () => {
  it('parses CSV values', () => {
    expect(parseIdentityListHeader('club-a, club-b, club-a', 'x-auth-club-ids')).toEqual([
      'club-a',
      'club-b',
    ]);
  });

  it('parses JSON array values', () => {
    expect(parseIdentityListHeader('["admin","editor"]', 'x-auth-roles')).toEqual([
      'admin',
      'editor',
    ]);
  });

  it('returns empty array for undefined values', () => {
    expect(parseIdentityListHeader(undefined, 'x-auth-roles')).toEqual([]);
  });

  it('throws for invalid JSON payload', () => {
    expect(() => parseIdentityListHeader('[admin,editor]', 'x-auth-roles')).toThrow(
      BadRequestException,
    );
  });
});
