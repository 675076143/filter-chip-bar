import { useState, useEffect, useMemo, type ReactNode } from 'react';
import {
  Search,
  X,
  Star,
  Trash2,
  Share2,
  HelpCircle,
  Camera,
} from 'lucide-react';
import {
  type ChipConfig,
  type TabOption,
  type FilterChipBarResult,
  type TextToken,
  type ActionCommand,
} from './types';
import { truncate } from './tokenize';
import { useFilterChipBar, autoPlaceholder } from './hook';
import { dedupeFilterTokens } from './parser';
import FilterChipBarPanel from './FilterChipBarPanel';
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './ui/popover';
import { cn } from './lib/utils';
import { CalendarRangePanel } from './CalendarRangePanel';

const DEFAULT_SYNTAX_HELP: ReactNode = (
  <div className="text-xs leading-relaxed max-w-[280px] space-y-0.5">
    <div><b>key:value</b> — Filter by field</div>
    <div><b>-key:value</b> — Exclude matches (negation)</div>
    <div><b>key:"two words"</b> — Quote values with spaces</div>
    <div><b>key:val1,val2</b> — Multiple values (comma)</div>
    <div><b>num:&gt;=100</b> — Numeric comparison (≥ ≤ = ~)</div>
    <div><b>date:2024-01-01~2024-12-31</b> — Date range</div>
    <div><b>space</b> — Separate multiple conditions</div>
  </div>
);

export interface FilterChipBarProps {
  chipConfigs: ChipConfig[];
  onFiltersChange: (result: FilterChipBarResult) => void;
  storageNamespace: string;
  tabs?: TabOption[];
  rightExtra?: ReactNode;
  initialSearchText?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  initialTab?: number;
  commands?: ActionCommand[];
  placeholder?: string;
  syntaxHelp?: ReactNode;
  onImageSearch?: () => void;
  footerExtra?: ReactNode;
  searchResultCount?: number;
  searchLoading?: boolean;
  locale?: 'en' | 'zh';
}

