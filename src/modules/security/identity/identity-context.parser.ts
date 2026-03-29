import { BadRequestException } from '@nestjs/common';

function splitCsv(raw: string): string[] {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeArray(items: unknown[], headerName: string): string[] {
  const parsed = items
    .map((entry) => {
      if (typeof entry !== 'string') {
        throw new BadRequestException(
          `Invalid identity header format for ${headerName}: array values must be strings`,
        );
      }

      return entry.trim();
    })
    .filter((entry) => entry.length > 0);

  return [...new Set(parsed)];
}

export function parseIdentityListHeader(rawValue: string | undefined, headerName: string): string[] {
  if (!rawValue || rawValue.trim().length === 0) {
    return [];
  }

  const value = rawValue.trim();

  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (!Array.isArray(parsed)) {
        throw new BadRequestException(
          `Invalid identity header format for ${headerName}: JSON payload must be an array`,
        );
      }

      return normalizeArray(parsed, headerName);
    } catch {
      throw new BadRequestException(
        `Invalid identity header format for ${headerName}: expected CSV or JSON string array`,
      );
    }
  }

  return [...new Set(splitCsv(value))];
}
