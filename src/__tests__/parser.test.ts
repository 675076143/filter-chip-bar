import { describe, it, expect } from 'vitest';
import { parseQuery, parseCurrentToken } from '../parser';
import { tokenizeSearchText } from '../tokenize';
import type { ChipConfig, TextToken, FilterOption } from '../types';

const configs: ChipConfig[] = [
  {
    type: 'select',
    label: 'Status',
    options: [
      { value: 0, label: 'Pending' },
      { value: 1, label: 'Passing' },
      { value: 2, label: 'Failing' },
    ],
  },
  {
    type: 'multiSelect',
    label: 'Tags',
    aliases: ['tag', 't'],
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ],
  },
  { type: 'input', label: 'Name' },
  { type: 'numberRange', label: 'Orders', precision: 0, min: 0 },
  { type: 'dateRange', label: 'Date' },
];

function buildOptions(cfgs: ChipConfig[]): Record<string, FilterOption[]> {
  const map: Record<string, FilterOption[]> = {};
  for (const c of cfgs) {
    if (Array.isArray(c.options)) map[c.label] = c.options;
  }
  return map;
}

const opts = buildOptions(configs);

describe('parseQuery', () => {
  it('parses select filter', () => {
    const { chips, freeText } = parseQuery('Status:Passing', configs, opts);
    expect(chips.Status).toBe(1);
    expect(freeText).toHaveLength(0);
  });

  it('parses negated select filter', () => {
    const { chips } = parseQuery('-Status:Failing', configs, opts);
    expect(chips['not_Status']).toBe(2);
  });

  it('parses select with comma multi-value', () => {
    const { chips } = parseQuery('Status:Passing,Failing', configs, opts);
    expect(chips.Status).toEqual([1, 2]);
  });

  it('parses select single value as scalar, multi as array', () => {
    const single = parseQuery('Status:Passing', configs, opts);
    expect(single.chips.Status).toBe(1);

    const multi = parseQuery('Status:Passing,Failing', configs, opts);
    expect(Array.isArray(multi.chips.Status)).toBe(true);
  });

  it('parses multiSelect filter', () => {
    const { chips } = parseQuery('Tags:Alpha,Beta', configs, opts);
    expect(chips.Tags).toEqual(['a', 'b']);
  });

  it('parses input filter', () => {
    const { chips } = parseQuery('Name:iPhone', configs, opts);
    expect(chips.Name).toBe('iPhone');
  });

  it('parses input with quotes (single word)', () => {
    const { chips } = parseQuery('Name:"iPhone"', configs, opts);
    expect(chips.Name).toBe('iPhone');
  });

  it('parses numberRange with >=', () => {
    const { chips } = parseQuery('Orders:>=100', configs, opts);
    expect(chips.Orders).toEqual({ operation: '>=', value: 100, end: undefined });
  });

  it('parses numberRange with range', () => {
    const { chips } = parseQuery('Orders:100~200', configs, opts);
    expect(chips.Orders).toEqual({ operation: 'range', value: 100, end: 200 });
  });

  it('parses dateRange', () => {
    const { chips } = parseQuery('Date:2024-01-01~2024-12-31', configs, opts);
    expect(chips.Date).toEqual(['2024-01-01', '2024-12-31']);
  });

  it('collects free text', () => {
    const { freeText } = parseQuery('hello world', configs, opts);
    expect(freeText).toEqual(['hello', 'world']);
  });

  it('handles mixed chips and free text', () => {
    const { chips, freeText } = parseQuery('Status:Passing kxccaqvx12', configs, opts);
    expect(chips.Status).toBe(1);
    expect(freeText).toEqual(['kxccaqvx12']);
  });

  it('handles multiple filters', () => {
    const { chips } = parseQuery('Status:Passing Tags:Alpha Orders:>=100', configs, opts);
    expect(chips.Status).toBe(1);
    expect(chips.Tags).toEqual(['a']);
    expect(chips.Orders).toEqual({ operation: '>=', value: 100, end: undefined });
  });

  it('ignores unknown labels → freeText', () => {
    const { chips, freeText } = parseQuery('Unknown:val', configs, opts);
    expect(chips.Unknown).toBeUndefined();
    expect(freeText).toEqual(['Unknown:val']);
  });

  it('handles empty string', () => {
    const { chips, freeText } = parseQuery('', configs, opts);
    expect(chips).toEqual({});
    expect(freeText).toEqual([]);
  });

  it('handles trailing comma in select → array', () => {
    const { chips } = parseQuery('Status:Passing,', configs, opts);
    expect(chips.Status).toEqual([1]);
  });

  it('coexists positive and negative on same field', () => {
    const { chips } = parseQuery('Status:Passing -Status:Failing', configs, opts);
    expect(chips.Status).toBe(1);
    expect(chips['not_Status']).toBe(2);
  });

  it('uses dynamicOptions when provided', () => {
    const { chips } = parseQuery('Status:Custom', configs, {
      Status: [{ value: 99, label: 'Custom' }],
    });
    expect(chips.Status).toBe(99);
  });
});

