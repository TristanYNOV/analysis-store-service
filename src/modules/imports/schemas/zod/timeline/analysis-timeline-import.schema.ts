import { TIMELINE_TYPE } from '../../constants/import-format-v1.constants';
import {
  CommonImportSchema,
  SafeParseResult,
  ValidationIssue,
  commonExportMetaSchema,
  finiteNumberSchema,
  hexColorSchema,
  idSchema,
  isoDateWithOffsetSchema,
  nonEmptyStringSchema,
  schemaVersionV1Schema,
} from '../shared/common-import.schemas';

interface EventDef {
  id: string;
  name: string;
  colorHex: string | null;
}

interface LabelDef {
  id: string;
  name: string;
  colorHex: string | null;
}

interface Occurrence {
  id: string;
  eventDefId: string | null;
  labelDefId: string | null;
  occurredAtIso: string;
  durationMs: number;
  note: string | null;
}

interface TimelineUi {
  zoom: number;
  showLabels: boolean;
  selectedOccurrenceId: string | null;
}

export interface AnalysisTimelineImportSchemaV1 {
  schemaVersion: '1.0.0';
  type: typeof TIMELINE_TYPE;
  timelineName: string;
  meta: {
    createdAtIso: string;
    updatedAtIso: string;
    exportedAtIso: string;
    sourceUserId: string | null;
    sourceApp: string;
    sourceAppVersion: string;
  };
  eventDefs: EventDef[];
  labelDefs: LabelDef[];
  occurrences: Occurrence[];
  ui: TimelineUi;
}

function pushIssue(issues: ValidationIssue[], path: Array<string | number>, message: string): void {
  issues.push({ path, message });
}

function parseNullableHex(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): string | null {
  if (value === null) {
    return null;
  }

  const parsed = hexColorSchema.safeParse(value);
  if (!parsed.success) {
    pushIssue(issues, path, parsed.error.issues[0]?.message ?? 'Invalid hex color.');
    return null;
  }

  return parsed.data;
}

function parseEventDef(value: unknown, index: number, issues: ValidationIssue[]): EventDef | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, ['eventDefs', index], 'eventDef must be an object.');
    return null;
  }

  const source = value as Record<string, unknown>;
  const id = idSchema.safeParse(source.id);
  const name = nonEmptyStringSchema.safeParse(source.name);
  const colorHex = parseNullableHex(source.colorHex, ['eventDefs', index, 'colorHex'], issues);

  if (!id.success) {
    pushIssue(issues, ['eventDefs', index, 'id'], id.error.issues[0]?.message ?? 'Invalid id.');
  }

  if (!name.success) {
    pushIssue(issues, ['eventDefs', index, 'name'], name.error.issues[0]?.message ?? 'Invalid name.');
  }

  if (!id.success || !name.success) {
    return null;
  }

  return {
    id: id.data,
    name: name.data,
    colorHex,
  };
}

function parseLabelDef(value: unknown, index: number, issues: ValidationIssue[]): LabelDef | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, ['labelDefs', index], 'labelDef must be an object.');
    return null;
  }

  const source = value as Record<string, unknown>;
  const id = idSchema.safeParse(source.id);
  const name = nonEmptyStringSchema.safeParse(source.name);
  const colorHex = parseNullableHex(source.colorHex, ['labelDefs', index, 'colorHex'], issues);

  if (!id.success) {
    pushIssue(issues, ['labelDefs', index, 'id'], id.error.issues[0]?.message ?? 'Invalid id.');
  }

  if (!name.success) {
    pushIssue(issues, ['labelDefs', index, 'name'], name.error.issues[0]?.message ?? 'Invalid name.');
  }

  if (!id.success || !name.success) {
    return null;
  }

  return {
    id: id.data,
    name: name.data,
    colorHex,
  };
}

