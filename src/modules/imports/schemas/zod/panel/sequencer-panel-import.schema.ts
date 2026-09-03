import { PANEL_TYPE } from '../../constants/import-format-v1.constants';
import {
  CommonImportSchema,
  SafeParseResult,
  ValidationIssue,
  commonExportMetaSchema,
  finiteNumberSchema,
  hexColorSchema,
  idSchema,
  layoutSchema,
  millisecondsIntSchema,
  nameSchema,
  nullableHotkeySchema,
  nonEmptyStringSchema,
  schemaVersionV1Schema,
} from '../shared/common-import.schemas';

type SequencerEventKind = 'limited' | 'indefinite';
type SequencerLabelMode = 'once' | 'indefinite';
type SequencerStatOperator = '+' | '-' | '*' | '/';

export interface SequencerStatQuery {
  eventIds: string[];
  labelIds: string[];
  labelColorById?: Record<string, string>;
  metric: 'count';
  labelMatch: 'all';
}

export type SequencerStatNode =
  | { kind: 'constant'; value: number }
  | { kind: 'query'; query: SequencerStatQuery }
  | {
      kind: 'group';
      left: SequencerStatNode;
      op: SequencerStatOperator;
      right: SequencerStatNode;
    };

export interface SequencerStatEditorTerm {
  id: string;
  displayName: string;
  kind: 'query' | 'constant';
  query?: SequencerStatQuery;
  constantValue?: number;
}

export type SequencerStatExpressionToken =
  | { kind: 'term'; termId: string }
  | { kind: 'operator'; op: SequencerStatOperator }
  | { kind: 'paren'; value: '(' | ')' };

export type SequencerStatDefinition =
  | {
      mode: 'simple';
      query: SequencerStatQuery;
    }
  | {
      mode: 'complex';
      expression: SequencerStatNode;
      editor?: {
        terms: SequencerStatEditorTerm[];
        tokens: SequencerStatExpressionToken[];
      };
    };

interface BaseButton {
  id: string;
  name: string;
  isAnonymized?: boolean;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    z: number;
  };
  hotkeyNormalized: string | null;
  deactivateIds: string[];
  activateIds: string[];
}

export interface EventButton extends BaseButton {
  type: 'event';
  eventProps: {
    eventName: string;
    colorHex: string | null;
    kind: SequencerEventKind;
    preMs: number;
    postMs: number;
  };
}

export interface LabelButton extends BaseButton {
  type: 'label';
  labelProps: {
    label: string;
    colorHex: string | null;
    mode: SequencerLabelMode;
  };
}

export interface StatButton extends BaseButton {
  type: 'stat';
  stat: {
    statName: string;
    value: number;
    colorHex: string | null;
    definition?: SequencerStatDefinition;
  };
}

export type SequencerPanelButton = EventButton | LabelButton | StatButton;

export interface SequencerPanelImportSchemaV1 {
  schemaVersion: '1.0.0';
  type: typeof PANEL_TYPE;
  panelName: string;
  meta: {
    createdAtIso: string;
    updatedAtIso: string;
    exportedAtIso: string;
    sourceUserId: string | null;
    sourceApp: string;
    sourceAppVersion: string;
  };
  btnList: SequencerPanelButton[];
}

function pushIssue(issues: ValidationIssue[], path: Array<string | number>, message: string): void {
  issues.push({ path, message });
}

function parseStringArray(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): string[] {
  if (!Array.isArray(value)) {
    pushIssue(issues, path, 'Expected array of ids.');
    return [];
  }

  const parsed: string[] = [];

  value.forEach((entry, index) => {
    const parsedId = idSchema.safeParse(entry);
    if (!parsedId.success) {
      pushIssue(issues, [...path, index], parsedId.error.issues[0]?.message ?? 'Invalid id.');
      return;
    }

    parsed.push(parsedId.data);
  });

  return parsed;
}

function parseNullableHexColor(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): string | null {
  if (value === null) {
    return null;
  }

  const parsedColor = hexColorSchema.safeParse(value);
  if (!parsedColor.success) {
    pushIssue(issues, path, parsedColor.error.issues[0]?.message ?? 'Invalid hex color.');
    return null;
  }

  return parsedColor.data;
}

function parseOptionalBoolean(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    pushIssue(issues, path, 'Expected boolean.');
    return undefined;
  }

  return value;
}

function parseOptionalMilliseconds(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = millisecondsIntSchema.safeParse(value);
  if (!parsed.success) {
    pushIssue(issues, path, parsed.error.issues[0]?.message ?? 'Invalid milliseconds value.');
    return fallback;
  }

  return parsed.data;
}

