import type { ChipConfig, FilterOption, TextToken } from './types';

const TRUNCATE_LIMIT = 40;

export function tokenizeSearchText(
  text: string,
  chipConfigs: ChipConfig[],
  dynamicOptions?: Record<string, FilterOption[]>,
): TextToken[] {
  const parts = text.split(/(\s+)/);
  return parts.map((part) => {
    if (/^\s*$/.test(part)) {
      return { type: 'whitespace', text: part };
    }

    const isNegated = part.startsWith('-');
    const cleanPart = isNegated ? part.slice(1) : part;
    const colonIdx = cleanPart.indexOf(':');
    if (colonIdx === -1) {
      return {
        type: 'freeText',
        text: part,
        truncated: part.length > TRUNCATE_LIMIT,
      };
    }

    const label = cleanPart.slice(0, colonIdx);
    const valueStr = cleanPart.slice(colonIdx + 1);
    const config = chipConfigs.find((f) => f.label === label);
    const isLabelValid = !!config;
    let isValueValid = isLabelValid && !!valueStr;
    if (isLabelValid && valueStr && (config.type === 'select' || config.type === 'multiSelect')) {
      const vals = valueStr.split(',').map((s) => s.trim()).filter(Boolean);
      const opts = dynamicOptions?.[label] ?? config.options ?? [];
      isValueValid = vals.length > 0 && vals.every((v) => opts.some((o) => o.label === v));
    }

    return {
      type: 'chip',
      label,
      value: valueStr,
      isNegated,
      isLabelValid,
      isValueValid,
      truncated: valueStr.length > TRUNCATE_LIMIT,
    };
  });
}

export function truncate(text: string): string {
  return text.length > TRUNCATE_LIMIT ? text.slice(0, TRUNCATE_LIMIT - 3) + '...' : text;
}
