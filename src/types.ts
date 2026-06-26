export interface FilterOption {
  value: string | number;
  label: string;
}

export interface TabOption {
  value: string | number;
  label: string;
  count?: number;
}

export type FilterType = 'select' | 'multiSelect' | 'input' | 'dateRange' | 'numberRange';

export type AsyncOptions = (chips?: Record<string, unknown>) => Promise<FilterOption[]>;

export interface ChipConfig {
  type: FilterType;
  label: string;
  aliases?: string[];
  prefix?: string;
  options?: FilterOption[] | AsyncOptions;
  initialOperator?: string;
  precision?: number;
  min?: number;
}

export interface SearchPreset {
  id: string;
  name: string;
  searchText: string;
  tab: string | number;
  createdAt: number;
}

export interface RecentSearch {
  text: string;
  total: number;
  timestamp: number;
  frequency: number;
}

export interface FilterChipBarResult {
  searchText: string;
  chips: Record<string, unknown>;
  /** Text fragments that are neither chip conditions nor tab — used for full-text search */
  freeText: string[];
  /** Current tab value, -1 means "All" */
  tab: string | number;
}

export interface SuggestionItem {
  value: string;
  label: string;
  hint?: string;
  action?: 'toggleNegate' | 'recent' | 'clearHistory' | 'imageSearch' | 'command' | 'datePicker';
  isDivider?: boolean;
  isHeader?: boolean;
  command?: ActionCommand;
  didYouMean?: string;
}

export interface ActionCommand {
  keywords: string[];
  label: string;
  hint?: string;
  action: () => void;
}

export type TextToken =
  | { type: 'whitespace'; text: string }
  | { type: 'freeText'; text: string; truncated: boolean }
  | {
      type: 'chip';
      label: string;
      value: string;
      isNegated: boolean;
      isLabelValid: boolean;
      isValueValid: boolean;
      isPrefix: boolean;
      truncated: boolean;
    };

// Different pages MUST use different namespaces, otherwise presets/history will collide
export function presetStorageKey(namespace: string): string {
  return `${namespace}:presets`;
}

export function recentStorageKey(namespace: string): string {
  return `${namespace}:recent`;
}

export function loadPresets(namespace: string): SearchPreset[] {
  try {
    const raw = localStorage.getItem(presetStorageKey(namespace));
    return raw ? (JSON.parse(raw) as SearchPreset[]) : [];
  } catch {
    return [];
  }
}

export function savePresets(namespace: string, presets: SearchPreset[]): void {
  try {
    localStorage.setItem(presetStorageKey(namespace), JSON.stringify(presets));
  } catch {
    // quota exceeded or privacy mode — silently ignore
  }
}

export function loadRecent(namespace: string): RecentSearch[] {
  try {
    const raw = localStorage.getItem(recentStorageKey(namespace));
    return raw ? (JSON.parse(raw) as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

export function saveRecent(namespace: string, searches: RecentSearch[]): void {
  try {
    localStorage.setItem(recentStorageKey(namespace), JSON.stringify(searches.slice(0, 8)));
  } catch {
    // quota exceeded or privacy mode — silently ignore
  }
}
