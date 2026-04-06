import { SCHEMA_VERSION_V1 } from '../../constants/import-format-v1.constants';

export interface ValidationIssue {
  path: Array<string | number>;
  message: string;
}

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: ValidationIssue[] } };

interface Schema<T> {
  safeParse(input: unknown): SafeParseResult<T>;
}

class StringSchema implements Schema<string> {
  private readonly checks: Array<(value: string) => string | null> = [];

  min(length: number, message: string): this {
    this.checks.push((value) => (value.length >= length ? null : message));
    return this;
  }

  regex(pattern: RegExp, message: string): this {
    this.checks.push((value) => (pattern.test(value) ? null : message));
    return this;
  }

  safeParse(input: unknown): SafeParseResult<string> {
    if (typeof input !== 'string') {
      return { success: false, error: { issues: [{ path: [], message: 'Expected string.' }] } };
    }

    const trimmed = input.trim();

    for (const check of this.checks) {
      const maybeError = check(trimmed);
      if (maybeError) {
        return { success: false, error: { issues: [{ path: [], message: maybeError }] } };
      }
    }

    return { success: true, data: trimmed };
  }
}

class NumberSchema implements Schema<number> {
  private readonly checks: Array<(value: number) => string | null> = [];

  int(message: string): this {
    this.checks.push((value) => (Number.isInteger(value) ? null : message));
    return this;
  }

  min(minValue: number, message: string): this {
    this.checks.push((value) => (value >= minValue ? null : message));
    return this;
  }

  finite(message: string): this {
    this.checks.push((value) => (Number.isFinite(value) ? null : message));
    return this;
  }

  safeParse(input: unknown): SafeParseResult<number> {
    if (typeof input !== 'number') {
      return { success: false, error: { issues: [{ path: [], message: 'Expected number.' }] } };
    }

    for (const check of this.checks) {
      const maybeError = check(input);
      if (maybeError) {
        return { success: false, error: { issues: [{ path: [], message: maybeError }] } };
      }
    }

    return { success: true, data: input };
  }
}

class LiteralSchema<T extends string> implements Schema<T> {
  constructor(private readonly literal: T) {}

  safeParse(input: unknown): SafeParseResult<T> {
    if (input !== this.literal) {
      return {
        success: false,
        error: { issues: [{ path: [], message: `Expected literal "${this.literal}".` }] },
      };
    }

    return { success: true, data: this.literal };
  }
}

class NullableSchema<T> implements Schema<T | null> {
  constructor(private readonly inner: Schema<T>) {}

  safeParse(input: unknown): SafeParseResult<T | null> {
    if (input === null) {
      return { success: true, data: null };
    }

    return this.inner.safeParse(input);
  }
}

class ObjectSchema<T extends object> implements Schema<T> {
  constructor(private readonly shape: { [K in keyof T]: Schema<T[K]> }) {}

  safeParse(input: unknown): SafeParseResult<T> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return { success: false, error: { issues: [{ path: [], message: 'Expected object.' }] } };
    }

    const source = input as Record<string, unknown>;
    const output = {} as T;
    const issues: ValidationIssue[] = [];

    (Object.keys(this.shape) as Array<keyof T>).forEach((key) => {
      const parsed = this.shape[key].safeParse(source[key as string]);
      if (parsed.success) {
        output[key] = parsed.data;
      } else {
        parsed.error.issues.forEach((issue) => {
          issues.push({ path: [key as string, ...issue.path], message: issue.message });
        });
      }
    });

    if (issues.length > 0) {
      return { success: false, error: { issues } };
    }

    return { success: true, data: output };
  }
}

const z = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  literal: <T extends string>(value: T) => new LiteralSchema(value),
  nullable: <T>(schema: Schema<T>) => new NullableSchema(schema),
  object: <T extends object>(shape: { [K in keyof T]: Schema<T[K]> }) =>
    new ObjectSchema(shape),
};

const ISO_OFFSET_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const HOTKEY_REGEX = /^(?:[A-Za-z0-9]+(?:\+[A-Za-z0-9]+)*)$/;

export const nonEmptyStringSchema = z.string().min(1, 'Expected non-empty string.');
export const idSchema = nonEmptyStringSchema;
export const nameSchema = nonEmptyStringSchema;
export const schemaVersionV1Schema = z.literal(SCHEMA_VERSION_V1);
export const isoDateWithOffsetSchema = z
  .string()
  .regex(ISO_OFFSET_REGEX, 'Expected ISO datetime with offset.');
export const millisecondsIntSchema = z
  .number()
  .finite('Expected finite number.')
  .int('Expected integer milliseconds.')
  .min(0, 'Expected milliseconds >= 0.');
export const finiteNumberSchema = z.number().finite('Expected finite number.');
export const hexColorSchema = z.string().regex(HEX_COLOR_REGEX, 'Expected hex color.');
export const nullableHotkeySchema = z.nullable(
  z.string().regex(HOTKEY_REGEX, 'Expected hotkey format such as Ctrl+K.'),
);

export interface Layout {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

export const layoutSchema = z.object<Layout>({
  x: finiteNumberSchema,
  y: finiteNumberSchema,
  w: finiteNumberSchema,
  h: finiteNumberSchema,
  z: millisecondsIntSchema,
});

export interface CommonExportMeta {
  createdAtIso: string;
  updatedAtIso: string;
  exportedAtIso: string;
  sourceUserId: string | null;
  sourceApp: string;
  sourceAppVersion: string;
}

export const commonExportMetaSchema = z.object<CommonExportMeta>({
  createdAtIso: isoDateWithOffsetSchema,
  updatedAtIso: isoDateWithOffsetSchema,
  exportedAtIso: isoDateWithOffsetSchema,
  sourceUserId: z.nullable(idSchema),
  sourceApp: nameSchema,
  sourceAppVersion: nonEmptyStringSchema,
});

export type CommonImportSchema<T> = Schema<T>;
