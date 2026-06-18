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
  /** 既不是 chip 也不是 stat 的纯文本片段 */
  freeText: string[];
  /** 当前选中的 status 值,-1 表示"全部" */
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

// 多页面使用 FilterChipBar 时必须传不同 namespace,否则预设/历史会串数据
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
  localStorage.setItem(presetStorageKey(namespace), JSON.stringify(presets));
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
  localStorage.setItem(recentStorageKey(namespace), JSON.stringify(searches.slice(0, 10)));
}
