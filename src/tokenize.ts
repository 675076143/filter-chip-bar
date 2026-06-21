import type { ChipConfig, FilterOption, TextToken } from './types';
import { matchConfig } from './parser';

const TRUNCATE_LIMIT = 40;

export function tokenizeSearchText(
  text: string,
  chipConfigs: ChipConfig[],
  resolvedOptions?: Record<string, FilterOption[]>,
): TextToken[] {
  const parts = text.split(/(\s+)/);
  return parts.map((part) => {
    if (/^\s*$/.test(part)) {
      return { type: 'whitespace', text: part };
    }

    const isNegated = part.startsWith('-');
    const cleanPart = isNegated ? part.slice(1) : part;

    const matched = matchConfig(cleanPart, chipConfigs);
    if (!matched) {
      return {
        type: 'freeText',
        text: part,
        truncated: part.length > TRUNCATE_LIMIT,
      };
    }

    const { config, valuePart: valueStr } = matched;
    const displayLabel = config.prefix && cleanPart.startsWith(config.prefix)
      ? `${config.prefix}${config.label.toLowerCase()}`
      : cleanPart.includes(':')
        ? cleanPart.slice(0, cleanPart.indexOf(':'))
        : config.label;

    const isValueValid = (() => {
      if (!valueStr) return false;
      if (config.type === 'select' || config.type === 'multiSelect') {
        const vals = valueStr.split(',').map((s) => s.trim()).filter(Boolean);
        const opts = resolvedOptions?.[config.label] ?? [];
        return vals.length > 0 && vals.every((v) => opts.some((o) => o.label === v));
      }
      return true;
    })();

    return {
      type: 'chip' as const,
      label: displayLabel,
      value: valueStr,
      isNegated,
      isLabelValid: true,
      isValueValid,
      truncated: valueStr.length > TRUNCATE_LIMIT,
    };
  });
}

export function truncate(text: string): string {
  return text.length > TRUNCATE_LIMIT ? text.slice(0, TRUNCATE_LIMIT - 3) + '...' : text;
}