function parseEventKind(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): SequencerEventKind {
  if (value === undefined) {
    return 'limited';
  }

  if (value !== 'limited' && value !== 'indefinite') {
    pushIssue(issues, path, 'eventProps.kind must be one of: limited, indefinite.');
    return 'limited';
  }

  return value;
}

function parseLabelMode(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): SequencerLabelMode {
  if (value === undefined) {
    return 'once';
  }

  if (value !== 'once' && value !== 'indefinite') {
    pushIssue(issues, path, 'labelProps.mode must be one of: once, indefinite.');
    return 'once';
  }

  return value;
}

function parseOperator(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): SequencerStatOperator {
  if (value !== '+' && value !== '-' && value !== '*' && value !== '/') {
    pushIssue(issues, path, 'operator must be one of: +, -, *, /.');
    return '+';
  }

  return value;
}

function parseLabelColorById(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): Record<string, string> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, path, 'labelColorById must be an object.');
    return undefined;
  }

  const parsed: Record<string, string> = {};
  Object.entries(value).forEach(([key, color]) => {
    const parsedKey = idSchema.safeParse(key);
    if (!parsedKey.success) {
      pushIssue(issues, [...path, key], parsedKey.error.issues[0]?.message ?? 'Invalid label id.');
      return;
    }

    const parsedColor = hexColorSchema.safeParse(color);
    if (!parsedColor.success) {
      pushIssue(issues, [...path, key], parsedColor.error.issues[0]?.message ?? 'Invalid hex color.');
      return;
    }

    parsed[parsedKey.data] = parsedColor.data;
  });

  return parsed;
}

function parseStatQuery(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): SequencerStatQuery {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, path, 'Stat query must be an object.');
    return { eventIds: [], labelIds: [], metric: 'count', labelMatch: 'all' };
  }

  const source = value as Record<string, unknown>;
  const eventIds = parseStringArray(source.eventIds, [...path, 'eventIds'], issues);
  const labelIds = parseStringArray(source.labelIds, [...path, 'labelIds'], issues);
  const labelColorById = parseLabelColorById(source.labelColorById, [...path, 'labelColorById'], issues);

  if (source.metric !== 'count') {
    pushIssue(issues, [...path, 'metric'], 'metric must be "count".');
  }

  if (source.labelMatch !== 'all') {
    pushIssue(issues, [...path, 'labelMatch'], 'labelMatch must be "all".');
  }

  return {
    eventIds,
    labelIds,
    ...(labelColorById ? { labelColorById } : {}),
    metric: 'count',
    labelMatch: 'all',
  };
}

function parseStatNode(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): SequencerStatNode {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, path, 'Stat expression node must be an object.');
    return { kind: 'constant', value: 0 };
  }

  const source = value as Record<string, unknown>;

  if (source.kind === 'constant') {
    const parsedValue = finiteNumberSchema.safeParse(source.value);
    if (!parsedValue.success) {
      pushIssue(issues, [...path, 'value'], parsedValue.error.issues[0]?.message ?? 'Invalid constant value.');
    }

    return { kind: 'constant', value: parsedValue.success ? parsedValue.data : 0 };
  }

  if (source.kind === 'query') {
    return { kind: 'query', query: parseStatQuery(source.query, [...path, 'query'], issues) };
  }

  if (source.kind === 'group') {
    return {
      kind: 'group',
      left: parseStatNode(source.left, [...path, 'left'], issues),
      op: parseOperator(source.op, [...path, 'op'], issues),
      right: parseStatNode(source.right, [...path, 'right'], issues),
    };
  }

  pushIssue(issues, [...path, 'kind'], 'Stat expression kind must be one of: constant, query, group.');
  return { kind: 'constant', value: 0 };
}

