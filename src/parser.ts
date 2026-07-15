import dayjs from 'dayjs';
import type { ChipConfig, FilterExpression, FilterOption, FilterOperator } from './types';

export interface ParsedToken {
  phase: 'filterName' | 'filterValue' | 'freeText';
  prefix: string;
  filterConfig?: ChipConfig;
  negated?: boolean;
}

export interface QueryPart {
  text: string;
  whitespace: boolean;
}

/** Split query text without breaking whitespace enclosed by single or double quotes. */
export function scanQueryParts(text: string): QueryPart[] {
  const parts: QueryPart[] = [];
  let start = 0;
  let quote: '"' | "'" | null = null;

  const push = (end: number, whitespace: boolean) => {
    if (end > start) parts.push({ text: text.slice(start, end), whitespace });
    start = end;
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === quote && text[index - 1] !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      push(index, false);
      while (index + 1 < text.length && /\s/.test(text[index + 1])) index += 1;
      push(index + 1, true);
    }
  }
  push(text.length, false);
  return parts;
}

export function matchConfig(token: string, chipConfigs: ChipConfig[]): { config: ChipConfig; valuePart: string } | null {
  for (const config of chipConfigs) {
    if (config.prefix && token.toLowerCase().startsWith(config.prefix.toLowerCase())) {
      return { config, valuePart: token.slice(config.prefix.length) };
    }
  }
  const colonIdx = token.indexOf(':');
  if (colonIdx === -1) return null;
  const label = token.slice(0, colonIdx);
  const valuePart = token.slice(colonIdx + 1);
  const config = chipConfigs.find(
    (f) => f.label.toLowerCase() === label.toLowerCase()
      || f.aliases?.some((a) => a.toLowerCase() === label.toLowerCase()),
  );
  return config ? { config, valuePart } : null;
}

function getTokenConfig(token: string, chipConfigs: ChipConfig[]): ChipConfig | null {
  const isNegated = token.startsWith('-');
  const cleanToken = isNegated ? token.slice(1) : token;
  const matched = matchConfig(cleanToken, chipConfigs);
  return matched?.config ?? null;
}

/**
 * 产生场景：用户通过下拉选择、日期范围选择器、粘贴或手动输入，可能把同一个筛选字段重复追加到搜索框；同一字段也可能同时出现普通筛选和排除筛选。
 * 影响面：重复字段会导致页面展示多个相同筛选条件，但接口解析时通常只以最后一个值生效，造成展示和实际查询不一致。
 */
export function dedupeFilterTokens(text: string, chipConfigs: ChipConfig[]): string {
  const tokens = scanQueryParts(text).filter((part) => !part.whitespace).map((part) => part.text);
  const seen = new Set<string>();
  const result: string[] = [];
  const trailingWhitespace = text.match(/\s+$/)?.[0] ?? '';

  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index];
    const config = getTokenConfig(token, chipConfigs);
    if (config && config.duplicatePolicy !== 'preserve') {
      if (seen.has(config.label)) continue;
      seen.add(config.label);
    }
    result.unshift(token);
  }

  return `${result.join(' ')}${result.length > 0 ? trailingWhitespace : ''}`;
}

export function parseCurrentToken(text: string, chipConfigs: ChipConfig[]): ParsedToken {
  const parts = scanQueryParts(text);
  const lastPart = parts[parts.length - 1];
  let token = lastPart?.whitespace ? '' : (lastPart?.text ?? '');
  if (token === '') return { phase: 'filterName', prefix: '' };

  const isNegated = token.startsWith('-');
  if (isNegated) token = token.slice(1);

  const matched = matchConfig(token, chipConfigs);
  if (matched) {
    const { config, valuePart } = matched;
    if (config.type === 'multiSelect' || config.type === 'select') {
      const lastComma = valuePart.lastIndexOf(',');
      const currentPart = lastComma >= 0 ? valuePart.slice(lastComma + 1) : valuePart;
      return { phase: 'filterValue', prefix: currentPart, filterConfig: config, negated: isNegated };
    }
    return { phase: 'freeText', prefix: valuePart, filterConfig: config, negated: isNegated };
  }

  if (!token.includes(':')) return { phase: 'filterName', prefix: token, negated: isNegated };
  return { phase: 'freeText', prefix: token, negated: isNegated };
}