function parseOccurrence(value: unknown, index: number, issues: ValidationIssue[]): Occurrence | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, ['occurrences', index], 'occurrence must be an object.');
    return null;
  }

  const source = value as Record<string, unknown>;
  const id = idSchema.safeParse(source.id);
  const occurredAtIso = isoDateWithOffsetSchema.safeParse(source.occurredAtIso);
  const durationMs = finiteNumberSchema.safeParse(source.durationMs);

  if (!id.success) {
    pushIssue(issues, ['occurrences', index, 'id'], id.error.issues[0]?.message ?? 'Invalid id.');
  }

  if (!occurredAtIso.success) {
    pushIssue(
      issues,
      ['occurrences', index, 'occurredAtIso'],
      occurredAtIso.error.issues[0]?.message ?? 'Invalid occurredAtIso.',
    );
  }

  if (!durationMs.success || durationMs.data < 0) {
    pushIssue(issues, ['occurrences', index, 'durationMs'], 'durationMs must be a finite number >= 0.');
  }

  const eventDefId = source.eventDefId === null ? null : idSchema.safeParse(source.eventDefId);
  const labelDefId = source.labelDefId === null ? null : idSchema.safeParse(source.labelDefId);

  if (eventDefId !== null && !eventDefId.success) {
    pushIssue(
      issues,
      ['occurrences', index, 'eventDefId'],
      eventDefId.error.issues[0]?.message ?? 'Invalid eventDefId.',
    );
  }

  if (labelDefId !== null && !labelDefId.success) {
    pushIssue(
      issues,
      ['occurrences', index, 'labelDefId'],
      labelDefId.error.issues[0]?.message ?? 'Invalid labelDefId.',
    );
  }

  if (eventDefId === null && labelDefId === null) {
    pushIssue(issues, ['occurrences', index], 'occurrence must reference eventDefId or labelDefId.');
  }

  const note = source.note === null ? null : nonEmptyStringSchema.safeParse(source.note);
  if (note !== null && !note.success) {
    pushIssue(issues, ['occurrences', index, 'note'], note.error.issues[0]?.message ?? 'Invalid note.');
  }

  if (!id.success || !occurredAtIso.success || !durationMs.success || durationMs.data < 0) {
    return null;
  }

  return {
    id: id.data,
    eventDefId: eventDefId && eventDefId.success ? eventDefId.data : null,
    labelDefId: labelDefId && labelDefId.success ? labelDefId.data : null,
    occurredAtIso: occurredAtIso.data,
    durationMs: durationMs.data,
    note: note === null ? null : note.success ? note.data : null,
  };
}

function parseUi(value: unknown, issues: ValidationIssue[]): TimelineUi | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, ['ui'], 'ui must be an object.');
    return null;
  }

  const source = value as Record<string, unknown>;
  const zoom = finiteNumberSchema.safeParse(source.zoom);

  if (!zoom.success || zoom.data < 0) {
    pushIssue(issues, ['ui', 'zoom'], 'ui.zoom must be a finite number >= 0.');
  }

  if (typeof source.showLabels !== 'boolean') {
    pushIssue(issues, ['ui', 'showLabels'], 'ui.showLabels must be a boolean.');
  }

  const selectedOccurrenceId =
    source.selectedOccurrenceId === null ? null : idSchema.safeParse(source.selectedOccurrenceId);

  if (selectedOccurrenceId !== null && !selectedOccurrenceId.success) {
    pushIssue(
      issues,
      ['ui', 'selectedOccurrenceId'],
      selectedOccurrenceId.error.issues[0]?.message ?? 'Invalid selectedOccurrenceId.',
    );
  }

  if (!zoom.success || zoom.data < 0 || typeof source.showLabels !== 'boolean') {
    return null;
  }

  return {
    zoom: zoom.data,
    showLabels: source.showLabels,
    selectedOccurrenceId:
      selectedOccurrenceId && selectedOccurrenceId.success ? selectedOccurrenceId.data : null,
  };
}

function validateUniqueIds(
  defs: Array<{ id: string }>,
  path: 'eventDefs' | 'labelDefs',
  issues: ValidationIssue[],
): void {
  const seen = new Set<string>();

  defs.forEach((entry, index) => {
    if (seen.has(entry.id)) {
      pushIssue(issues, [path, index, 'id'], `Duplicate id "${entry.id}".`);
      return;
    }

    seen.add(entry.id);
  });
}

