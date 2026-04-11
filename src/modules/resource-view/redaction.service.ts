import { Injectable } from '@nestjs/common';

const REDACTED_TEXT = '[redacted]';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

@Injectable()
export class RedactionService {
  redactPanelContent(contentJson: Record<string, unknown>): Record<string, unknown> {
    return this.redactValue(contentJson, false) as Record<string, unknown>;
  }

  redactTimelineContent(contentJson: Record<string, unknown>): Record<string, unknown> {
    return this.redactValue(contentJson, false) as Record<string, unknown>;
  }

  private redactValue(value: unknown, parentAnonymized: boolean): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.redactValue(entry, parentAnonymized));
    }

    if (!this.isRecord(value)) {
      return value;
    }

    const isAnonymized = parentAnonymized || this.isMarkedAnonymized(value);

    const copy: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      if (isAnonymized && this.isSensitiveLeafKey(key) && !this.isRecord(child) && !Array.isArray(child)) {
        copy[key] = this.redactedLeafValue(child);
        continue;
      }

      copy[key] = this.redactValue(child, isAnonymized);
    }

    if (isAnonymized && typeof copy.type === 'string') {
      this.applyPanelButtonTypeRedaction(copy);
    }

    return copy;
  }

  private applyPanelButtonTypeRedaction(button: Record<string, unknown>): void {
    if (typeof button.name === 'string') {
      button.name = REDACTED_TEXT;
    }

    if (button.type === 'event' && this.isRecord(button.eventProps)) {
      button.eventProps = {
        ...button.eventProps,
        eventName: REDACTED_TEXT,
        colorHex: null,
      };
      return;
    }

    if (button.type === 'label' && this.isRecord(button.labelProps)) {
      button.labelProps = {
        ...button.labelProps,
        label: REDACTED_TEXT,
        colorHex: null,
      };
      return;
    }

    if (button.type === 'stat' && this.isRecord(button.stat)) {
      button.stat = {
        ...button.stat,
        statName: REDACTED_TEXT,
        value: null,
        colorHex: null,
      };
    }
  }

  private redactedLeafValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return REDACTED_TEXT;
    }

    if (typeof value === 'number') {
      return null;
    }

    return null;
  }

  private isMarkedAnonymized(value: Record<string, unknown>): boolean {
    const markerKeys = ['isAnonymized', 'anonymized', 'anonymizedFlag'];

    return markerKeys.some((key) => value[key] === true);
  }

  private isSensitiveLeafKey(key: string): boolean {
    return [
      'name',
      'eventName',
      'label',
      'statName',
      'value',
      'colorHex',
      'note',
      'sourceUserId',
    ].includes(key);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
