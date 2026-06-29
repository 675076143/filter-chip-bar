import { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  type ChipConfig,
  type FilterOption,
  type AsyncOptions,
  type SearchPreset,
  type RecentSearch,
  type FilterChipBarResult,
  type SuggestionItem,
  type TextToken,
  type ActionCommand,
  type SuggestionVM,
  type HistoryVM,
  type PresetVM,
  type StatusTabVM,
  type InputVM,
  type DropdownVM,
  type FilterChipBarVM,
  type TabOption,
  loadPresets,
  savePresets,
  loadRecent,
  saveRecent,
} from './types';
import { parseCurrentToken, parseQuery, type ParsedToken } from './parser';
import { tokenizeSearchText } from './tokenize';
import { findClosest, levenshtein } from './fuzzy';
import dayjs from 'dayjs';
import {
  DEFAULT_HINTS,
  buildHints,
  getPendingHint,
  incrementUsage,
  markHintSeen,
  type ProgressiveHint,
} from './progressive';

const TYPE_HINTS: Record<string, string> = {
  select: '单选',
  multiSelect: '多选',
  input: '文本',
  dateRange: '日期',
  numberRange: '数值',
};

export function autoPlaceholder(configs: ChipConfig[]): string {
  const parts: string[] = [];
  for (const cfg of configs.slice(0, 4)) {
    if (cfg.prefix) {
      const first = Array.isArray(cfg.options) ? cfg.options[0] : null;
      parts.push(first ? `${cfg.prefix}${first.label}` : `${cfg.prefix}...`);
    } else if (cfg.type === 'select' || cfg.type === 'multiSelect') {
      const first = Array.isArray(cfg.options) ? cfg.options[0] : null;
      parts.push(first ? `${cfg.label}:${first.label}` : `${cfg.label}:...`);
    } else {
      parts.push(`${cfg.label}:...`);
    }
  }
  return parts.length > 0 ? `输入关键词或筛选条件,例: ${parts.join(', ')}` : '输入关键词或筛选条件';
}

const ICON_OFFSET = 14 + 8 + 12;

export interface UseFilterChipBarOptions {
  chipConfigs: ChipConfig[];
  storageNamespace: string;
  commands?: ActionCommand[];
  initialSearchText?: string;
  initialTab?: string | number;
  onFiltersChange?: (result: FilterChipBarResult) => void;
  onSearch?: () => void;
  fontInfo?: { fontSize: number; fontFamily: string };
  searchResultCount?: number;
  searchLoading?: boolean;
  hints?: ProgressiveHint[];
}

export interface UseFilterChipBarReturn {
  inputRef: React.RefObject<HTMLInputElement | null>;
  itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;

  searchText: string;
  setSearchText: (text: string) => void;
  textTokens: TextToken[];
  activeFilterCount: number;

  tab: string | number;
  setTab: (tab: string | number) => void;

  isDropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  activeSuggestionIdx: number;
  setActiveSuggestionIdx: (idx: number) => void;
  dropdownOffsetX: number;
  inputScrollLeft: number;
  parsedToken: ParsedToken;
  suggestions: SuggestionItem[];
  filteredHistory: RecentSearch[];
  isLoadingDynamic: boolean;

  isPresetOpen: boolean;
  setPresetOpen: (open: boolean) => void;
  presetName: string;
  setPresetName: (name: string) => void;
  presets: SearchPreset[];

  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleClear: () => void;
  commitSearch: () => void;
  handleSuggestionClick: (value: string) => void;
  handleToggleNegate: () => void;
  executeCommand: (cmd: ActionCommand) => void;
  handleSavePreset: () => void;
  handleLoadPreset: (preset: SearchPreset) => void;
  handleDeletePreset: (id: string) => void;
  buildShareUrl: (preset: SearchPreset) => string;
  clearRecent: () => void;
  removeRecent: (text: string) => void;

  pendingHint: ProgressiveHint | null;
  dismissHint: () => void;

  onInputScroll: (scrollLeft: number) => void;
}