function parseStatEditorTerm(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): SequencerStatEditorTerm {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, path, 'Editor term must be an object.');
    return { id: '', displayName: '', kind: 'constant', constantValue: 0 };
  }

  const source = value as Record<string, unknown>;
  const id = idSchema.safeParse(source.id);
  const displayName = nonEmptyStringSchema.safeParse(source.displayName);

  if (!id.success) {
    pushIssue(issues, [...path, 'id'], id.error.issues[0]?.message ?? 'Invalid term id.');
  }

  if (!displayName.success) {
    pushIssue(issues, [...path, 'displayName'], displayName.error.issues[0]?.message ?? 'Invalid displayName.');
  }

  if (source.kind === 'query') {
    return {
      id: id.success ? id.data : '',
      displayName: displayName.success ? displayName.data : '',
      kind: 'query',
      query: parseStatQuery(source.query, [...path, 'query'], issues),
    };
  }

  if (source.kind === 'constant') {
    const constantValue = finiteNumberSchema.safeParse(source.constantValue);
    if (!constantValue.success) {
      pushIssue(
        issues,
        [...path, 'constantValue'],
        constantValue.error.issues[0]?.message ?? 'Invalid constantValue.',
      );
    }

    return {
      id: id.success ? id.data : '',
      displayName: displayName.success ? displayName.data : '',
      kind: 'constant',
      constantValue: constantValue.success ? constantValue.data : 0,
    };
  }

  pushIssue(issues, [...path, 'kind'], 'Editor term kind must be one of: query, constant.');
  return {
    id: id.success ? id.data : '',
    displayName: displayName.success ? displayName.data : '',
    kind: 'constant',
    constantValue: 0,
  };
}

function parseStatExpressionToken(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): SequencerStatExpressionToken {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, path, 'Expression token must be an object.');
    return { kind: 'operator', op: '+' };
  }

  const source = value as Record<string, unknown>;

  if (source.kind === 'term') {
    const termId = idSchema.safeParse(source.termId);
    if (!termId.success) {
      pushIssue(issues, [...path, 'termId'], termId.error.issues[0]?.message ?? 'Invalid termId.');
    }

    return { kind: 'term', termId: termId.success ? termId.data : '' };
  }

  if (source.kind === 'operator') {
    return { kind: 'operator', op: parseOperator(source.op, [...path, 'op'], issues) };
  }

  if (source.kind === 'paren') {
    if (source.value !== '(' && source.value !== ')') {
      pushIssue(issues, [...path, 'value'], 'Paren token value must be "(" or ")".');
    }

    return { kind: 'paren', value: source.value === ')' ? ')' : '(' };
  }

  pushIssue(issues, [...path, 'kind'], 'Expression token kind must be one of: term, operator, paren.');
  return { kind: 'operator', op: '+' };
}

function parseStatEditor(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): { terms: SequencerStatEditorTerm[]; tokens: SequencerStatExpressionToken[] } | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, path, 'Stat editor must be an object.');
    return undefined;
  }

  const source = value as Record<string, unknown>;

  if (!Array.isArray(source.terms)) {
    pushIssue(issues, [...path, 'terms'], 'editor.terms must be an array.');
  }

  if (!Array.isArray(source.tokens)) {
    pushIssue(issues, [...path, 'tokens'], 'editor.tokens must be an array.');
  }

  const terms = Array.isArray(source.terms)
    ? source.terms.map((term, termIndex) => parseStatEditorTerm(term, [...path, 'terms', termIndex], issues))
    : [];

  const tokens = Array.isArray(source.tokens)
    ? source.tokens.map((token, tokenIndex) => parseStatExpressionToken(token, [...path, 'tokens', tokenIndex], issues))
    : [];

  return { terms, tokens };
}

function parseStatDefinition(
  value: unknown,
  path: Array<string | number>,
  issues: ValidationIssue[],
): SequencerStatDefinition | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    pushIssue(issues, path, 'Stat definition must be an object.');
    return undefined;
  }

  const source = value as Record<string, unknown>;

  if (source.mode === 'simple') {
    return { mode: 'simple', query: parseStatQuery(source.query, [...path, 'query'], issues) };
  }

  if (source.mode === 'complex') {
    const editor = parseStatEditor(source.editor, [...path, 'editor'], issues);

    return {
      mode: 'complex',
      expression: parseStatNode(source.expression, [...path, 'expression'], issues),
      ...(editor ? { editor } : {}),
    };
  }

  pushIssue(issues, [...path, 'mode'], 'Stat definition mode must be one of: simple, complex.');
  return undefined;
}