describe('aliases', () => {
  it('parses alias as label', () => {
    const { chips } = parseQuery('t:Alpha', configs, opts);
    expect(chips.Tags).toEqual(['a']);
  });

  it('parses full alias name', () => {
    const { chips } = parseQuery('tag:Alpha', configs, opts);
    expect(chips.Tags).toEqual(['a']);
  });

  it('alias label is valid in tokenize', () => {
    const tokens = tokenizeSearchText('t:Alpha', configs, opts);
    if (tokens[0].type === 'chip') {
      expect(tokens[0].isLabelValid).toBe(true);
    }
  });
});

describe('parseCurrentToken', () => {
  it('returns filterName phase for empty input', () => {
    const result = parseCurrentToken('', configs);
    expect(result.phase).toBe('filterName');
    expect(result.prefix).toBe('');
  });

  it('returns filterName phase for partial label', () => {
    const result = parseCurrentToken('Sta', configs);
    expect(result.phase).toBe('filterName');
    expect(result.prefix).toBe('Sta');
  });

  it('returns filterValue phase after colon', () => {
    const result = parseCurrentToken('Status:', configs);
    expect(result.phase).toBe('filterValue');
    expect(result.prefix).toBe('');
    expect(result.filterConfig?.label).toBe('Status');
  });

  it('returns filterValue phase with partial value', () => {
    const result = parseCurrentToken('Status:Pas', configs);
    expect(result.phase).toBe('filterValue');
    expect(result.prefix).toBe('Pas');
  });

  it('handles negation prefix', () => {
    const result = parseCurrentToken('-Status:', configs);
    expect(result.phase).toBe('filterValue');
    expect(result.negated).toBe(true);
  });

  it('handles multiSelect comma in value', () => {
    const result = parseCurrentToken('Tags:Alpha,Bet', configs);
    expect(result.phase).toBe('filterValue');
    expect(result.prefix).toBe('Bet');
  });

  it('handles select with comma (same as multiSelect)', () => {
    const result = parseCurrentToken('Status:Passing,', configs);
    expect(result.phase).toBe('filterValue');
    expect(result.prefix).toBe('');
  });
});

describe('tokenizeSearchText', () => {
  it('tokenizes empty string → single whitespace', () => {
    const tokens = tokenizeSearchText('', configs, opts);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('whitespace');
  });

  it('tokenizes free text', () => {
    const tokens = tokenizeSearchText('hello', configs, opts);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('freeText');
  });

  it('tokenizes chip with valid value', () => {
    const tokens = tokenizeSearchText('Status:Passing', configs, opts);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('chip');
    if (tokens[0].type === 'chip') {
      expect(tokens[0].label).toBe('Status');
      expect(tokens[0].value).toBe('Passing');
      expect(tokens[0].isLabelValid).toBe(true);
      expect(tokens[0].isValueValid).toBe(true);
    }
  });

  it('marks invalid label', () => {
    const tokens = tokenizeSearchText('Unknown:val', configs, opts);
    expect(tokens).toHaveLength(1);
    if (tokens[0].type === 'chip') {
      expect(tokens[0].isLabelValid).toBe(false);
    }
  });

  it('marks invalid value for select', () => {
    const tokens = tokenizeSearchText('Status:Nonexistent', configs, opts);
    if (tokens[0].type === 'chip') {
      expect(tokens[0].isValueValid).toBe(false);
    }
  });

  it('marks negated chip', () => {
    const tokens = tokenizeSearchText('-Status:Passing', configs, opts);
    if (tokens[0].type === 'chip') {
      expect(tokens[0].isNegated).toBe(true);
    }
  });

  it('validates comma-separated select values', () => {
    const tokens = tokenizeSearchText('Status:Passing,Failing', configs, opts);
    if (tokens[0].type === 'chip') {
      expect(tokens[0].isValueValid).toBe(true);
    }
  });

  it('marks invalid comma-separated value', () => {
    const tokens = tokenizeSearchText('Status:Passing,Nonexistent', configs, opts);
    if (tokens[0].type === 'chip') {
      expect(tokens[0].isValueValid).toBe(false);
    }
  });

  it('handles trailing comma as valid', () => {
    const tokens = tokenizeSearchText('Status:Passing,', configs, opts);
    if (tokens[0].type === 'chip') {
      expect(tokens[0].isValueValid).toBe(true);
    }
  });

  it('preserves whitespace tokens', () => {
    const tokens = tokenizeSearchText('Status:Passing Orders:>=100', configs, opts);
    const wsTokens = tokens.filter((t: TextToken) => t.type === 'whitespace');
    expect(wsTokens).toHaveLength(1);
  });
});
