import { PANEL_TYPE } from '../../constants/import-format-v1.constants';
import {
  CommonImportSchema,
  SafeParseResult,
  ValidationIssue,
  commonExportMetaSchema,
  hexColorSchema,
  idSchema,
  layoutSchema,
  nameSchema,
  nullableHotkeySchema,
  nonEmptyStringSchema,
  schemaVersionV1Schema,
} from '../shared/common-import.schemas';

interface BaseButton {
  id: string;
  name: string;
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
  };
}

export interface LabelButton extends BaseButton {
  type: 'label';
  labelProps: {
    label: string;
    colorHex: string | null;
  };
}

export interface StatButton extends BaseButton {
  type: 'stat';
  stat: {
    statName: string;
    value: number;
    colorHex: string | null;
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

function parseCommonButtonFields(
  source: Record<string, unknown>,
  index: number,
  issues: ValidationIssue[],
): BaseButton {
  const idResult = idSchema.safeParse(source.id);
  const nameResult = nameSchema.safeParse(source.name);
  const layoutResult = layoutSchema.safeParse(source.layout);
  const hotkeyResult = nullableHotkeySchema.safeParse(source.hotkeyNormalized);

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