function parseCommonButtonFields(
  source: Record<string, unknown>,
  index: number,
  issues: ValidationIssue[],
): BaseButton {
  const idResult = idSchema.safeParse(source.id);
  const nameResult = nameSchema.safeParse(source.name);
  const layoutResult = layoutSchema.safeParse(source.layout);
  const hotkeyResult = nullableHotkeySchema.safeParse(source.hotkeyNormalized);
  const isAnonymized = parseOptionalBoolean(source.isAnonymized, ['btnList', index, 'isAnonymized'], issues);

  if (!idResult.success) {
    pushIssue(issues, ['btnList', index, 'id'], idResult.error.issues[0]?.message ?? 'Invalid id.');
  }

  if (!nameResult.success) {
    pushIssue(issues, ['btnList', index, 'name'], nameResult.error.issues[0]?.message ?? 'Invalid name.');
  }

  if (!layoutResult.success) {
    layoutResult.error.issues.forEach((issue) => {
      pushIssue(issues, ['btnList', index, 'layout', ...issue.path], issue.message);
    });
  }

  if (!hotkeyResult.success) {
    pushIssue(
      issues,
      ['btnList', index, 'hotkeyNormalized'],
      hotkeyResult.error.issues[0]?.message ?? 'Invalid hotkeyNormalized.',
    );
  }

  const deactivateIds = parseStringArray(source.deactivateIds, ['btnList', index, 'deactivateIds'], issues);
  const activateIds = parseStringArray(source.activateIds, ['btnList', index, 'activateIds'], issues);

  return {
    id: idResult.success ? idResult.data : '',
    name: nameResult.success ? nameResult.data : '',
    layout: layoutResult.success
      ? layoutResult.data
      : {
          x: 0,
          y: 0,
          w: 0,
          h: 0,
          z: 0,
    },
    hotkeyNormalized: hotkeyResult.success ? hotkeyResult.data : null,
    deactivateIds,
    activateIds,
    ...(isAnonymized === undefined ? {} : { isAnonymized }),
  };
}

function parseButton(source: unknown, index: number, issues: ValidationIssue[]): SequencerPanelButton | null {
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    pushIssue(issues, ['btnList', index], 'Button must be an object.');
    return null;
  }

  const record = source as Record<string, unknown>;
  const type = record.type;

  if (type !== 'event' && type !== 'label' && type !== 'stat') {
    pushIssue(issues, ['btnList', index, 'type'], 'type must be one of: event, label, stat.');
    return null;
  }

  const base = parseCommonButtonFields(record, index, issues);

  if (type === 'event') {
    if (typeof record.eventProps !== 'object' || record.eventProps === null || Array.isArray(record.eventProps)) {
      pushIssue(issues, ['btnList', index, 'eventProps'], 'eventProps is required for event button.');
      return null;
    }

    const eventProps = record.eventProps as Record<string, unknown>;
    const eventName = nonEmptyStringSchema.safeParse(eventProps.eventName);
    const colorHex = parseNullableHexColor(eventProps.colorHex, ['btnList', index, 'eventProps', 'colorHex'], issues);
    const kind = parseEventKind(eventProps.kind, ['btnList', index, 'eventProps', 'kind'], issues);
    const preMs = parseOptionalMilliseconds(eventProps.preMs, ['btnList', index, 'eventProps', 'preMs'], issues, 0);
    const postMs = parseOptionalMilliseconds(eventProps.postMs, ['btnList', index, 'eventProps', 'postMs'], issues, 0);

    if (!eventName.success) {
      pushIssue(
        issues,
        ['btnList', index, 'eventProps', 'eventName'],
        eventName.error.issues[0]?.message ?? 'Invalid eventName.',
      );
    }

    return {
      ...base,
      type,
      eventProps: {
        eventName: eventName.success ? eventName.data : '',
        colorHex,
        kind,
        preMs,
        postMs,
      },
    };
  }

  if (type === 'label') {
    if (typeof record.labelProps !== 'object' || record.labelProps === null || Array.isArray(record.labelProps)) {
      pushIssue(issues, ['btnList', index, 'labelProps'], 'labelProps is required for label button.');
      return null;
    }

    const labelProps = record.labelProps as Record<string, unknown>;
    const label = nonEmptyStringSchema.safeParse(labelProps.label);
    const colorHex = parseNullableHexColor(labelProps.colorHex, ['btnList', index, 'labelProps', 'colorHex'], issues);
    const mode = parseLabelMode(labelProps.mode, ['btnList', index, 'labelProps', 'mode'], issues);

    if (!label.success) {
      pushIssue(
        issues,
        ['btnList', index, 'labelProps', 'label'],
        label.error.issues[0]?.message ?? 'Invalid label.',
      );
    }

    return {
      ...base,
      type,
      labelProps: {
        label: label.success ? label.data : '',
        colorHex,
        mode,
      },
    };
  }

  if (typeof record.stat !== 'object' || record.stat === null || Array.isArray(record.stat)) {
    pushIssue(issues, ['btnList', index, 'stat'], 'stat is required for stat button.');
    return null;
  }

  const statProps = record.stat as Record<string, unknown>;
  const statName = nonEmptyStringSchema.safeParse(statProps.statName);
  const value = Number(statProps.value);
  const colorHex = parseNullableHexColor(statProps.colorHex, ['btnList', index, 'stat', 'colorHex'], issues);
  const definition = parseStatDefinition(statProps.definition, ['btnList', index, 'stat', 'definition'], issues);

  if (!statName.success) {
    pushIssue(
      issues,
      ['btnList', index, 'stat', 'statName'],
      statName.error.issues[0]?.message ?? 'Invalid statName.',
    );
  }

  if (!Number.isFinite(value)) {
    pushIssue(issues, ['btnList', index, 'stat', 'value'], 'stat.value must be a finite number.');
  }

  return {
    ...base,
    type,
    stat: {
      statName: statName.success ? statName.data : '',
      value: Number.isFinite(value) ? value : 0,
      colorHex,
      ...(definition ? { definition } : {}),
    },
  };
}

