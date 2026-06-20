import dayjs from 'dayjs';
import type { ChipConfig, FilterOption } from './types';

export interface ParsedToken {
  phase: 'filterName' | 'filterValue' | 'freeText';
  prefix: string;
  filterConfig?: ChipConfig;
  negated?: boolean;
}

export function parseCurrentToken(text: string, chipConfigs: ChipConfig[]): ParsedToken {
  const lastSpaceIdx = text.lastIndexOf(' ');
  let token = lastSpaceIdx === -1 ? text : text.slice(lastSpaceIdx + 1);
  if (token === '') return { phase: 'filterName', prefix: '' };

  const isNegated = token.startsWith('-');
  if (isNegated) token = token.slice(1);

  const colonIdx = token.indexOf(':');
  if (colonIdx === -1) return { phase: 'filterName', prefix: token, negated: isNegated };

  const label = token.slice(0, colonIdx);
  const valuePart = token.slice(colonIdx + 1);
  const config = chipConfigs.find((f) => f.label === label);

  if (config?.type === 'multiSelect' || config?.type === 'select') {
    const lastComma = valuePart.lastIndexOf(',');
    const currentPart = lastComma >= 0 ? valuePart.slice(lastComma + 1) : valuePart;
    return { phase: 'filterValue', prefix: currentPart, filterConfig: config, negated: isNegated };
  }
  return { phase: 'freeText', prefix: valuePart, filterConfig: config, negated: isNegated };
}

export function parseQuery(
  text: string,
  chipConfigs: ChipConfig[],
  dynamicOptions?: Record<string, FilterOption[]>,
): { chips: Record<string, unknown>; freeText: string[] } {
  const chips: Record<string, unknown> = {};
  const freeText: string[] = [];
  const tokens = text.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    const isNegated = token.startsWith('-');
    const cleanToken = isNegated ? token.slice(1) : token;
    const colonIdx = cleanToken.indexOf(':');
    if (colonIdx === -1) {
      freeText.push(token);
      continue;
    }
    const label = cleanToken.slice(0, colonIdx);
    const rawValue = cleanToken.slice(colonIdx + 1).replace(/^["']|["']$/g, '');
    const config = chipConfigs.find((f) => f.label === label);
    if (!config) {
      freeText.push(token);
      continue;
    }

    const chipKey = isNegated ? `not_${label}` : label;

    const resolvedOpts = dynamicOptions?.[label] ?? [];

    if (config.type === 'select') {
      if (rawValue.includes(',')) {
        const parts = rawValue.split(',').map((s) => s.trim()).filter(Boolean);
        const values = parts
          .map((p) => resolvedOpts.find((o) => o.label === p)?.value)
          .filter((v): v is string | number => v !== undefined);
        if (values.length > 0) chips[chipKey] = values;
      } else {
        const opt = resolvedOpts.find((o) => o.label === rawValue);
        if (opt) chips[chipKey] = opt.value;
      }
    } else if (config.type === 'multiSelect') {
      const parts = rawValue.split(',').map((s) => s.trim()).filter(Boolean);
      const values = parts
        .map((p) => resolvedOpts.find((o) => o.label === p)?.value)
        .filter((v): v is string | number => v !== undefined);
      if (values.length > 0) chips[chipKey] = values;
    } else if (config.type === 'input') {
      if (rawValue) chips[chipKey] = rawValue;
    } else if (config.type === 'numberRange') {
      const m = rawValue.match(/^(>=|<=|=)?\s*(\d+(?:\.\d+)?)(?:~(\d+(?:\.\d+)?))?$/);
      if (m) {
        const op = m[1] || '>=';
        const val = Number(m[2]);
        const end = m[3] ? Number(m[3]) : undefined;
        chips[chipKey] = { operation: end !== undefined ? 'range' : op, value: val, end };
      }
    } else if (config.type === 'dateRange') {
      const parts = rawValue.split('~');
      if (parts.length === 2) {
        const ds = dayjs(parts[0].trim());
        const de = dayjs(parts[1].trim());
        if (ds.isValid() && de.isValid()) {
          chips[chipKey] = [ds.format('YYYY-MM-DD'), de.format('YYYY-MM-DD')];
        }
      }
    }
  }
  return { chips, freeText };
}
