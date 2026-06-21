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
  loadPresets,
  savePresets,
  loadRecent,
  saveRecent,
} from './types';
import { parseCurrentToken, parseQuery, type ParsedToken } from './parser';
import { tokenizeSearchText } from './tokenize';

const TYPE_HINTS: Record<string, string> = {
  select: 'Select',
  multiSelect: 'Multi',
  input: 'Text',
  dateRange: 'Date',
  numberRange: 'Number',
};

const ICON_OFFSET = 14 + 8 + 12;

export interface UseFilterChipBarOptions {
  chipConfigs: ChipConfig[];
  storageNamespace: string;
  commands?: ActionCommand[];
  initialSearchText?: string;
  initialTab?: string | number;
  onFiltersChange?: (result: FilterChipBarResult) => void;
  fontInfo?: { fontSize: number; fontFamily: string };
  searchResultCount?: number;
  searchLoading?: boolean;
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
  handleSuggestionClick: (value: string) => void;
  handleToggleNegate: () => void;
  executeCommand: (cmd: ActionCommand) => void;
  handleSavePreset: () => void;
  handleLoadPreset: (preset: SearchPreset) => void;
  handleDeletePreset: (id: string) => void;
  buildShareUrl: (preset: SearchPreset) => string;
  clearRecent: () => void;

  onInputScroll: (scrollLeft: number) => void;
}

export function useFilterChipBar({
  chipConfigs,
  storageNamespace,
  commands = [],
  initialSearchText = '',
  initialTab = -1,
  onFiltersChange,
  fontInfo,
  searchResultCount,
  searchLoading,
}: UseFilterChipBarOptions): UseFilterChipBarReturn {
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

  useEffect(() => {
    let cancelled = false;
    const asyncConfigs = chipConfigs.filter(
      (c): c is ChipConfig & { options: AsyncOptions } => typeof c.options === 'function',
    );
    asyncConfigs.forEach(async (config) => {
      setLoadingLabels((prev) => new Set(prev).add(config.label));
      try {
        const result = await config.options();
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
    return () => { cancelled = true; };
  }, [chipConfigs]);

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

  const applyFilters = useCallback(
    (text: string, s: string | number) => {
      const { chips, freeText } = parseQuery(text, chipConfigs, allOptions);
      const cleaned = Object.fromEntries(
        Object.entries(chips).filter(([, v]) => v !== undefined && v !== null && v !== ''),
      );
      cbRef.current?.({ searchText: text, chips: cleaned, freeText, tab: s });
      pendingSearchRef.current = text.trim() || null;
    },
    [chipConfigs, allOptions],
  );

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
        const entry: RecentSearch = { text, total: searchResultCount ?? 0, timestamp: Date.now() };
        const next = [entry, ...prev.filter((e) => e.text !== text)].slice(0, 10);
        saveRecent(storageNamespace, next);
        return next;
      });
    }
  }, [searchLoading, searchResultCount, storageNamespace]);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    saveRecent(storageNamespace, []);
  }, [storageNamespace]);

  useEffect(() => {
    if (activeIdx >= 0 && itemRefs.current[activeIdx]) {
      itemRefs.current[activeIdx]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollLeft = scrollPosRef.current;
      setInputScrollLeft(inputRef.current.scrollLeft);
    }
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
      } else if (e.key === 'Tab' && activeIdx >= 0 && activeIdx < suggestions.length) {
        const s = suggestions[activeIdx];
        if (s.isDivider) return;
        e.preventDefault();
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
      } else if (e.key === 'Backspace') {
        const cursorPos = e.currentTarget.selectionStart;
        if (cursorPos === 0 && searchText.length > 0) {
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
    applyFilters('', tab);
    inputRef.current?.focus();
  }, [tab, applyFilters]);

  const onInputScroll = useCallback((scrollLeft: number) => {
    scrollPosRef.current = scrollLeft;
    setInputScrollLeft(scrollLeft);
  }, []);

  const isLoadingDynamic = useMemo(() => {
    if (parsedToken.phase !== 'filterValue' || !parsedToken.filterConfig) return false;
    return loadingLabels.has(parsedToken.filterConfig.label);
  }, [parsedToken, loadingLabels]);

  const filteredHistory = useMemo(() => recentSearches.filter((h) => {
    if (!searchText) return true;
    return h.text.toLowerCase().includes(searchText.toLowerCase());
  }), [recentSearches, searchText]);

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
  handleSuggestionClick,
  handleToggleNegate,
  executeCommand,
  handleSavePreset,
    handleLoadPreset,
  handleDeletePreset,
  buildShareUrl,
  clearRecent,
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
    const filterSuggestions = chipConfigs
      .filter((f) => (!lower || f.label.toLowerCase().includes(lower)) && !usedLabels.has(f.label))
      .map((f) => ({
        value: (neg ? '-' : '') + f.label + ':',
        label: f.label,
        hint: TYPE_HINTS[f.type] ?? f.type,
      }));
    suggestions = suggestions.concat(filterSuggestions);

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
      hint: isNeg ? '恢复正常' : '反选模式',
      action: 'toggleNegate' as const,
    });
    suggestions.push({ value: '', label: '', isDivider: true });

    const opts = resolvedOptions[cfg.label] ?? [];
    const lower = parsedToken.prefix.toLowerCase();

    let selectedLabels: string[] = [];
    if (cfg.type === 'multiSelect' || cfg.type === 'select') {
      let token = lastSpaceIdx === -1 ? searchText : searchText.slice(lastSpaceIdx + 1);
      if (token.startsWith('-')) token = token.slice(1);
      const colonIdx = token.indexOf(':');
      const fullValueStr = token.slice(colonIdx + 1);
      const parts = fullValueStr.split(',').map((s) => s.trim());
      const endsWithComma = fullValueStr.endsWith(',');
      selectedLabels = endsWithComma
        ? parts.filter(Boolean)
        : parts.slice(0, -1).filter(Boolean);
    }

    suggestions = suggestions.concat(
      opts
        .filter((o) => !selectedLabels.includes(o.label))
        .filter((o) => !lower || o.label.toLowerCase().includes(lower))
        .map((o) => {
          const prefix = selectedLabels.length > 0 ? selectedLabels.join(',') + ',' : '';
          return { value: `${neg}${cfg.label}:${prefix}${o.label}`, label: o.label };
        }),
    );
  } else if (parsedToken.phase === 'freeText' && parsedToken.filterConfig) {
    const cfg = parsedToken.filterConfig;
    const labelPrefix = cfg.label + ':';
    if (cfg.type === 'numberRange' && !parsedToken.prefix) {
      suggestions = [
        { value: `${labelPrefix}>=`, label: '≥ 大于等于', hint: '如: >=100' },
        { value: `${labelPrefix}<=`, label: '≤ 小于等于', hint: '如: <=100' },
        { value: `${labelPrefix}=`, label: '= 精确匹配', hint: '如: =100' },
        { value: `${labelPrefix}`, label: '~ Range', hint: 'e.g. 100~200' },
      ];
    } else if (cfg.type === 'dateRange' && !parsedToken.prefix) {
      suggestions = [{ value: `${labelPrefix}`, label: 'Date range', hint: '2024-01-01~2024-12-31' }];
    }
  }

  return suggestions;
}
