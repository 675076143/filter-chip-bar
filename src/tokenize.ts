import type { ChipConfig, FilterOption, TextToken } from './types';
import { matchConfig } from './parser';

const TRUNCATE_LIMIT = 40;

// 日期/时间碎片：dateRange 的值（如 2026-06-08 17:02:14~2026-06-10 17:57:03）被空格拆开后的片段
const DATE_FRAGMENT = /^[\d:~-]+$/;

// 展示用合并：dateRange 字段的值含空格时会被拆成多段，合并成一个 chip 以便整体高亮
function mergeDateRangeParts(parts: string[], chipConfigs: ChipConfig[]): string[] {
  const merged: string[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (/^\s*$/.test(part)) {
      merged.push(part);
      continue;
    }
    const clean = part.startsWith('-') ? part.slice(1) : part;
    const matched = matchConfig(clean, chipConfigs);
    if (matched?.config.type === 'dateRange') {
      let combined = part;
      let j = i + 1;
      while (j + 1 < parts.length && /^\s+$/.test(parts[j]) && DATE_FRAGMENT.test(parts[j + 1])) {
        combined += parts[j] + parts[j + 1];
        j += 2;
      }
      merged.push(combined);
      i = j - 1;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

export function tokenizeSearchText(
  text: string,
  chipConfigs: ChipConfig[],
  resolvedOptions?: Record<string, FilterOption[]>,
): TextToken[] {
  const parts = mergeDateRangeParts(text.split(/(\s+)/), chipConfigs);
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
    const isPrefix = !!(config.prefix && cleanPart.toLowerCase().startsWith(config.prefix.toLowerCase()));

    const label = isPrefix
      ? config.prefix!
      : cleanPart.includes(':')
        ? cleanPart.slice(0, cleanPart.indexOf(':'))
        : config.label;

    const isValueValid = (() => {
      if (!valueStr) return false;
      if (config.type === 'select' || config.type === 'multiSelect') {
        const vals = valueStr.split(',').map((s) => s.trim()).filter(Boolean);
        const opts = resolvedOptions?.[config.label] ?? [];
        return vals.length > 0 && vals.every((v) =>
          opts.some((o) => o.label.toLowerCase() === v.toLowerCase()),
        );
      }
      return true;
    })();

    return {
      type: 'chip' as const,
      label,
      value: valueStr,
      isNegated,
      isLabelValid: true,
      isValueValid,
      isPrefix,
      truncated: valueStr.length > TRUNCATE_LIMIT,
    };
  });
}

export function truncate(text: string): string {
  return text.length > TRUNCATE_LIMIT ? text.slice(0, TRUNCATE_LIMIT - 3) + '...' : text;
}
