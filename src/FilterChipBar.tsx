import { type ReactNode } from 'react';
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
  type FilterOption,
  type FilterChipBarResult,
  type TextToken,
  type ActionCommand,
} from './types';
import { truncate } from './tokenize';
import { useFilterChipBar } from './hook';
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './ui/popover';
import { cn } from './lib/utils';

const DEFAULT_PLACEHOLDER = '搜索或输入筛选条件';

const DEFAULT_SYNTAX_HELP: ReactNode = (
  <div className="text-xs leading-relaxed max-w-[280px] space-y-0.5">
    <div>
      <b>key:value</b> — 筛选指定条件
    </div>
    <div>
      <b>-key:value</b> — 排除匹配项（反选）
    </div>
    <div>
      <b>key:&quot;带空格的值&quot;</b> — 引号包裹含空格的值
    </div>
    <div>
      <b>key:val1,val2</b> — 多值逗号分隔
    </div>
    <div>
      <b>数值字段:&gt;=100</b> — 数值比较（≥ ≤ = ~）
    </div>
    <div>
      <b>日期字段:2024-01-01~2024-12-31</b> — 区间
    </div>
    <div>
      <b>空格</b> — 分隔多个条件
    </div>
  </div>
);

export interface FilterChipBarProps {
  chipConfigs: ChipConfig[];
  onFiltersChange: (result: FilterChipBarResult) => void;
  storageNamespace: string;
  statusOptions?: FilterOption[];
  statusCounts?: Record<number, number>;
  rightExtra?: ReactNode;
  dynamicOptions?: Record<string, FilterOption[]>;
  dynamicOptionsLoading?: boolean;
  initialSearchText?: string;
  initialStat?: number;
  commands?: ActionCommand[];
  placeholder?: string;
  syntaxHelp?: ReactNode;
  onImageSearch?: () => void;
  statusBarExtra?: ReactNode;
  searchResultCount?: number;
  searchLoading?: boolean;
}

export default function FilterChipBar({
  chipConfigs,
  onFiltersChange,
  storageNamespace,
  statusOptions,
  statusCounts,
  rightExtra,
  dynamicOptions,
  dynamicOptionsLoading,
  initialSearchText = '',
  initialStat = -1,
  commands,
  placeholder = DEFAULT_PLACEHOLDER,
  syntaxHelp = DEFAULT_SYNTAX_HELP,
  onImageSearch,
  statusBarExtra,
  searchResultCount,
  searchLoading,
}: FilterChipBarProps) {
  const fcb = useFilterChipBar({
    chipConfigs,
    storageNamespace,
    dynamicOptions,
    dynamicOptionsLoading,
    commands,
    initialSearchText,
    initialStat,
    onFiltersChange,
    searchResultCount,
    searchLoading,
  });

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
              搜索历史
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
                {h.total}条
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
              🗑 清除历史
            </div>
          )}
        </div>
      )}
      <div className="flex-1 max-h-80 overflow-y-auto py-0.5">
        {fcb.suggestions.length === 0 ? (
          <div className="p-3 text-center">
            {fcb.isLoadingDynamic ? (
              <Loader2 className="size-4 animate-spin mx-auto text-muted-foreground/60" />
            ) : (
              <span className="text-xs text-muted-foreground/80">
                {fcb.parsedToken.phase === 'freeText' && fcb.parsedToken.filterConfig
                  ? fcb.parsedToken.filterConfig.type === 'numberRange'
                    ? '直接输入数值，如: 100 或 100~200'
                    : fcb.parsedToken.filterConfig.type === 'dateRange'
                      ? '格式: 2024-01-01~2024-12-31'
                      : '直接输入文本，按空格结束'
                  : '无匹配筛选项'}
              </span>
            )}
          </div>
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
                      ? '取消排除'
                      : '排除'
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
      </div>
    </div>
  );

  const presetContent: ReactNode = (
    <div className="w-[280px]">
      <div className="p-3 border-b border-border">
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
            placeholder="预设名称"
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
            保存
          </button>
        </div>
      </div>
      {fcb.presets.length === 0 ? (
        <div className="text-xs text-muted-foreground/80 text-center py-3 px-3">
          暂无搜索预设
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
                  {p.searchText || '(空)'}
                </div>
              </div>
              <Share2
                className="size-3 text-muted-foreground/60 shrink-0 cursor-pointer hover:text-foreground transition-colors"
                onClick={(ev: React.MouseEvent) => {
                  ev.stopPropagation();
                  const url = fcb.buildShareUrl(p);
                  navigator.clipboard.writeText(url);
                }}
              />
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

  const showStatusBar = !!statusOptions && statusOptions.length > 0;

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
            {fcb.activeFilterCount}个条件
          </span>
        )}

        <Popover open={fcb.isPresetOpen} onOpenChange={fcb.setPresetOpen}>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
              title="搜索预设"
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
              title="语法帮助"
            >
              <HelpCircle className="size-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-3">
            <div className="text-sm font-medium mb-1.5">搜索语法</div>
            {syntaxHelp}
          </PopoverContent>
        </Popover>

        {rightExtra}
      </div>

      {(showStatusBar || statusBarExtra) && (
        <div className="flex gap-0.5 items-center flex-wrap mt-2">
          {showStatusBar &&
            statusOptions!.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                className={cn(
                  'border-none bg-transparent px-1 py-1 text-xs rounded-sm whitespace-nowrap shrink-0 inline-flex items-center gap-1 cursor-pointer transition-colors',
                  fcb.stat === opt.value
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground/80',
                )}
                onClick={() => fcb.setStat(opt.value as number)}
              >
                {opt.label}
                {statusCounts && statusCounts[opt.value as number] != null && (
                  <span className="text-xs text-muted-foreground/60 tabular-nums">
                    {statusCounts[opt.value as number]}
                  </span>
                )}
              </button>
            ))}
          {statusBarExtra && (
            <div className="ml-auto flex gap-0.5 items-center">
              {statusBarExtra}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