export function parseQuery(
  text: string,
  chipConfigs: ChipConfig[],
  resolvedOptions?: Record<string, FilterOption[]>,
): { chips: Record<string, unknown>; expressions: FilterExpression[]; freeText: string[] } {
  const chips: Record<string, unknown> = {};
  const freeText: string[] = [];
  const tokens = scanQueryParts(text).filter((part) => !part.whitespace).map((part) => part.text);

  for (const token of tokens) {
    const isNegated = token.startsWith('-');
    let cleanToken = isNegated ? token.slice(1) : token;

    const matched = matchConfig(cleanToken, chipConfigs);
    if (!matched) {
      freeText.push(token);
      continue;
    }

    const { config, valuePart: rawValue } = matched;
    const canonicalLabel = config.label;
    const chipKey = isNegated ? `not_${canonicalLabel}` : canonicalLabel;
    const resolvedOpts = resolvedOptions?.[canonicalLabel] ?? [];
    const cleanRawValue = rawValue.replace(/^["']|["']$/g, '');

    if (config.type === 'select') {
      if (cleanRawValue.includes(',')) {
        const parts = cleanRawValue.split(',').map((s) => s.trim()).filter(Boolean);
        const values = parts
          .map((p) => resolvedOpts.find((o) => o.label.toLowerCase() === p.toLowerCase())?.value)
          .filter((v): v is string | number => v !== undefined);
        if (values.length > 0) chips[chipKey] = values;
      } else {
        const opt = resolvedOpts.find((o) => o.label.toLowerCase() === cleanRawValue.toLowerCase());
        if (opt) chips[chipKey] = opt.value;
      }
    } else if (config.type === 'multiSelect') {
      const parts = cleanRawValue.split(',').map((s) => s.trim()).filter(Boolean);
      const values = parts
        .map((p) => resolvedOpts.find((o) => o.label.toLowerCase() === p.toLowerCase())?.value)
        .filter((v): v is string | number => v !== undefined);
      if (values.length > 0) chips[chipKey] = values;
    } else if (config.type === 'input') {
      if (cleanRawValue) chips[chipKey] = cleanRawValue;
    } else if (config.type === 'numberRange') {
      const m = cleanRawValue.match(/^(>=|<=|=)?\s*(\d+(?:\.\d+)?)(?:~(\d+(?:\.\d+)?))?$/);
      if (m) {
        const op = m[1] || '>=';
        const val = Number(m[2]);
        const end = m[3] ? Number(m[3]) : undefined;
        chips[chipKey] = { operation: end !== undefined ? 'range' : op, value: val, end };
      }
    } else if (config.type === 'dateRange') {
      const raw = cleanRawValue.trim();
      const today = dayjs();
      const SEMANTIC_DATES: Record<string, [dayjs.Dayjs, dayjs.Dayjs]> = {
        今天: [today, today],
        昨天: [today.subtract(1, 'day'), today.subtract(1, 'day')],
        近7天: [today.subtract(6, 'day'), today],
        近15天: [today.subtract(14, 'day'), today],
        近30天: [today.subtract(29, 'day'), today],
        近90天: [today.subtract(89, 'day'), today],
      };
      if (SEMANTIC_DATES[raw]) {
        const [ds, de] = SEMANTIC_DATES[raw];
        chips[chipKey] = [ds.format('YYYY-MM-DD'), de.format('YYYY-MM-DD')];
      } else {
        const parts = raw.split('~');
        if (parts.length === 2) {
          const ds = dayjs(parts[0].trim());
          const de = parts[1].trim() === '此刻' ? dayjs() : dayjs(parts[1].trim());
          if (ds.isValid() && de.isValid()) {
            chips[chipKey] = [ds.format('YYYY-MM-DD'), de.format('YYYY-MM-DD')];
          }
        } else if (parts.length === 1) {
          const d = dayjs(parts[0].trim());
          if (d.isValid()) {
            chips[chipKey] = [d.format('YYYY-MM-DD'), d.format('YYYY-MM-DD')];
          }
        }
      }
    }
  }
  return { chips, expressions: buildFilterExpressions(chips, chipConfigs), freeText };
}

export function buildFilterExpressions(
  chips: Record<string, unknown>,
  chipConfigs: ChipConfig[],
): FilterExpression[] {
  const expressions: FilterExpression[] = [];

  for (const [key, value] of Object.entries(chips)) {
    const negated = key.startsWith('not_');
    const field = negated ? key.slice(4) : key;
    const config = chipConfigs.find((item) => item.label === field);
    if (!config) continue;

    let operator: FilterOperator;
    let expressionValue = value;

    if (config.type === 'numberRange' && value && typeof value === 'object') {
      const numberValue = value as { operation?: string; value?: number; end?: number };
      operator = numberValue.operation === 'range'
        ? 'range'
        : numberValue.operation === '<='
          ? 'lte'
          : numberValue.operation === '='
            ? 'eq'
            : 'gte';
      expressionValue = numberValue.operation === 'range'
        ? [numberValue.value, numberValue.end]
        : numberValue.value;
    } else if (config.type === 'dateRange') {
      operator = 'range';
    } else if (Array.isArray(value)) {
      operator = 'in';
    } else {
      operator = 'eq';
    }

    expressions.push({ field, operator, negated, value: expressionValue });
  }

  return expressions;
}
