import { describe, expect, it } from 'vitest';
import { findSelectableSuggestionIndex } from '../navigation';
import type { SuggestionItem } from '../types';

const suggestions: SuggestionItem[] = [
  { value: '', label: 'Matches', isHeader: true },
  { value: 'Status:Passing', label: 'Passing' },
  { value: '', label: '', isDivider: true },
  { value: '', label: 'Commands', isHeader: true },
  { value: 'export', label: 'Export' },
];

describe('findSelectableSuggestionIndex', () => {
  it('skips headers and dividers when moving down', () => {
    expect(findSelectableSuggestionIndex(suggestions, -1, 1)).toBe(1);
    expect(findSelectableSuggestionIndex(suggestions, 1, 1)).toBe(4);
  });

  it('starts from the last selectable item when moving up', () => {
    expect(findSelectableSuggestionIndex(suggestions, -1, -1)).toBe(4);
    expect(findSelectableSuggestionIndex(suggestions, 4, -1)).toBe(1);
  });

  it('keeps the current index when no selectable item remains', () => {
    expect(findSelectableSuggestionIndex(suggestions, 4, 1)).toBe(4);
    expect(findSelectableSuggestionIndex(suggestions, 1, -1)).toBe(1);
  });
});
