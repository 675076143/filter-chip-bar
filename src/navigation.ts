import type { SuggestionItem } from './types';

export function findSelectableSuggestionIndex(
  suggestions: SuggestionItem[],
  currentIndex: number,
  direction: 1 | -1,
): number {
  let next = direction === 1
    ? currentIndex + 1
    : currentIndex < 0
      ? suggestions.length - 1
      : currentIndex - 1;

  while (
    next >= 0
    && next < suggestions.length
    && (suggestions[next].isDivider || suggestions[next].isHeader)
  ) {
    next += direction;
  }

  return next >= 0 && next < suggestions.length ? next : currentIndex;
}
