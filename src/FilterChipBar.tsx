import { useState, type ReactNode } from 'react';
import {
  Search,
  X,
  Star,
  Trash2,
  Share2,
  HelpCircle,
  Clock,
  Camera,
  Loader2,
} from 'lucide-react';
import {
  type ChipConfig,
  type TabOption,
  type FilterChipBarResult,
  type TextToken,
  type ActionCommand,
} from './types';
import { truncate } from './tokenize';
import { useFilterChipBar } from './hook';
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './ui/popover';
import { cn } from './lib/utils';

const DEFAULT_PLACEHOLDER = 'Search or type filters...';

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
  initialTab?: number;
  commands?: ActionCommand[];
  placeholder?: string;
  syntaxHelp?: ReactNode;
  onImageSearch?: () => void;
  footerExtra?: ReactNode;
  searchResultCount?: number;
  searchLoading?: boolean;
}

export default function FilterChipBar({
  chipConfigs,
  onFiltersChange,
  storageNamespace,
  tabs,
  rightExtra,
  initialSearchText = '',
  initialTab = -1,
  commands,
  placeholder = DEFAULT_PLACEHOLDER,
  syntaxHelp = DEFAULT_SYNTAX_HELP,
  onImageSearch,
  footerExtra,
  searchResultCount,
  searchLoading,
}: FilterChipBarProps) {
  const fcb = useFilterChipBar({
    chipConfigs,
    storageNamespace,
    commands,
    initialSearchText,
    initialTab,
    onFiltersChange,
    searchResultCount,
    searchLoading,
  });

  const [copiedPresetId, setCopiedPresetId] = useState<string | null>(null);

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
        <span className="text-muted-foreground">:</span>
        <span className={cn(valueColor, valueBg, 'rounded-sm')}>
          {t.truncated ? truncate(t.value) : t.value}
        </span>
      </span>
    );
  };

  const renderSuggestionLabel = (label: string, matchText: string): ReactNode => {
    const lower = matchText.toLowerCase();
    if (!lower) return label;
    const idx = label.toLowerCase().indexOf(lower);
    if (idx < 0) return label;
    return (
      <>
        {label.slice(0, idx)}
        <span className="font-semibold text-foreground">
          {label.slice(idx, idx + lower.length)}
        </span>
        {label.slice(idx + lower.length)}
      </>
    );
  };

  const dropdownContent: ReactNode = (
    <div
      className="flex"
      style={{ maxHeight: 320, minHeight: 0 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {fcb.filteredHistory.length > 0 && (
        <div className="w-[200px] max-h-80 overflow-y-auto border-r border-border py-0.5 shrink-0">
          {!fcb.searchText && (
            <div className="px-3 pt-1 pb-0.5 text-[11px] text-muted-foreground/60 font-semibold">
              Recent
            </div>
          )}
          {fcb.filteredHistory.map((h, hi) => (
            <div
              key={hi}
              onMouseDown={(ev) => {
                ev.preventDefault();
                fcb.setSearchText(h.text);
                fcb.setDropdownOpen(false);
              }}
              className="px-3 py-1 cursor-pointer text-xs text-foreground flex items-center gap-0.5 hover:bg-accent transition-colors"
            >
              <Clock className="size-[11px] text-muted-foreground/60 shrink-0" />
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {h.text.length > 20 ? h.text.slice(0, 17) + '...' : h.text}
              </span>
              <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                {h.total}
              </span>
            </div>
          ))}
          {!fcb.searchText && (
            <div
              onMouseDown={(ev) => {
                ev.preventDefault();
                fcb.clearRecent();
              }}
              className="px-3 py-1 cursor-pointer text-xs text-muted-foreground/80 hover:bg-accent transition-colors"
            >
              Clear history
            </div>
          )}
        </div>
      )}
      <div className="flex-1 max-h-80 overflow-y-auto py-0.5" role="listbox" id="fcb-listbox">
        {fcb.suggestions.length === 0 ? (
          fcb.isLoadingDynamic ? (
            <div className="p-2 space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                  <div className="size-3 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="h-3 flex-1 rounded bg-muted animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  <div className="h-3 w-8 rounded bg-muted animate-pulse shrink-0" style={{ animationDelay: `${i * 100}ms` }} />
                </div>
              ))}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground/60">
                <Loader2 className="size-3 animate-spin" />
                Loading options...
              </div>
            </div>
          ) : (
            <div className="p-3 text-center">
              <span className="text-xs text-muted-foreground/80">
                {fcb.parsedToken.phase === 'freeText' && fcb.parsedToken.filterConfig
                  ? fcb.parsedToken.filterConfig.type === 'numberRange'
                    ? 'Enter a number, e.g. 100 or 100~200'
                    : fcb.parsedToken.filterConfig.type === 'dateRange'
                      ? 'Format: 2024-01-01~2024-12-31'
                      : 'Type text and press space to confirm'
                  : 'No matching filters'}
              </span>
            </div>
          )
        ) : (
          fcb.suggestions.map((s, idx) => {
            if (s.isDivider) {
              return (
                <div
                  key={idx}
                  className="h-px bg-border my-0.5 mx-3"
                />
              );
            }
            if (s.isHeader) {
              return (
                <div
                  key={idx}
                  className="px-3 pt-1 pb-0.5 text-[11px] text-muted-foreground/60 font-semibold"
                >
                  {s.label}
                </div>
              );
            }
            const isToggle = s.action === 'toggleNegate';
            const isCommand = s.action === 'command' && !!s.command;
            const isNeg = !!fcb.parsedToken.negated;
            return (
              <div
                key={idx}
                id={`fcb-option-${idx}`}
                role="option"
                aria-selected={idx === fcb.activeSuggestionIdx}
                ref={(el) => {
                  fcb.itemRefs.current[idx] = el;
                }}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  if (isCommand && s.command) fcb.executeCommand(s.command);
                  else if (isToggle) fcb.handleToggleNegate();
                  else fcb.handleSuggestionClick(s.value);
                }}
                onMouseEnter={() => fcb.setActiveSuggestionIdx(idx)}
                className={cn(
                  'px-3 py-1 cursor-pointer text-xs flex justify-between items-center gap-0.5 transition-colors',
                  isToggle
                    ? isNeg
                      ? 'text-green-600 font-medium'
                      : 'text-destructive font-medium'
                    : isCommand
                      ? 'text-primary font-medium'
                      : 'text-foreground font-normal',
                  idx === fcb.activeSuggestionIdx && 'bg-accent',
                )}
              >
                {isToggle && (
                  <span className="shrink-0">{isNeg ? '✓' : '⊘'}</span>
                )}
                {isCommand && (
                  <span className="shrink-0 text-muted-foreground/60">→</span>
                )}
                <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                  {isToggle
                    ? isNeg
                      ? 'Remove exclusion'
                      : 'Exclude'
                    : isCommand
                      ? s.label
                      : renderSuggestionLabel(s.label, fcb.parsedToken.prefix)}
                </span>
                {s.hint && (
                  <span className="text-muted-foreground/60 text-[11px] shrink-0">
                    {s.hint}
                  </span>
                )}
              </div>
            );
          })
        )}
        {fcb.isLoadingDynamic && fcb.suggestions.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-[11px] text-muted-foreground/60">
            <Loader2 className="size-3 animate-spin" />
            Loading more options...
          </div>
        )}
      </div>
    </div>
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
                    style={{ transform: `translateX(${-fcb.inputScrollLeft}px)`, whiteSpace: 'pre' }}
                    className="min-w-max"
                  >
                    {fcb.searchText ? (
                      fcb.textTokens.map(renderTextToken)
                    ) : (
                      <span className="text-muted-foreground/60">{placeholder}</span>
                    )}
                  </div>
                </div>
                <input
                  ref={fcb.inputRef as React.Ref<HTMLInputElement>}
                  type="text"
                  role="combobox"
                  aria-expanded={fcb.isDropdownOpen}
                  aria-controls="fcb-listbox"
                  aria-activedescendant={fcb.activeSuggestionIdx >= 0 ? `fcb-option-${fcb.activeSuggestionIdx}` : undefined}
                  aria-autocomplete="list"
                  aria-label="Search filters"
                  value={fcb.searchText}
                  onChange={fcb.handleInputChange}
                  onPaste={fcb.handlePaste}
                  onFocus={() => fcb.setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => fcb.setDropdownOpen(false), 150)}
                  onKeyDown={fcb.handleKeyDown}
                  onScroll={(e) => fcb.onInputScroll(e.currentTarget.scrollLeft)}
                  className="w-full h-full border-none outline-none bg-transparent text-transparent caret-foreground p-0 m-0 relative z-10 text-sm"
                />
              </div>
              {fcb.searchText && (
                <X
                  className="size-4 text-muted-foreground/60 cursor-pointer shrink-0 ml-0.5 hover:text-foreground transition-colors"
                  onMouseDown={(e: React.MouseEvent) => {
                    e.preventDefault();
                    fcb.handleClear();
                  }}
                />
              )}
              {onImageSearch && (
                <Camera
                  className="size-4 text-primary cursor-pointer shrink-0 ml-0.5 hover:text-primary/80 transition-colors"
                  onClick={onImageSearch}
                />
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
          >
            {dropdownContent}
          </PopoverContent>
        </Popover>

        {fcb.activeFilterCount > 0 && (
          <span className="text-xs text-muted-foreground/80 shrink-0 whitespace-nowrap">
            {`${fcb.activeFilterCount} filter${fcb.activeFilterCount > 1 ? 's' : ''}`}
          </span>
        )}

        <Popover open={fcb.isPresetOpen} onOpenChange={fcb.setPresetOpen}>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Presets"
            >
              <Star className="size-4" />
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