export const analysisTimelineImportSchemaV1: CommonImportSchema<AnalysisTimelineImportSchemaV1> = {
  safeParse(input: unknown): SafeParseResult<AnalysisTimelineImportSchemaV1> {
    const issues: ValidationIssue[] = [];

    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return { success: false, error: { issues: [{ path: [], message: 'Expected object.' }] } };
    }

    const source = input as Record<string, unknown>;
    const schemaVersion = schemaVersionV1Schema.safeParse(source.schemaVersion);
    const timelineName = nonEmptyStringSchema.safeParse(source.timelineName);
    const meta = commonExportMetaSchema.safeParse(source.meta);

    if (!schemaVersion.success) {
      pushIssue(issues, ['schemaVersion'], schemaVersion.error.issues[0]?.message ?? 'Invalid schemaVersion.');
    }

    if (source.type !== TIMELINE_TYPE) {
      pushIssue(issues, ['type'], `type must be "${TIMELINE_TYPE}".`);
    }

    if (!timelineName.success) {
      pushIssue(issues, ['timelineName'], timelineName.error.issues[0]?.message ?? 'Invalid timelineName.');
    }

    if (!meta.success) {
      meta.error.issues.forEach((issue) => {
        pushIssue(issues, ['meta', ...issue.path], issue.message);
      });
    }

    if (!Array.isArray(source.eventDefs)) {
      pushIssue(issues, ['eventDefs'], 'eventDefs must be an array.');
    }

    if (!Array.isArray(source.labelDefs)) {
      pushIssue(issues, ['labelDefs'], 'labelDefs must be an array.');
    }

    if (!Array.isArray(source.occurrences)) {
      pushIssue(issues, ['occurrences'], 'occurrences must be an array.');
    }

    const eventDefs = Array.isArray(source.eventDefs)
      ? source.eventDefs
          .map((entry, index) => parseEventDef(entry, index, issues))
          .filter((entry): entry is EventDef => entry !== null)
      : [];

    const labelDefs = Array.isArray(source.labelDefs)
      ? source.labelDefs
          .map((entry, index) => parseLabelDef(entry, index, issues))
          .filter((entry): entry is LabelDef => entry !== null)
      : [];

    const occurrences = Array.isArray(source.occurrences)
      ? source.occurrences
          .map((entry, index) => parseOccurrence(entry, index, issues))
          .filter((entry): entry is Occurrence => entry !== null)
      : [];

    const ui = parseUi(source.ui, issues);

    validateUniqueIds(eventDefs, 'eventDefs', issues);
    validateUniqueIds(labelDefs, 'labelDefs', issues);

    const eventIds = new Set(eventDefs.map((entry) => entry.id));
    const labelIds = new Set(labelDefs.map((entry) => entry.id));

    occurrences.forEach((occurrence, index) => {
      if (occurrence.eventDefId !== null && !eventIds.has(occurrence.eventDefId)) {
        pushIssue(
          issues,
          ['occurrences', index, 'eventDefId'],
          `Unknown eventDefId reference "${occurrence.eventDefId}".`,
        );
      }

      if (occurrence.labelDefId !== null && !labelIds.has(occurrence.labelDefId)) {
        pushIssue(
          issues,
          ['occurrences', index, 'labelDefId'],
          `Unknown labelDefId reference "${occurrence.labelDefId}".`,
        );
      }
    });

    if (issues.length > 0 || !schemaVersion.success || !timelineName.success || !meta.success || ui === null) {
      return { success: false, error: { issues } };
    }

    return {
      success: true,
      data: {
        schemaVersion: schemaVersion.data,
        type: TIMELINE_TYPE,
        timelineName: timelineName.data,
        meta: meta.data,
        eventDefs,
        labelDefs,
        occurrences,
        ui,
      },
    };
  },
};