export default function FilterChipBar({
  chipConfigs,
  onFiltersChange,
  storageNamespace,
  tabs,
  rightExtra,
  initialSearchText = '',
  value,
  onValueChange,
  initialTab = -1,
  commands,
  placeholder,
  syntaxHelp = DEFAULT_SYNTAX_HELP,
  onImageSearch,
  footerExtra,
  searchResultCount,
  searchLoading,
  locale = 'en',
}: FilterChipBarProps) {
  const listboxId = `${storageNamespace.replace(/[^a-zA-Z0-9_-]/g, '-')}-filter-chip-listbox`;
  const resolvedPlaceholder = placeholder ?? autoPlaceholder(chipConfigs, locale);
  const fcb = useFilterChipBar({
    chipConfigs,
    storageNamespace,
    commands,
    initialSearchText,
    value,
    onValueChange,
    initialTab,
    onFiltersChange,
    searchResultCount,
    searchLoading,
  });

  const isCurrentSearchPreset = useMemo(
    () => fcb.searchText && fcb.presets.some(p => p.searchText === fcb.searchText),
    [fcb.searchText, fcb.presets],
  );

  useEffect(() => {
    if (fcb.isPresetOpen && fcb.searchText && !fcb.presetName) {
      fcb.setPresetName(fcb.searchText.slice(0, 40));
    }
  }, [fcb.isPresetOpen]);

  const [copiedPresetId, setCopiedPresetId] = useState<string | null>(null);
  const [datePickerState, setDatePickerState] = useState<{ prefix: string } | null>(null);

  const renderTextToken = (t: TextToken, key: number): ReactNode => {
    if (t.type === 'whitespace') return <span key={key}>{t.text}</span>;
    if (t.type === 'freeText') {
      return (
        <span key={key} className="text-foreground">
          {t.truncated ? truncate(t.text) : t.text}
        </span>
      );
    }
    const valueColor = !t.isLabelValid
      ? 'text-yellow-600'
      : !t.isValueValid
        ? 'text-destructive'
        : t.isNegated
          ? 'text-destructive'
          : 'text-primary';
    const valueBg = !t.isLabelValid
      ? ''
      : !t.isValueValid
        ? 'bg-destructive/10'
        : t.isNegated
          ? 'bg-destructive/10'
          : 'bg-primary/10';
    return (
      <span key={key}>
        {t.isNegated && <span className="text-destructive font-semibold">-</span>}
        <span className="text-foreground">{t.label}</span>
        {!t.isPrefix && <span className="text-muted-foreground">:</span>}
        <span className={cn(valueColor, valueBg, 'rounded-sm')}>
          {t.truncated ? truncate(t.value) : t.value}
        </span>
      </span>
    );
  };

  const dropdownContent: ReactNode = (
    <FilterChipBarPanel
      listboxId={listboxId}
      vm={{
        dropdown: {
          suggestions: fcb.suggestions.map((s, idx) => ({
            key: s.isDivider
              ? `div-${idx}`
              : s.isHeader
                ? `hdr-${idx}-${s.label}`
                : s.action === 'datePicker'
                  ? s.value
                  : `item-${idx}-${s.action ?? 'default'}-${s.value || s.label}`,
            label: s.label,
            hint: s.hint,
            active: idx === fcb.activeSuggestionIdx,
            type: (s.action === 'datePicker' ? 'datepicker' : s.isDivider ? 'divider' : s.isHeader ? 'header' : 'item') as any,
            onSelect: () => {
              if (s.action === 'command' && s.command) fcb.executeCommand(s.command);
              else if (s.action === 'toggleNegate') fcb.handleToggleNegate();
              else if (s.action === 'recent') { fcb.setSearchText(s.value); fcb.setDropdownOpen(false); }
              else fcb.handleSuggestionClick(s.value);
            },
          })),
          history: fcb.filteredHistory.slice(0, 8).map(h => ({
            key: String(h.timestamp),
            text: h.text,
            count: h.total,
            onSelect: () => { fcb.setSearchText(h.text); fcb.setDropdownOpen(false); },
            onRemove: () => fcb.removeRecent(h.text),
          })),
          footer: fcb.parsedToken.phase === 'filterValue' ? (
            fcb.parsedToken.filterConfig?.type === 'multiSelect' ? 'Space → next  Comma → multi' : 'Space → next condition'
          ) : undefined,
          hint: '',
          isOpen: fcb.isDropdownOpen,
          isLoading: fcb.isLoadingDynamic,
          offsetX: fcb.dropdownOffsetX,
        },
        input: {} as any,
        presets: [],
        activeFilterCount: fcb.activeFilterCount,
        pendingHint: null,
        isPresetOpen: false,
        setPresetOpen: () => {},
        setDropdownOpen: fcb.setDropdownOpen,
        setActiveSuggestionIdx: fcb.setActiveSuggestionIdx,
        commitSearch: () => {},
        handleClear: fcb.handleClear,
        setSearchText: fcb.setSearchText,
        tab: -1,
        setTab: () => {},
        presetName: '',
        setPresetName: () => {},
        handleSavePreset: () => {},
        dismissHint: () => {},
        clearRecent: fcb.clearRecent,
          isCurrentSearchPreset: false,
          statusTabs: [],
        }}
      onDatePicker={(prefix: string) => setDatePickerState({ prefix })}
    />
  );

  const presetContent: ReactNode = (
    <div className="w-[280px]">
      <div className="p-3 border-b border-border">
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
            placeholder="Preset name"
            value={fcb.presetName}
            onChange={(e) => fcb.setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fcb.handleSavePreset();
            }}
          />
          <button
            className="h-7 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
            onClick={fcb.handleSavePreset}
            disabled={!fcb.presetName.trim()}
        >
          Save
        </button>
        </div>
      </div>
      {fcb.presets.length === 0 ? (
        <div className="text-xs text-muted-foreground/80 text-center py-3 px-3">
          No saved presets
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto p-1">
          {fcb.presets.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 p-1.5 cursor-pointer rounded-sm hover:bg-accent transition-colors"
              onClick={() => fcb.handleLoadPreset(p)}
            >
              <span className="text-xs text-yellow-600 shrink-0 leading-none">★</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {p.name}
                </div>
                <div className="text-[11px] text-muted-foreground/60 truncate">
                  {p.searchText || '(empty)'}
                </div>
              </div>
              {copiedPresetId === p.id ? (
                <span className="text-[10px] text-green-600 shrink-0">Copied!</span>
              ) : (
                <Share2
                  className="size-3 text-muted-foreground/60 shrink-0 cursor-pointer hover:text-foreground transition-colors"
                  onClick={(ev: React.MouseEvent) => {
                    ev.stopPropagation();
                    const url = fcb.buildShareUrl(p);
                    navigator.clipboard.writeText(url);
                    setCopiedPresetId(p.id);
                    setTimeout(() => setCopiedPresetId(null), 2000);
                  }}
                />
              )}
              <Trash2
                className="size-3 text-muted-foreground/60 shrink-0 cursor-pointer hover:text-destructive transition-colors"
                onClick={(ev: React.MouseEvent) => {
                  ev.stopPropagation();
                  fcb.handleDeletePreset(p.id);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const showStatusBar = !!tabs && tabs.length > 0;

  return (
    <div className="bg-background rounded-lg border border-border px-6 py-3 mb-4">
      <div className="flex gap-2 items-center">
        <Popover open={fcb.isDropdownOpen}>
          <PopoverAnchor asChild>
            <div
              className="flex items-center flex-1 h-8 px-3 bg-background border border-border rounded-md text-sm relative cursor-text overflow-hidden hover:border-ring transition-colors"
              onClick={() => fcb.inputRef.current?.focus()}
            >
              <Search className="size-4 text-muted-foreground/80 mr-0.5 shrink-0" />
              <div className="relative flex-1 h-full flex items-center overflow-hidden">
                <div
                  className="absolute inset-0 flex items-center pointer-events-none overflow-hidden text-sm"
                  aria-hidden
                >
                  <div
                    style={{ position: 'relative', left: -fcb.inputScrollLeft, whiteSpace: 'pre' }}
                    className="min-w-max"
                  >
                    {fcb.searchText ? (
                      fcb.textTokens.map(renderTextToken)
                    ) : (
                      <span className="text-muted-foreground/60">{resolvedPlaceholder}</span>
                    )}
                  </div>
                </div>
                <input
                  ref={fcb.inputRef as React.Ref<HTMLInputElement>}
                  type="text"
                  role="combobox"
                  aria-expanded={fcb.isDropdownOpen}
                  aria-controls={listboxId}
                  aria-activedescendant={fcb.activeSuggestionIdx >= 0 ? `${listboxId}-option-${fcb.activeSuggestionIdx}` : undefined}
                  aria-autocomplete="list"
                  aria-label="Search filters"
                  value={fcb.searchText}
                  onChange={fcb.handleInputChange}
                  onPaste={fcb.handlePaste}
                  onFocus={() => fcb.setDropdownOpen(true)}
                  onBlur={() => !datePickerState && setTimeout(() => fcb.setDropdownOpen(false), 150)}
                  onKeyDown={fcb.handleKeyDown}
                  onScroll={(e) => fcb.onInputScroll(e.currentTarget.scrollLeft)}
                  className="w-full h-full border-none outline-none bg-transparent text-transparent caret-foreground p-0 m-0 relative z-10 text-sm"
                />
              </div>
              {fcb.searchText && (
                <button
                  type="button"
                  aria-label="Clear filters"
                  className="inline-flex size-6 items-center justify-center border-0 bg-transparent p-0 text-muted-foreground/60 cursor-pointer shrink-0 ml-0.5 hover:text-foreground transition-colors"
                  onMouseDown={(e: React.MouseEvent) => {
                    e.preventDefault();
                    fcb.handleClear();
                  }}
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
              {onImageSearch && (
                <button
                  type="button"
                  aria-label="Search by image"
                  className="inline-flex size-6 items-center justify-center border-0 bg-transparent p-0 text-primary cursor-pointer shrink-0 ml-0.5 hover:text-primary/80 transition-colors"
                  onClick={onImageSearch}
                >
                  <Camera className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            alignOffset={fcb.dropdownOffsetX}
            sideOffset={4}
            className="w-[500px] max-h-80 overflow-hidden p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={datePickerState ? (e) => e.preventDefault() : undefined}
            onPointerDownOutside={datePickerState ? (e) => e.preventDefault() : undefined}
          >
            {datePickerState ? (
              <div className="p-2 bg-background rounded-md shadow-lg">
                <CalendarRangePanel
                  onChange={({ start, end }) => {
                    const s = start.format('YYYY-MM-DD');
                    const e = end.format('YYYY-MM-DD');
                    const lastSpace = fcb.searchText.lastIndexOf(' ');
                    const before = lastSpace === -1 ? '' : fcb.searchText.slice(0, lastSpace + 1);
                    fcb.setSearchText(dedupeFilterTokens(`${before}${datePickerState.prefix}${s}~${e}`, chipConfigs));
                    setDatePickerState(null);
                    fcb.setDropdownOpen(false);
                  }}
                />
              </div>
            ) : (
              dropdownContent
            )}
          </PopoverContent>
        </Popover>

        {fcb.activeFilterCount > 0 && (
          <span className="text-xs text-muted-foreground/80 shrink-0 whitespace-nowrap">
            {`${fcb.activeFilterCount} filter${fcb.activeFilterCount > 1 ? 's' : ''}`}
          </span>
        )}

        <button
          type="button"
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            fcb.commitSearch();
          }}
          className="inline-flex items-center justify-center h-7 px-3 text-xs font-medium text-primary-foreground bg-primary rounded shrink-0 cursor-pointer select-none border-none hover:opacity-85 transition-opacity"
        >
          搜索
        </button>

        <Popover open={fcb.isPresetOpen} onOpenChange={fcb.setPresetOpen}>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Presets"
            >
              <Star className={cn('size-4', isCurrentSearchPreset && 'fill-amber-400 text-amber-400')} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0 w-[280px]">
            {presetContent}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Syntax help"
            >
              <HelpCircle className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-3">
            <div className="text-sm font-medium mb-1.5">Search Syntax</div>
            {syntaxHelp}
          </PopoverContent>
        </Popover>

        {rightExtra}
      </div>

      {(showStatusBar || footerExtra) && (
        <div className="flex gap-0.5 items-center flex-wrap mt-2">
          {showStatusBar &&
            tabs!.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                className={cn(
                  'border-none bg-transparent px-1 py-1 text-xs rounded-sm whitespace-nowrap shrink-0 inline-flex items-center gap-1 cursor-pointer transition-colors',
                  fcb.tab === opt.value
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground/80',
                )}
                onClick={() => fcb.setTab(opt.value as number)}
              >
                {opt.label}
                {opt.count != null && (
                  <span className="text-xs text-muted-foreground/60 tabular-nums">
                    {opt.count}
                  </span>
                )}
              </button>
            ))}
          {footerExtra && (
            <div className="ml-auto flex gap-0.5 items-center">
              {footerExtra}
            </div>
          )}
        </div>
      )}

      {fcb.pendingHint && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs text-amber-900 dark:text-amber-100">
          <span className="flex-1">{fcb.pendingHint.text}</span>
          <button
            onClick={fcb.dismissHint}
            className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
