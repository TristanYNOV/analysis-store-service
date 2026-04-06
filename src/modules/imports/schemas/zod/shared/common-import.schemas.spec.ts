import {
  commonExportMetaSchema,
  finiteNumberSchema,
  hexColorSchema,
  isoDateWithOffsetSchema,
  layoutSchema,
  millisecondsIntSchema,
  nullableHotkeySchema,
  schemaVersionV1Schema,
} from './common-import.schemas';

describe('common import schemas', () => {
  it('validates schemaVersion v1 literal', () => {
    expect(schemaVersionV1Schema.safeParse('1.0.0').success).toBe(true);
    expect(schemaVersionV1Schema.safeParse('1').success).toBe(false);
  });

  it('validates ISO date with offset', () => {
    expect(isoDateWithOffsetSchema.safeParse('2026-04-04T09:30:00+02:00').success).toBe(true);
    expect(isoDateWithOffsetSchema.safeParse('2026-04-04').success).toBe(false);
  });

  it('validates non-negative integer milliseconds and finite numbers', () => {
    expect(millisecondsIntSchema.safeParse(0).success).toBe(true);
    expect(millisecondsIntSchema.safeParse(12.5).success).toBe(false);
    expect(millisecondsIntSchema.safeParse(-1).success).toBe(false);

    expect(finiteNumberSchema.safeParse(12.5).success).toBe(true);
    expect(finiteNumberSchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
  });

  it('validates hex colors and nullable hotkeys', () => {
    expect(hexColorSchema.safeParse('#A1B2C3').success).toBe(true);
    expect(hexColorSchema.safeParse('blue').success).toBe(false);

    expect(nullableHotkeySchema.safeParse(null).success).toBe(true);
    expect(nullableHotkeySchema.safeParse('Ctrl+K').success).toBe(true);
    expect(nullableHotkeySchema.safeParse('Ctrl + K').success).toBe(false);
  });

  it('validates layout and common export meta', () => {
    expect(layoutSchema.safeParse({ x: 0, y: 1, w: 2, h: 3, z: 4 }).success).toBe(true);
    expect(layoutSchema.safeParse({ x: 0, y: 1, w: 2, h: 3, z: -1 }).success).toBe(false);

    expect(
      commonExportMetaSchema.safeParse({
        createdAtIso: '2026-04-04T08:00:00Z',
        updatedAtIso: '2026-04-04T08:30:00Z',
        exportedAtIso: '2026-04-04T09:00:00+00:00',
        sourceUserId: null,
        sourceApp: 'analysis-store-service',
        sourceAppVersion: '1.0.0',
      }).success,
    ).toBe(true);

    expect(
      commonExportMetaSchema.safeParse({
        createdAtIso: '2026-04-04',
        updatedAtIso: '2026-04-04T08:30:00Z',
        exportedAtIso: '2026-04-04T09:00:00+00:00',
        sourceUserId: null,
        sourceApp: 'analysis-store-service',
        sourceAppVersion: '1.0.0',
      }).success,
    ).toBe(false);
  });
});
