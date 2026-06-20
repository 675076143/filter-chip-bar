export interface FilterOption {
  value: string | number;
  label: string;
}

export type FilterType = 'select' | 'multiSelect' | 'input' | 'dateRange' | 'numberRange';

export interface ChipConfig {
  type: FilterType;
  label: string;
  options?: FilterOption[];
  initialOperator?: string;
  precision?: number;
  min?: number;
  dynamic?: boolean;
}

export interface SearchPreset {
  id: string;
  name: string;
  searchText: string;
  stat: number;
  createdAt: number;
}

export interface RecentSearch {
  text: string;
  total: number;
  timestamp: number;
}

export interface FilterChipBarResult {
  searchText: string;
  chips: Record<string, unknown>;
  /** Text fragments that are neither chip conditions nor stat — used for full-text search */
  freeText: string[];
  /** Current status value, -1 means "All" */
  stat: number;
}

export interface SuggestionItem {
  value: string;
  label: string;
  hint?: string;
  action?: 'toggleNegate' | 'recent' | 'clearHistory' | 'imageSearch' | 'command';
  isDivider?: boolean;
  isHeader?: boolean;
  command?: ActionCommand;
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
    localStorage.setItem(recentStorageKey(namespace), JSON.stringify(searches.slice(0, 10)));
  } catch {
    // quota exceeded or privacy mode — silently ignore
  }
}
