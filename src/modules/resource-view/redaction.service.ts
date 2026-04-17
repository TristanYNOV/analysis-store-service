import { Injectable } from '@nestjs/common';

@Injectable()
export class RedactionService {
  panelContentHasAnonymizedData(contentJson: Record<string, unknown>): boolean {
    if (!this.isRecord(contentJson) || !Array.isArray(contentJson.btnList)) {
      return false;
    }

    return contentJson.btnList.some((button) => this.isRecord(button) && this.isButtonMarkedAnonymized(button));
  }

  redactPanelContent(contentJson: Record<string, unknown>): Record<string, unknown> {
    const copy = this.deepClone(contentJson);

    if (!this.isRecord(copy) || !Array.isArray(copy.btnList)) {
      return copy;
    }

    const counters = {
      event: 0,
      label: 0,
      stat: 0,
    };

    copy.btnList = copy.btnList.map((button) => {
      if (!this.isRecord(button) || !this.isButtonMarkedAnonymized(button)) {
        return button;
      }

      const type = this.resolveButtonType(button);
      if (!type) {
        return button;
      }

      counters[type] += 1;
      const alias = `${this.aliasPrefix(type)} ${counters[type]}`;

      return this.pseudonymizeButton(button, type, alias);
    });

    return copy;
  }

  redactTimelineContent(contentJson: Record<string, unknown>): Record<string, unknown> {
    return this.deepClone(contentJson);
  }

  private pseudonymizeButton(
    button: Record<string, unknown>,
    type: 'event' | 'label' | 'stat',
    alias: string
  ): Record<string, unknown> {
    const copy = { ...button };

    if (typeof copy.name === 'string') {
      copy.name = alias;
    }

    if (type === 'event' && this.isRecord(copy.eventProps)) {
      copy.eventProps = {
        ...copy.eventProps,
        eventName: alias,
      };
    }

    if (type === 'label' && this.isRecord(copy.labelProps)) {
      copy.labelProps = {
        ...copy.labelProps,
        label: alias,
      };
    }

    if (type === 'stat' && this.isRecord(copy.stat)) {
      copy.stat = {
        ...copy.stat,
        statName: alias,
      };
    }
    return copy;
  }

  private aliasPrefix(type: 'event' | 'label' | 'stat'): string {
    if (type === 'event') {
      return 'Event anonymized';
    }

    if (type === 'label') {
      return 'Label anonymized';
    }

    return 'Stat anonymized';
  }

  private resolveButtonType(button: Record<string, unknown>): 'event' | 'label' | 'stat' | null {
    const { type } = button;

    if (type === 'event' || type === 'label' || type === 'stat') {
      return type;
    }

    if (this.isRecord(button.eventProps)) {
      return 'event';
    }

    if (this.isRecord(button.labelProps)) {
      return 'label';
    }

    if (this.isRecord(button.stat)) {
      return 'stat';
    }

    return null;
  }

  private isButtonMarkedAnonymized(value: Record<string, unknown>): boolean {
    return value.isAnonymized === true || value.anonymized === true || value.anonymizedFlag === true;
  }

  private deepClone(value: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
