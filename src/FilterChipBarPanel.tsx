import { type FilterChipBarVM } from 'filter-chip-bar/headless';

const C = {
  colorText: 'rgba(0,0,0,0.85)',
  colorTextSecondary: 'rgba(0,0,0,0.45)',
  colorTextQuaternary: 'rgba(0,0,0,0.15)',
  colorBgElevated: '#ffffff',
  colorBorderSecondary: '#f0f0f0',
};

interface Props {
  vm: FilterChipBarVM;
  onDatePicker?: (prefix: string) => void;
}

const tips = [
  'key:value 筛选字段',
  '-key:value 排除匹配',
  'key:>=100 数值比较',
  'key:100~200 区间',
  '空格→下一条件 回车→搜索',
];

export default function FilterChipBarPanel({ vm, onDatePicker }: Props) {
  const { dropdown } = vm;

  const row = {
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    transition: 'background 0.1s',
  } as const;

  return (
    <div
      style={{
        background: C.colorBgElevated,
        borderRadius: 8,
        boxShadow: '0 3px 6px -4px rgba(0,0,0,0.12)',
        maxHeight: 420,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {dropdown.suggestions.length === 0 ? (
          <div style={{ padding: 12, fontSize: 13, color: C.colorTextSecondary }}>
            {dropdown.isLoading ? '加载中...' : dropdown.hint}
          </div>
        ) : (
          dropdown.suggestions.map((s) => {
            if (s.type === 'divider') {
              return (
                <div
                  key={s.key}
                  style={{ height: 1, background: C.colorBorderSecondary, margin: '4px 12px' }}
                />
              );
            }
            if (s.type === 'header') {
              return (
                <div
                  key={s.key}
                  style={{
                    padding: '6px 12px 2px',
                    fontSize: 11,
                    color: C.colorTextQuaternary,
                    fontWeight: 600,
                  }}
                >
                  {s.label}
                </div>
              );
            }
            return (
              <div
                key={s.key}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (s.type === 'datepicker') onDatePicker?.(s.key);
                  else s.onSelect();
                }}
                style={{
                  ...row,
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: C.colorText,
                  background: s.active ? '#e6f7ff' : 'transparent',
                }}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </span>
                {s.hint && (
                  <span style={{ fontSize: 11, color: C.colorTextQuaternary, flexShrink: 0 }}>
                    {s.hint}
                  </span>
                )}
              </div>
            );
          })
        )}
        {dropdown.footer && (
          <div
            style={{
              padding: '6px 12px',
              fontSize: 12,
              color: C.colorTextSecondary,
              fontWeight: 500,
              borderTop: `1px solid ${C.colorBorderSecondary}`,
              margin: '4px 12px 0',
            }}
          >
            {dropdown.footer}
          </div>
        )}

        <div style={{ height: 1, background: C.colorBorderSecondary, margin: '8px 12px' }} />
        <div
          style={{ padding: '4px 12px', fontSize: 11, color: C.colorTextQuaternary, lineHeight: 2 }}
        >
          {tips.map((t, i) => (
            <div key={i}>{t}</div>
          ))}
        </div>
      </div>

      {dropdown.history.length > 0 && (
        <>
          <div style={{ height: 1, background: C.colorBorderSecondary, margin: '0 12px' }} />
          <div style={{ padding: '4px 0', maxHeight: 150, overflowY: 'auto' }}>
            <div
              style={{
                padding: '6px 12px 2px',
                fontSize: 11,
                color: C.colorTextQuaternary,
                fontWeight: 600,
              }}
            >
              搜索历史
            </div>
            {dropdown.history.map((h) => (
              <div
                key={h.key}
                onMouseDown={(e) => {
                  e.preventDefault();
                  h.onSelect();
                }}
                style={{ ...row, color: C.colorText, cursor: 'pointer', position: 'relative' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 11, color: C.colorTextQuaternary, flexShrink: 0 }}>
                  🕐
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h.text}
                </span>
                <span style={{ fontSize: 10, color: C.colorTextQuaternary, flexShrink: 0 }}>
                  {h.count}条
                </span>
                <span
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    h.onRemove();
                  }}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 14,
                    lineHeight: 1,
                    color: C.colorTextQuaternary,
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).style.opacity = '1';
                    (e.currentTarget as HTMLElement).style.color = '#ff4d4f';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = '0';
                    (e.currentTarget as HTMLElement).style.color = C.colorTextQuaternary;
                  }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