export function useFilterChipBar({
  chipConfigs,
  storageNamespace,
  commands = [],
  initialSearchText = '',
  initialTab = -1,
  onFiltersChange,
  onSearch,
  fontInfo,
  searchResultCount,
  searchLoading,
  hints = DEFAULT_HINTS,
}: UseFilterChipBarOptions): UseFilterChipBarReturn {
  const dynamicHints = useMemo(() => hints === DEFAULT_HINTS ? buildHints(chipConfigs) : hints, [chipConfigs, hints]);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollPosRef = useRef(0);

  const [searchText, setSearchText] = useState(initialSearchText);
  const [tab, setTab] = useState(initialTab);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [inputScrollLeft, setInputScrollLeft] = useState(0);
  const [presetOpen, setPresetOpen] = useState(false);
  const [presets, setPresets] = useState<SearchPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [resolvedOptions, setResolvedOptions] = useState<Record<string, FilterOption[]>>({});
  const [loadingLabels, setLoadingLabels] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => loadRecent(storageNamespace));
  const pendingSearchRef = useRef<string | null>(null);

  const currentChips = useMemo(() => {
    const { chips } = parseQuery(searchText, chipConfigs, {});
    return chips;
  }, [searchText, chipConfigs]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const asyncConfigs = chipConfigs.filter(
        (c): c is ChipConfig & { options: AsyncOptions } => typeof c.options === 'function',
      );
      asyncConfigs.forEach(async (config) => {
        setLoadingLabels((prev) => new Set(prev).add(config.label));
        try {
          const result = await config.options(currentChips);
          if (!cancelled) {
            setResolvedOptions((prev) => ({ ...prev, [config.label]: result }));
          }
        } catch {
          // silently ignore fetch errors
        } finally {
          if (!cancelled) {
            setLoadingLabels((prev) => {
              const next = new Set(prev);
              next.delete(config.label);
              return next;
            });
          }
        }
      });
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [chipConfigs, currentChips]);

  const allOptions = useMemo(() => {
    const merged: Record<string, FilterOption[]> = {};
    for (const config of chipConfigs) {
      if (Array.isArray(config.options)) {
        merged[config.label] = config.options;
      } else if (resolvedOptions[config.label]) {
        merged[config.label] = resolvedOptions[config.label];
      }
    }
    return merged;
  }, [chipConfigs, resolvedOptions]);

  const cbRef = useRef(onFiltersChange);
  cbRef.current = onFiltersChange;
  const searchRef = useRef(onSearch);
  searchRef.current = onSearch;

  const applyFilters = useCallback(
    (text: string, s: string | number) => {
      const { chips, freeText } = parseQuery(text, chipConfigs, allOptions);
      const cleaned = Object.fromEntries(
        Object.entries(chips).filter(([, v]) => v !== undefined && v !== null && v !== ''),
      );
      cbRef.current?.({ searchText: text, chips: cleaned, freeText, tab: s });
      searchRef.current?.();
      pendingSearchRef.current = text.trim() || null;
      const count = incrementUsage(storageNamespace);
      const hint = getPendingHint(storageNamespace, dynamicHints);
      if (hint) setPendingHint(hint);
    },
    [chipConfigs, allOptions, storageNamespace, dynamicHints],
  );

  const [pendingHint, setPendingHint] = useState<ProgressiveHint | null>(null);

  const dismissHint = useCallback(() => {
    if (pendingHint) {
      markHintSeen(storageNamespace, pendingHint);
      setPendingHint(null);
    }
  }, [pendingHint, storageNamespace]);

  useEffect(() => {
    applyFilters(searchText, tab);
    /* eslint-disable-next-line */
  }, [tab]);

  useEffect(() => {
    setPresets(loadPresets(storageNamespace));
  }, [storageNamespace]);

  useEffect(() => {
    setActiveIdx(-1);
  }, [searchText]);

  useEffect(() => {
    if (!searchLoading && pendingSearchRef.current) {
      const text = pendingSearchRef.current;
      pendingSearchRef.current = null;
      setRecentSearches((prev) => {
        const existing = prev.find((e) => e.text === text);
        const entry: RecentSearch = {
          text,
          total: searchResultCount ?? 0,
          timestamp: Date.now(),
          frequency: (existing?.frequency ?? 0) + 1,
        };
        const next = [entry, ...prev.filter((e) => e.text !== text)].slice(0, 8);
        saveRecent(storageNamespace, next);
        return next;
      });
    }
  }, [searchLoading, searchResultCount, storageNamespace]);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    saveRecent(storageNamespace, []);
  }, [storageNamespace]);

  const removeRecent = useCallback((text: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((e) => e.text !== text);
      saveRecent(storageNamespace, next);
      return next;
    });
  }, [storageNamespace]);

  useEffect(() => {
    if (activeIdx >= 0 && itemRefs.current[activeIdx]) {
      itemRefs.current[activeIdx]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    // Read browser's natural scroll — never override it
    setInputScrollLeft((prev) => {
      const current = input.scrollLeft;
      if (Math.abs(prev - current) < 0.5) return prev;
      return current;
    });
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !inputRef.current?.contains(document.activeElement)) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
          setDropdownOpen(true);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const measureTextWidth = useCallback(
    (text: string): number => {
      if (!text || typeof document === 'undefined' || !fontInfo) return 0;
      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return 0;
      ctx.font = `${fontInfo.fontSize}px ${fontInfo.fontFamily}`;
      return ctx.measureText(text).width;
    },
    [fontInfo],
  );

  const parsedToken = useMemo(() => parseCurrentToken(searchText, chipConfigs), [searchText, chipConfigs]);
  const lastSpaceIdx = searchText.lastIndexOf(' ');
  const textBeforeToken = lastSpaceIdx === -1 ? '' : searchText.slice(0, lastSpaceIdx + 1);
  const dropdownOffsetX = ICON_OFFSET + measureTextWidth(textBeforeToken);
  const activeFilterCount = searchText.split(/\s+/).filter(Boolean).length;
  const textTokens = useMemo(() => tokenizeSearchText(searchText, chipConfigs, allOptions), [searchText, chipConfigs, allOptions]);

  const suggestions = useMemo(
    () => buildSuggestions(searchText, chipConfigs, allOptions, parsedToken, lastSpaceIdx, commands),
    [searchText, chipConfigs, allOptions, parsedToken, lastSpaceIdx, commands],
  );

  const handleSavePreset = useCallback(() => {
    const name = presetName.trim();
    if (!name) return;
    const preset: SearchPreset = {
      id: `${Date.now()}`,
      name,
      searchText,
      tab,
      createdAt: Date.now(),
    };
    const next = [preset, ...presets];
    setPresets(next);
    savePresets(storageNamespace, next);
    setPresetName('');
  }, [presetName, searchText, tab, presets, storageNamespace]);

  const handleLoadPreset = useCallback((preset: SearchPreset) => {
    setSearchText(preset.searchText);
    setTab(preset.tab);
    setPresetOpen(false);
  }, []);

  const handleDeletePreset = useCallback(
    (id: string) => {
      const next = presets.filter((p) => p.id !== id);
      setPresets(next);
      savePresets(storageNamespace, next);
    },
    [presets, storageNamespace],
  );

  const buildShareUrl = useCallback((preset: SearchPreset) => {
    const params = new URLSearchParams();
    if (preset.searchText) params.set('q', preset.searchText);
    if (preset.tab !== -1) params.set('tab', String(preset.tab));
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, []);

  const handleToggleNegate = useCallback(() => {
    const prevSpaceIdx = searchText.lastIndexOf(' ');
    const before = prevSpaceIdx === -1 ? '' : searchText.slice(0, prevSpaceIdx + 1);
    let token = prevSpaceIdx === -1 ? searchText : searchText.slice(prevSpaceIdx + 1);
    const newToken = token.startsWith('-') ? token.slice(1) : '-' + token;
    const newText = before + newToken;
    setSearchText(newText);
    applyFilters(newText, tab);
    setTimeout(() => {
      setDropdownOpen(true);
      inputRef.current?.focus();
    }, 0);
  }, [searchText, tab, applyFilters]);

  const handleSuggestionClick = useCallback(
    (value: string) => {
      const prevSpaceIdx = searchText.lastIndexOf(' ');
      const before = prevSpaceIdx === -1 ? '' : searchText.slice(0, prevSpaceIdx + 1);
      const colonIdx = value.lastIndexOf(':');
      const afterColon = colonIdx >= 0 ? value.slice(colonIdx + 1) : '';
      const isPartial = value.endsWith(':') || ['>=', '<=', '='].includes(afterColon);
      const labelMatch = value.match(/^(-?)([^:]+):/);
      const config = labelMatch?.[2]
        ? chipConfigs.find((f) => f.label === labelMatch[2])
        : undefined;
      const supportsMultiValue =
        !isPartial && (config?.type === 'multiSelect' || config?.type === 'select');
      const suffix = isPartial ? '' : supportsMultiValue ? '' : ' ';
      const newText = before + value + suffix;
      setSearchText(newText);
      if (!isPartial) applyFilters(newText, tab);
      setTimeout(() => {
        setDropdownOpen(true);
        inputRef.current?.focus();
      }, 0);
    },
    [searchText, tab, applyFilters, chipConfigs],
  );

  const executeCommand = useCallback((cmd: ActionCommand) => {
    cmd.action();
    setDropdownOpen(false);
    setActiveIdx(-1);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text');
      if (pasted.includes('\n') || pasted.includes('\r')) {
        e.preventDefault();
        let converted = pasted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        if (!(converted.startsWith('"') && converted.endsWith('"'))) {
          converted = converted.replace(/\n/g, ',');
        }
        const input = e.currentTarget;
        const start = input.selectionStart ?? searchText.length;
        const end = input.selectionEnd ?? searchText.length;
        const newValue = searchText.slice(0, start) + converted + searchText.slice(end);
        setSearchText(newValue);
        setDropdownOpen(true);
        applyFilters(newValue, tab);
        setTimeout(() => {
          input.selectionStart = input.selectionEnd = start + converted.length;
        }, 0);
      }
    },
    [searchText, tab, applyFilters],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      scrollPosRef.current = e.currentTarget.scrollLeft;
      let newValue = e.target.value;
      if (newValue.includes('\n') || newValue.includes('\r')) {
        newValue = newValue.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        if (!(newValue.startsWith('"') && newValue.endsWith('"'))) {
          newValue = newValue.replace(/\n/g, ',');
        }
      }
      if (
        newValue.length > searchText.length &&
        newValue.endsWith(' ') &&
        !searchText.endsWith(' ')
      ) {
        const beforeSpace = newValue.slice(0, -1);
        const prevSpaceIdx = beforeSpace.lastIndexOf(' ');
        const completedToken =
          prevSpaceIdx === -1 ? beforeSpace : beforeSpace.slice(prevSpaceIdx + 1);
        const colonIdx = completedToken.indexOf(':');
        if (colonIdx > 0) {
          const fLabel = completedToken.slice(0, colonIdx);
          const fValue = completedToken.slice(colonIdx + 1);
          const config = chipConfigs.find((f) => f.label === fLabel);
          if (config?.type === 'input' && fValue && !fValue.startsWith('"')) {
            const prefix = prevSpaceIdx === -1 ? '' : beforeSpace.slice(0, prevSpaceIdx + 1);
            const newText = `${prefix}${fLabel}:"${fValue}" `;
            setSearchText(newText);
            setDropdownOpen(true);
            applyFilters(newText, tab);
            return;
          }
        }
        setSearchText(newValue);
        setDropdownOpen(true);
        applyFilters(newValue, tab);
        return;
      }
      setSearchText(newValue);
      setDropdownOpen(true);
      if (!newValue.trim() && searchText.trim()) {
        applyFilters('', tab);
      }
    },
    [searchText, chipConfigs, tab, applyFilters],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDropdownOpen(true);
        setActiveIdx((prev) => {
          let next = prev + 1;
          while (next < suggestions.length && suggestions[next].isDivider) next++;
          return Math.min(next, suggestions.length - 1);
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((prev) => {
          let next = prev - 1;
          while (next >= 0 && suggestions[next].isDivider) next--;
          return Math.max(next, 0);
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx >= 0 && activeIdx < suggestions.length) {
          const s = suggestions[activeIdx];
          if (s.isDivider) return;
          if (s.action === 'command' && s.command) {
            executeCommand(s.command);
          } else if (s.action === 'toggleNegate') {
            handleToggleNegate();
          } else if (s.action === 'recent') {
            setSearchText(s.value);
            setDropdownOpen(false);
            applyFilters(s.value, tab);
          } else {
            handleSuggestionClick(s.value);
          }
        } else {
          setDropdownOpen(false);
          applyFilters(searchText, tab);
        }
        setActiveIdx(-1);
      } else if (e.key === 'Escape') {
        setDropdownOpen(false);
        setActiveIdx(-1);
      } else if (e.key === 'Tab') {
        const real = suggestions.filter((s) => !s.isDivider && !s.isHeader);
        const target = activeIdx >= 0 && activeIdx < suggestions.length
          ? suggestions[activeIdx]
          : real.length === 1
            ? real[0]
            : null;

        if (!target || target.isDivider) return;
        e.preventDefault();
        if (target.action === 'command' && target.command) {
          executeCommand(target.command);
        } else if (target.action === 'toggleNegate') {
          handleToggleNegate();
        } else if (target.action === 'recent') {
          setSearchText(target.value);
          setDropdownOpen(false);
          applyFilters(target.value, tab);
        } else {
          handleSuggestionClick(target.value);
        }
      } else if (e.key === 'Backspace') {
        const input = e.currentTarget;
        const cursorPos = input.selectionStart;
        if (cursorPos === 0 && input.selectionStart === input.selectionEnd && searchText.length > 0) {
          e.preventDefault();
          const trimmed = searchText.replace(/\s+$/, '');
          const prevSpace = trimmed.lastIndexOf(' ');
          const newText = prevSpace === -1 ? '' : trimmed.slice(0, prevSpace) + ' ';
          setSearchText(newText);
          applyFilters(newText, tab);
        }
      }
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        scrollPosRef.current = e.currentTarget.scrollLeft;
        requestAnimationFrame(() => {
          if (inputRef.current) {
            scrollPosRef.current = inputRef.current.scrollLeft;
            setInputScrollLeft(inputRef.current.scrollLeft);
          }
        });
      }
    },
    [suggestions, activeIdx, searchText, tab, applyFilters, handleToggleNegate, handleSuggestionClick, executeCommand],
  );

  const handleClear = useCallback(() => {
    setSearchText('');
    setDropdownOpen(true);
    applyFilters('', tab);
    inputRef.current?.focus();
  }, [tab, applyFilters]);

  const commitSearch = useCallback(() => {
    setDropdownOpen(false);
    setActiveIdx(-1);
    applyFilters(searchText, tab);
  }, [searchText, tab, applyFilters]);

  const onInputScroll = useCallback((scrollLeft: number) => {
    scrollPosRef.current = scrollLeft;
    setInputScrollLeft(scrollLeft);
  }, []);

  const isLoadingDynamic = useMemo(() => {
    if (parsedToken.phase !== 'filterValue' || !parsedToken.filterConfig) return false;
    return loadingLabels.has(parsedToken.filterConfig.label);
  }, [parsedToken, loadingLabels]);

  const filteredHistory = useMemo(() => recentSearches
    .filter((h) => {
      if (!searchText) return true;
      return h.text.toLowerCase().includes(searchText.toLowerCase());
    })
    .sort((a, b) => (b.frequency - a.frequency) || (b.timestamp - a.timestamp)), [recentSearches, searchText]);

  return {
    inputRef,
    itemRefs,
    searchText,
    setSearchText,
    textTokens,
    activeFilterCount,
    tab,
    setTab,
    isDropdownOpen: dropdownOpen,
    setDropdownOpen,
    activeSuggestionIdx: activeIdx,
    setActiveSuggestionIdx: setActiveIdx,
    dropdownOffsetX,
    inputScrollLeft,
    parsedToken,
    suggestions,
    filteredHistory,
    isLoadingDynamic,
    isPresetOpen: presetOpen,
    setPresetOpen,
    presetName,
    setPresetName,
    presets,
    handleInputChange,
    handleKeyDown,
    handlePaste,
    handleClear,
    commitSearch,
  handleSuggestionClick,
  handleToggleNegate,
  executeCommand,
  handleSavePreset,
    handleLoadPreset,
  handleDeletePreset,
  buildShareUrl,
  clearRecent,
  removeRecent,
  pendingHint,
  dismissHint,
  onInputScroll,
};
}

function buildSuggestions(
  searchText: string,
  chipConfigs: ChipConfig[],
  resolvedOptions: Record<string, FilterOption[]>,
  parsedToken: ParsedToken,
  lastSpaceIdx: number,
  commands: ActionCommand[],
): SuggestionItem[] {
  let suggestions: SuggestionItem[] = [];

  if (parsedToken.phase === 'filterName') {
    const neg = parsedToken.prefix.startsWith('-');
    const matchPrefix = neg ? parsedToken.prefix.slice(1) : parsedToken.prefix;

    const completedText = lastSpaceIdx === -1 ? '' : searchText.slice(0, lastSpaceIdx);
    const usedPos = new Set<string>();
    const usedNeg = new Set<string>();
    completedText
      .split(/\s+/)
      .filter(Boolean)
      .forEach((t) => {
        const isNeg = t.startsWith('-');
        const c = isNeg ? t.slice(1) : t;
        const ci = c.indexOf(':');
        if (ci > 0) {
          (isNeg ? usedNeg : usedPos).add(c.slice(0, ci));
        }
      });
    const usedLabels = neg ? usedNeg : usedPos;
    const lower = matchPrefix.toLowerCase();

    if (!neg && lower.startsWith('/')) {
      const cmdQuery = lower.slice(1);
      const matchedCommands = commands.filter((cmd) =>
        !cmdQuery || cmd.keywords.some((kw) => kw.toLowerCase().includes(cmdQuery)),
      );
      if (matchedCommands.length > 0) {
        suggestions.push({ value: '', label: 'Commands', isHeader: true });
        matchedCommands.forEach((cmd) => {
          suggestions.push({
            value: '',
            label: cmd.label,
            hint: cmd.hint,
            action: 'command' as const,
            command: cmd,
          });
        });
      }
      return suggestions;
    }

    const filterSuggestions = chipConfigs
      .filter((f) => {
        if (usedLabels.has(f.label)) return false;
        if (!lower) return true;
        if (f.label.toLowerCase().includes(lower)) return true;
        if (f.aliases?.some((a) => a.toLowerCase().includes(lower) || lower.includes(a.toLowerCase()))) return true;
        if (f.prefix && (f.prefix.includes(lower) || lower.includes(f.prefix))) return true;
        return false;
      })
      .map((f) => {
        const isPrefixMatch = f.prefix && lower && (f.prefix.includes(lower) || lower.includes(f.prefix));
        if (isPrefixMatch) {
          return {
            value: (neg ? '-' : '') + f.prefix,
            label: `${f.prefix} ${f.label}`,
            hint: TYPE_HINTS[f.type] ?? f.type,
          };
        }
        return {
          value: (neg ? '-' : '') + f.label + ':',
          label: f.label,
          hint: TYPE_HINTS[f.type] ?? f.type,
        };
      });
    suggestions = suggestions.concat(filterSuggestions);

    // 跨字段值匹配: 直接输入 "auto" → 找到 "操作人: auto-manager-bi" 等
    if (lower) {
      const valueMatches: SuggestionItem[] = [];
      const fuzzyMatches: SuggestionItem[] = [];
      for (const cfg of chipConfigs) {
        if (usedLabels.has(cfg.label)) continue;
        const opts = resolvedOptions[cfg.label] ?? [];
        if (!Array.isArray(opts)) continue;
        let hasExact = false;
        for (const opt of opts) {
          if (opt.label.toLowerCase().includes(lower)) {
            hasExact = true;
            valueMatches.push({
              value: (neg ? '-' : '') + cfg.label + ':' + opt.label,
              label: (neg ? '-' : '') + cfg.label + ': ' + opt.label,
              hint: TYPE_HINTS[cfg.type] ?? cfg.type,
            });
          }
        }
        if (!hasExact) {
          let best: { label: string; distance: number } | null = null;
          for (const opt of opts) {
            const prefix = opt.label.slice(0, lower.length + 2);
            const dist = levenshtein(lower, prefix);
            if (dist > 0 && dist <= 3 && (!best || dist < best.distance)) {
              best = { label: opt.label, distance: dist };
            }
          }
          if (best) {
            fuzzyMatches.push({
              value: (neg ? '-' : '') + cfg.label + ':' + best.label,
              label: (neg ? '-' : '') + cfg.label + ': ' + best.label,
              hint: '',
              didYouMean: best.label,
            });
          }
        }
      }
      if (valueMatches.length > 0) {
        if (suggestions.length > 0) {
          suggestions.push({ value: '', label: '', isDivider: true });
        }
        suggestions.push({ value: '', label: '匹配结果', isHeader: true });
        suggestions.push(...valueMatches);
      }
      if (fuzzyMatches.length > 0 && valueMatches.length === 0) {
        if (suggestions.length > 0) {
          suggestions.push({ value: '', label: '', isDivider: true });
        }
        suggestions.push({ value: '', label: '您是不是要找？', isHeader: true });
        suggestions.push(...fuzzyMatches);
      }
    }

    if (!neg && lower) {
      const matchedCommands = commands.filter((cmd) =>
        cmd.keywords.some((kw) => kw.toLowerCase().includes(lower)),
      );
      if (matchedCommands.length > 0) {
        if (suggestions.length > 0) {
          suggestions.push({ value: '', label: '', isDivider: true });
        }
        suggestions.push({ value: '', label: '快捷操作', isHeader: true });
        matchedCommands.forEach((cmd) => {
          suggestions.push({
            value: '',
            label: cmd.label,
            hint: cmd.hint,
            action: 'command',
            command: cmd,
          });
        });
      }
    }
  } else if (parsedToken.phase === 'filterValue' && parsedToken.filterConfig) {
    const cfg = parsedToken.filterConfig;
    const isNeg = !!parsedToken.negated;
    const neg = isNeg ? '-' : '';

    suggestions.push({
      value: '',
      label: isNeg ? '取消排除' : '排除',
      hint: isNeg ? '恢复普通' : '排除模式',
      action: 'toggleNegate' as const,
    });
    suggestions.push({ value: '', label: '', isDivider: true });

    const opts = resolvedOptions[cfg.label] ?? [];
    const lower = parsedToken.prefix.toLowerCase();
    const currentToken = lastSpaceIdx === -1 ? searchText : searchText.slice(lastSpaceIdx + 1);
    const isPrefixMode = !!(cfg.prefix && currentToken.replace(/^-/, '').startsWith(cfg.prefix));
    const valueFormat = (val: string) => isPrefixMode ? `${cfg.prefix}${val}` : `${cfg.label}:${val}`;

    let selectedLabels: string[] = [];
    if (cfg.type === 'multiSelect' || cfg.type === 'select') {
      let token = lastSpaceIdx === -1 ? searchText : searchText.slice(lastSpaceIdx + 1);
      if (token.startsWith('-')) token = token.slice(1);
      if (cfg.prefix && token.startsWith(cfg.prefix)) {
        token = token.slice(cfg.prefix.length);
      }
      const fullValueStr = token.includes(':') ? token.slice(token.indexOf(':') + 1) : token;
      const parts = fullValueStr.split(',').map((s) => s.trim());
      const endsWithComma = fullValueStr.endsWith(',');
      selectedLabels = endsWithComma
        ? parts.filter(Boolean)
        : parts.slice(0, -1).filter(Boolean);
      if (!endsWithComma && parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const exactMatch = opts.find((o) => o.label.toLowerCase() === lastPart.toLowerCase());
        if (exactMatch) selectedLabels.push(lastPart);
      }
    }

    suggestions = suggestions.concat(
      opts
        .filter((o) => !selectedLabels.some((s) => s.toLowerCase() === o.label.toLowerCase()))
        .filter((o) => !lower || selectedLabels.length > 0 || o.label.toLowerCase().includes(lower))
        .map((o) => {
          const selPrefix = selectedLabels.length > 0 ? selectedLabels.join(',') + ',' : '';
          return { value: `${neg}${valueFormat(`${selPrefix}${o.label}`)}`, label: o.label };
        }),
    );

    if (lower && (cfg.type === 'select' || cfg.type === 'multiSelect')) {
      const hasExact = opts.some((o) => !selectedLabels.includes(o.label) && o.label.toLowerCase().includes(lower));
      if (!hasExact) {
        const closest = findClosest(parsedToken.prefix, opts.map((o) => o.label), 2);
        if (closest && !selectedLabels.includes(closest)) {
          const selPrefix = selectedLabels.length > 0 ? selectedLabels.join(',') + ',' : '';
      suggestions.push({ value: '', label: '', isDivider: true });
      suggestions.push({
        value: `${neg}${valueFormat(`${selPrefix}${closest}`)}`,
        label: closest,
        hint: '您是不是要找？',
        didYouMean: closest,
      });
        }
      }
    }
  } else if (parsedToken.phase === 'freeText' && parsedToken.filterConfig) {
    const cfg = parsedToken.filterConfig;
    const labelPrefix = cfg.label + ':';
    if (cfg.type === 'numberRange' && !parsedToken.prefix) {
      suggestions = [
        { value: `${labelPrefix}>=`, label: '≥ 大于等于', hint: '如: >=100' },
        { value: `${labelPrefix}<=`, label: '≤ 小于等于', hint: '如: <=100' },
        { value: `${labelPrefix}=`, label: '= 精确匹配', hint: '如: =100' },
        { value: `${labelPrefix}`, label: '~ 范围', hint: '如: 100~200' },
      ];
    } else if (cfg.type === 'dateRange') {
      if (!parsedToken.prefix) {
        const today = dayjs();
        const shortcuts = [
          { label: '今天', start: today, end: today },
          { label: '昨天', start: today.subtract(1, 'day'), end: today.subtract(1, 'day') },
          { label: '近7天', start: today.subtract(6, 'day'), end: today },
          { label: '近15天', start: today.subtract(14, 'day'), end: today },
          { label: '近30天', start: today.subtract(29, 'day'), end: today },
          { label: '近90天', start: today.subtract(89, 'day'), end: today },
        ];
        suggestions = [
          ...shortcuts.map(({ label }) => ({
            value: `${labelPrefix}${label}`,
            label,
            hint: label,
          }          )),
          {
            value: labelPrefix,
            label: '日期范围选择器',
            action: 'datePicker' as const,
            hint: '📅',
          },
          { value: '', label: '', isDivider: true },
          { value: `${labelPrefix}`, label: '自由', hint: '2024-01-01~2024-12-31' },
        ];
      } else if (/^\d/.test(parsedToken.prefix)) {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        suggestions = [{
          value: `${labelPrefix}${now}`,
          label: now,
          hint: '当前时间',
        }];
      }
    }
  }

  return suggestions;
}

export function useFilterChipBarVM(opts: UseFilterChipBarOptions & { placeholder?: string; onSearch?: () => void }): Omit<FilterChipBarVM, 'statusTabs'> {
  const fcb = useFilterChipBar({ ...opts, onSearch: opts.onSearch });


  useEffect(() => {
    if (fcb.isPresetOpen && fcb.searchText && !fcb.presetName) {
      fcb.setPresetName(fcb.searchText.slice(0, 40));
    }
  }, [fcb.isPresetOpen]);

  const suggestions: SuggestionVM[] = useMemo(() => {
    return fcb.suggestions.map((s, idx) => ({
      key: s.isDivider ? `divider-${idx}` : s.isHeader ? `header-${s.label}` : s.value,
      label: s.label,
      hint: s.hint,
      active: idx === fcb.activeSuggestionIdx,
      type: (s.action === 'datePicker' ? 'datepicker' : s.isDivider ? 'divider' : s.isHeader ? 'header' : 'item') as SuggestionVM['type'],
      onSelect: () => {
        if (s.action === 'datePicker') return;
        if (s.action === 'command' && s.command) fcb.executeCommand(s.command);
        else if (s.action === 'toggleNegate') fcb.handleToggleNegate();
        else if (s.action === 'recent') {
          fcb.setSearchText(s.value);
          fcb.setDropdownOpen(false);
        } else fcb.handleSuggestionClick(s.value);
      },
    }));
  }, [fcb.suggestions, fcb.activeSuggestionIdx, fcb.handleToggleNegate, fcb.handleSuggestionClick, fcb.executeCommand]);

  const history: HistoryVM[] = useMemo(() => {
    return fcb.filteredHistory.slice(0, 8).map((h) => ({
      key: String(h.timestamp),
      text: h.text,
      count: h.total,
      onSelect: () => {
        fcb.setSearchText(h.text);
        fcb.setDropdownOpen(false);
      },
      onRemove: () => fcb.removeRecent(h.text),
    }));
  }, [fcb.filteredHistory, fcb.removeRecent]);

  const presets: PresetVM[] = useMemo(() => {
    return fcb.presets.map((p) => ({
      key: p.id,
      name: p.name,
      searchText: p.searchText,
      onSelect: () => fcb.handleLoadPreset(p),
      onShare: () => {
        navigator.clipboard.writeText(fcb.buildShareUrl(p));
      },
      onDelete: () => fcb.handleDeletePreset(p.id),
    }));
  }, [fcb.presets, fcb.handleLoadPreset, fcb.handleDeletePreset, fcb.buildShareUrl]);

  const input: InputVM = useMemo(() => ({
    ref: fcb.inputRef,
    value: fcb.searchText,
    placeholder: opts.placeholder ?? autoPlaceholder(opts.chipConfigs),
    textTokens: fcb.textTokens,
    cursorWidth: fcb.dropdownOffsetX,
    scrollLeft: fcb.inputScrollLeft,
    onChange: fcb.handleInputChange,
    onKeyDown: fcb.handleKeyDown,
    onPaste: fcb.handlePaste,
    onFocus: () => fcb.setDropdownOpen(true),
    onBlur: () => {},
    onScroll: fcb.onInputScroll,
  }), [fcb, opts.placeholder, opts.chipConfigs]);

  const dropdown: DropdownVM = useMemo(() => {
    const phase = fcb.parsedToken.phase;
    const cfg = fcb.parsedToken.filterConfig;
    let hint = '按回车直接搜索';
    if (phase === 'filterValue' && cfg?.type === 'multiSelect') {
      hint = '按逗号可多选';
    } else if (phase === 'freeText' && cfg) {
      hint = cfg.type === 'numberRange'
        ? '直接输入数值，如: 100 或 100~200'
        : cfg.type === 'dateRange'
          ? '格式: 2024-01-01~2024-12-31'
          : '直接输入文本，按空格结束';
    }
    return {
      suggestions,
      history,
      footer: phase === 'filterValue' ? (
        cfg?.type === 'multiSelect' ? '按逗号可多选' : '按空格继续添加'
      ) : undefined,
      hint,
      isOpen: fcb.isDropdownOpen,
      isLoading: fcb.isLoadingDynamic,
      offsetX: fcb.dropdownOffsetX,
    };
  }, [suggestions, history, fcb.isDropdownOpen, fcb.isLoadingDynamic, fcb.dropdownOffsetX, fcb.parsedToken]);

  const isCurrentSearchPreset = useMemo(
    () => !!fcb.searchText && fcb.presets.some(p => p.searchText === fcb.searchText),
    [fcb.searchText, fcb.presets],
  );

  return {
    input,
    dropdown,
    presets,
    activeFilterCount: fcb.activeFilterCount,
    pendingHint: fcb.pendingHint ?? null,
    isPresetOpen: fcb.isPresetOpen,
    setPresetOpen: fcb.setPresetOpen,
    setDropdownOpen: fcb.setDropdownOpen,
    setActiveSuggestionIdx: fcb.setActiveSuggestionIdx,
    commitSearch: fcb.commitSearch,
    handleClear: fcb.handleClear,
    setSearchText: fcb.setSearchText,
    tab: fcb.tab,
    setTab: fcb.setTab,
    presetName: fcb.presetName,
    setPresetName: fcb.setPresetName,
    handleSavePreset: fcb.handleSavePreset,
    dismissHint: fcb.dismissHint,
    clearRecent: fcb.clearRecent,
    isCurrentSearchPreset,
  };
}