function validateButtonIds(buttons: SequencerPanelButton[], issues: ValidationIssue[]): void {
  const ids = buttons.map((button) => button.id);
  const idSet = new Set<string>();

  ids.forEach((id, index) => {
    if (idSet.has(id)) {
      pushIssue(issues, ['btnList', index, 'id'], `Duplicate button id "${id}".`);
      return;
    }

    idSet.add(id);
  });

  buttons.forEach((button, index) => {
    button.deactivateIds.forEach((refId, refIndex) => {
      if (!idSet.has(refId)) {
        pushIssue(
          issues,
          ['btnList', index, 'deactivateIds', refIndex],
          `Unknown button id reference "${refId}" in deactivateIds.`,
        );
      }
    });

    button.activateIds.forEach((refId, refIndex) => {
      if (!idSet.has(refId)) {
        pushIssue(
          issues,
          ['btnList', index, 'activateIds', refIndex],
          `Unknown button id reference "${refId}" in activateIds.`,
        );
      }
    });
  });
}

export const sequencerPanelImportSchemaV1: CommonImportSchema<SequencerPanelImportSchemaV1> = {
  safeParse(input: unknown): SafeParseResult<SequencerPanelImportSchemaV1> {
    const issues: ValidationIssue[] = [];

    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return { success: false, error: { issues: [{ path: [], message: 'Expected object.' }] } };
    }

    const source = input as Record<string, unknown>;

    const schemaVersion = schemaVersionV1Schema.safeParse(source.schemaVersion);
    const type = source.type;
    const panelName = nonEmptyStringSchema.safeParse(source.panelName);
    const meta = commonExportMetaSchema.safeParse(source.meta);

    if (!schemaVersion.success) {
      pushIssue(issues, ['schemaVersion'], schemaVersion.error.issues[0]?.message ?? 'Invalid schemaVersion.');
    }

    if (type !== PANEL_TYPE) {
      pushIssue(issues, ['type'], `type must be "${PANEL_TYPE}".`);
    }

    if (!panelName.success) {
      pushIssue(issues, ['panelName'], panelName.error.issues[0]?.message ?? 'Invalid panelName.');
    }

    if (!meta.success) {
      meta.error.issues.forEach((issue) => {
        pushIssue(issues, ['meta', ...issue.path], issue.message);
      });
    }

    if (!Array.isArray(source.btnList)) {
      pushIssue(issues, ['btnList'], 'btnList must be an array.');
    }

    const buttons = Array.isArray(source.btnList)
      ? source.btnList
          .map((button, index) => parseButton(button, index, issues))
          .filter((button): button is SequencerPanelButton => button !== null)
      : [];

    if (buttons.length > 0) {
      validateButtonIds(buttons, issues);
    }

    if (issues.length > 0) {
      return { success: false, error: { issues } };
    }

    const normalizedSchemaVersion = schemaVersion.success ? schemaVersion.data : '1.0.0';
    const normalizedPanelName = panelName.success ? panelName.data : '';
    const normalizedMeta =
      meta.success
        ? meta.data
        : {
            createdAtIso: '',
            updatedAtIso: '',
            exportedAtIso: '',
            sourceUserId: null,
            sourceApp: '',
            sourceAppVersion: '',
          };

    return {
      success: true,
      data: {
        schemaVersion: normalizedSchemaVersion,
        type: PANEL_TYPE,
        panelName: normalizedPanelName,
        meta: normalizedMeta,
        btnList: buttons,
      },
    };
  },
};
