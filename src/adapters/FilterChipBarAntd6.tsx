import { type ReactNode, type CSSProperties } from 'react';
import { Button, Dropdown, Input, Spin, Popover, message, theme } from 'antd';
import {
  SearchOutlined,
  CloseCircleFilled,
  StarOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import {
  type ChipConfig,
  type FilterOption,
  type FilterChipBarResult,
  type TextToken,
  type ActionCommand,
} from '../types';
import { truncate } from '../tokenize';
import { useFilterChipBar } from '../hook';

const DEFAULT_PLACEHOLDER = '搜索或输入筛选条件';

const DEFAULT_SYNTAX_HELP: ReactNode = (
  <div style={{ fontSize: 12, lineHeight: 1.8, maxWidth: 280 }}>
    <div>
      <b>key:value</b> — 筛选指定条件
    </div>
    <div>
      <b>-key:value</b> — 排除匹配项（反选）
    </div>
    <div>
      <b>key:"带空格的值"</b> — 引号包裹含空格的值
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

export interface FilterChipBarAntd6Props {
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

export default function FilterChipBarAntd6({
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
}: FilterChipBarAntd6Props) {
  const { token } = theme.useToken();

  const fcb = useFilterChipBar({
    chipConfigs,
    storageNamespace,
    dynamicOptions,
    dynamicOptionsLoading,
    commands,
    initialSearchText,
    initialStat,
    onFiltersChange,
    fontInfo: { fontSize: token.fontSize, fontFamily: token.fontFamily },
    searchResultCount,
    searchLoading,
  });

  const renderTextToken = (t: TextToken, key: number): ReactNode => {
    if (t.type === 'whitespace') return <span key={key}>{t.text}</span>;
    if (t.type === 'freeText') {
      return (
        <span key={key} style={{ color: token.colorText }}>
          {t.truncated ? truncate(t.text) : t.text}
        </span>
      );
    }
    const valueColor = !t.isLabelValid
      ? token.colorWarning
      : !t.isValueValid
        ? token.colorError
        : t.isNegated
          ? token.colorError
          : token.colorPrimary;
    const valueBg = !t.isLabelValid
      ? 'transparent'
      : !t.isValueValid
        ? token.colorErrorBg
        : t.isNegated
          ? token.colorErrorBg
          : token.colorPrimaryBg;
    return (
      <span key={key}>
        {t.isNegated && <span style={{ color: token.colorError, fontWeight: 600 }}>-</span>}
        <span style={{ color: token.colorText }}>{t.label}</span>
        <span style={{ color: token.colorTextSecondary }}>:</span>
        <span style={{ color: valueColor, background: valueBg, borderRadius: 2 }}>
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
        <span style={{ fontWeight: 600, color: token.colorText }}>
          {label.slice(idx, idx + lower.length)}
        </span>
        {label.slice(idx + lower.length)}
      </>
    );
  };

  const dropdownContent: ReactNode = (
    <div
      style={{
        display: 'flex',
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        width: 500,
        maxHeight: 320,
        overflow: 'hidden',
      }}
    >
      {fcb.filteredHistory.length > 0 && (
        <div
          style={{
            width: 200,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            maxHeight: 320,
            overflowY: 'auto',
            padding: `${token.paddingXXS}px 0`,
          }}
        >
          {!fcb.searchText && (
            <div
              style={{
                padding: `${token.paddingXS}px ${token.paddingSM}px ${token.paddingXXS}px`,
                fontSize: 11,
                color: token.colorTextQuaternary,
                fontWeight: 600,
              }}
            >
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
              style={{
                padding: `${token.paddingXS}px ${token.paddingSM}px`,
                cursor: 'pointer',
                fontSize: token.fontSizeSM,
                color: token.colorText,
                display: 'flex',
                alignItems: 'center',
                gap: token.sizeXS,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = token.controlItemBgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ClockCircleOutlined
                style={{ fontSize: 11, color: token.colorTextQuaternary, flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {h.text.length > 20 ? h.text.slice(0, 17) + '...' : h.text}
              </span>
              <span style={{ fontSize: 10, color: token.colorTextQuaternary, flexShrink: 0 }}>
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
              style={{
                padding: `${token.paddingXS}px ${token.paddingSM}px`,
                cursor: 'pointer',
                fontSize: token.fontSizeSM,
                color: token.colorTextTertiary,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = token.controlItemBgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              🗑 清除历史
            </div>
          )}
        </div>
      )}
      <div
        style={{ flex: 1, maxHeight: 320, overflowY: 'auto', padding: `${token.paddingXXS}px 0` }}
      >
        {fcb.suggestions.length === 0 ? (
          <div style={{ padding: `${token.paddingSM}px`, textAlign: 'center' }}>
            {fcb.isLoadingDynamic ? (
              <Spin size="small" />
            ) : (
              <span style={{ color: token.colorTextTertiary, fontSize: token.fontSizeSM }}>
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
                  style={{
                    height: 1,
                    background: token.colorBorderSecondary,
                    margin: `${token.paddingXXS}px ${token.paddingSM}px`,
                  }}
                />
              );
            }
            if (s.isHeader) {
              return (
                <div
                  key={idx}
                  style={{
                    padding: `${token.paddingXS}px ${token.paddingSM}px ${token.paddingXXS}px`,
                    fontSize: 11,
                    color: token.colorTextQuaternary,
                    fontWeight: 600,
                  }}
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
                style={{
                  padding: `${token.paddingXS}px ${token.paddingSM}px`,
                  cursor: 'pointer',
                  fontSize: token.fontSizeSM,
                  color: isToggle
                    ? isNeg
                      ? token.colorSuccess
                      : token.colorError
                    : isCommand
                      ? token.colorPrimary
                      : token.colorText,
                  fontWeight: isToggle || isCommand ? 500 : 400,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: token.sizeXS,
                  transition: 'background 0.1s',
                  background:
                    idx === fcb.activeSuggestionIdx ? token.controlItemBgActive : 'transparent',
                }}
                onMouseEnter={() => fcb.setActiveSuggestionIdx(idx)}
              >
                {isToggle && <span style={{ flexShrink: 0 }}>{isNeg ? '✓' : '⊘'}</span>}
                {isCommand && <span style={{ flexShrink: 0 }}>→</span>}
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {isToggle
                    ? isNeg
                      ? '取消排除'
                      : '排除'
                    : isCommand
                      ? s.label
                      : renderSuggestionLabel(s.label, fcb.parsedToken.prefix)}
                </span>
                {s.hint && (
                  <span style={{ color: token.colorTextQuaternary, fontSize: 11, flexShrink: 0 }}>
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
    <div
      style={{
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        width: 280,
        padding: token.paddingSM,
      }}
    >
      <div style={{ display: 'flex', gap: token.sizeXS, marginBottom: token.marginXS }}>
        <Input
          size="small"
          placeholder="预设名称"
          value={fcb.presetName}
          onChange={(e) => fcb.setPresetName(e.target.value)}
          onPressEnter={fcb.handleSavePreset}
          style={{ flex: 1 }}
        />
        <Button
          size="small"
          type="primary"
          onClick={fcb.handleSavePreset}
          disabled={!fcb.presetName.trim()}
        >
          保存
        </Button>
      </div>
      {fcb.presets.length === 0 ? (
        <div
          style={{
            color: token.colorTextTertiary,
            fontSize: token.fontSizeSM,
            textAlign: 'center',
            padding: `${token.paddingSM}px 0`,
          }}
        >
          暂无搜索预设
        </div>
      ) : (
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {fcb.presets.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: token.sizeXS,
                padding: `${token.paddingXS}px`,
                cursor: 'pointer',
                borderRadius: token.borderRadiusSM,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(ev) => {
                ev.currentTarget.style.background = token.controlItemBgHover;
              }}
              onMouseLeave={(ev) => {
                ev.currentTarget.style.background = 'transparent';
              }}
              onClick={() => fcb.handleLoadPreset(p)}
            >
              <span style={{ fontSize: 12, color: token.colorWarning, flexShrink: 0 }}>★</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: token.fontSizeSM,
                    fontWeight: 500,
                    color: token.colorText,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: token.colorTextQuaternary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.searchText || '(空)'}
                </div>
              </div>
              <ShareAltOutlined
                style={{ fontSize: 12, color: token.colorTextQuaternary, flexShrink: 0 }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  const url = fcb.buildShareUrl(p);
                  navigator.clipboard.writeText(url).then(() => message.success('分享链接已复制'));
                }}
              />
              <DeleteOutlined
                style={{ fontSize: 12, color: token.colorTextQuaternary, flexShrink: 0 }}
                onClick={(ev) => {
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

  const statusLinkStyle = (active: boolean): CSSProperties => ({
    border: 'none',
    background: 'transparent',
    padding: `4px ${token.paddingXS}px`,
    fontSize: token.fontSizeSM,
    fontWeight: active ? 600 : 400,
    color: active ? token.colorText : token.colorTextTertiary,
    cursor: 'pointer',
    borderRadius: token.borderRadiusSM,
    whiteSpace: 'nowrap',
    transition: 'color 0.2s',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  });

  const countStyle: CSSProperties = {
    fontSize: token.fontSizeSM,
    color: token.colorTextQuaternary,
    fontVariantNumeric: 'tabular-nums',
  };

  const showStatusBar = !!statusOptions && statusOptions.length > 0;

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: `${token.paddingSM}px ${token.paddingLG}px`,
        marginBottom: token.marginMD,
      }}
    >
      <div style={{ display: 'flex', gap: token.sizeSM, alignItems: 'center' }}>
        <Dropdown
          trigger={[]}
          open={fcb.isDropdownOpen}
          onOpenChange={(open) => {
            fcb.setDropdownOpen(open);
            if (!open) fcb.setActiveSuggestionIdx(-1);
          }}
          dropdownRender={() => dropdownContent}
          align={{ offset: [fcb.dropdownOffsetX, 4] }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              height: 32,
              padding: `0 ${token.paddingSM}px`,
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
              fontSize: token.fontSize,
              fontFamily: token.fontFamily,
              position: 'relative',
              cursor: 'text',
              transition: 'border-color 0.2s',
              overflow: 'hidden',
            }}
            onClick={() => fcb.inputRef.current?.focus()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = token.colorPrimaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = token.colorBorder;
            }}
          >
            <SearchOutlined
              style={{ color: token.colorTextTertiary, marginRight: token.sizeXS, flexShrink: 0 }}
            />
            <div
              style={{
                position: 'relative',
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  fontSize: token.fontSize,
                  fontFamily: token.fontFamily,
                }}
              >
                <div
                  style={{ transform: `translateX(${-fcb.inputScrollLeft}px)`, whiteSpace: 'pre' }}
                >
                  {fcb.searchText ? (
                    fcb.textTokens.map(renderTextToken)
                  ) : (
                    <span style={{ color: token.colorTextQuaternary }}>{placeholder}</span>
                  )}
                </div>
              </div>
              <input
                ref={fcb.inputRef}
                type="text"
                value={fcb.searchText}
                onChange={fcb.handleInputChange}
                onPaste={fcb.handlePaste}
                onFocus={() => fcb.setDropdownOpen(true)}
                onBlur={() => setTimeout(() => fcb.setDropdownOpen(false), 150)}
                onKeyDown={fcb.handleKeyDown}
                onScroll={(e) => fcb.onInputScroll(e.currentTarget.scrollLeft)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: token.fontSize,
                  fontFamily: token.fontFamily,
                  color: 'transparent',
                  caretColor: token.colorText,
                  padding: 0,
                  margin: 0,
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </div>
            {fcb.searchText && (
              <CloseCircleFilled
                onMouseDown={(e) => {
                  e.preventDefault();
                  fcb.handleClear();
                }}
                style={{
                  color: token.colorTextQuaternary,
                  cursor: 'pointer',
                  marginLeft: token.sizeXS,
                  flexShrink: 0,
                }}
              />
            )}
            {onImageSearch && (
              <CameraOutlined
                style={{
                  color: token.colorPrimary,
                  cursor: 'pointer',
                  marginLeft: token.sizeXS,
                  flexShrink: 0,
                  fontSize: 16,
                }}
                onClick={onImageSearch}
              />
            )}
          </div>
        </Dropdown>

        {fcb.activeFilterCount > 0 && (
          <span
            style={{
              fontSize: token.fontSizeSM,
              color: token.colorTextTertiary,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {fcb.activeFilterCount}个条件
          </span>
        )}

        <Dropdown
          trigger={['click']}
          open={fcb.isPresetOpen}
          onOpenChange={fcb.setPresetOpen}
          dropdownRender={() => presetContent}
          placement="bottomRight"
        >
          <Button icon={<StarOutlined />} title="搜索预设" />
        </Dropdown>

        <Popover content={syntaxHelp} title="搜索语法" placement="bottomRight">
          <Button icon={<QuestionCircleOutlined />} type="text" size="small" title="语法帮助" />
        </Popover>

        {rightExtra}
      </div>

      {(showStatusBar || statusBarExtra) && (
        <div
          style={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: token.marginSM,
          }}
        >
          {showStatusBar &&
            statusOptions!.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                style={statusLinkStyle(fcb.stat === opt.value)}
                onClick={() => fcb.setStat(opt.value as number)}
              >
                {opt.label}
                {statusCounts && statusCounts[opt.value as number] != null && (
                  <span style={countStyle}>{statusCounts[opt.value as number]}</span>
                )}
              </button>
            ))}
          {statusBarExtra && (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                gap: token.sizeXS,
                alignItems: 'center',
              }}
            >
              {statusBarExtra}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
