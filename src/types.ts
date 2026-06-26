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

export interface SuggestionVM {
  key: string;
  label: string;
  hint?: string;
  active: boolean;
  type: 'item' | 'divider' | 'header' | 'datepicker';
  onSelect: () => void;
}

export interface HistoryVM {
  key: string;
  text: string;
  count: number;
  onSelect: () => void;
  onRemove: () => void;
}

export interface PresetVM {
  key: string;
  name: string;
  searchText: string;
  onSelect: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export interface StatusTabVM {
  key: string;
  label: string;
  count?: number;
  active: boolean;
  onSelect: () => void;
}

export interface InputVM {
  ref: React.RefObject<HTMLInputElement | null>;
  value: string;
  placeholder: string;
  textTokens: TextToken[];
  cursorWidth: number;
  scrollLeft: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onScroll: (scrollLeft: number) => void;
}

export interface DropdownVM {
  suggestions: SuggestionVM[];
  history: HistoryVM[];
  footer?: string;
  hint: string;
  isOpen: boolean;
  isLoading: boolean;
  offsetX: number;
}

export interface FilterChipBarVM {
  input: InputVM;
  dropdown: DropdownVM;
  presets: PresetVM[];
  statusTabs: StatusTabVM[];
  activeFilterCount: number;
  pendingHint: { text: string } | null;
  isPresetOpen: boolean;
  setPresetOpen: (open: boolean) => void;
  // Direct access for Antd4 compat (will be removed once fully migrated)
  setDropdownOpen: (open: boolean) => void;
  setActiveSuggestionIdx: (idx: number) => void;
  commitSearch: () => void;
  handleClear: () => void;
  setSearchText: (text: string) => void;
  tab: string | number;
  setTab: (t: string | number) => void;
  presetName: string;
  setPresetName: (n: string) => void;
  handleSavePreset: () => void;
  dismissHint: () => void;
  isCurrentSearchPreset: boolean;
}
