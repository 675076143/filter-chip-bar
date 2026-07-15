import { useState, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

interface CalendarRangePanelProps {
  onChange?: (range: { start: Dayjs; end: Dayjs }) => void;
  className?: string;
  style?: React.CSSProperties;
}

const WDAY = ['日', '一', '二', '三', '四', '五', '六'] as const;

export function CalendarRangePanel({ onChange, className, style }: CalendarRangePanelProps) {
  const today = useMemo(() => dayjs().startOf('day'), []);
  const [viewMonth, setViewMonth] = useState(() => today.startOf('month'));
  const [range, setRange] = useState<{ start: Dayjs | null; end: Dayjs | null }>({ start: null, end: null });
  const [hovering, setHovering] = useState<Dayjs | null>(null);

  const nextMonth = viewMonth.add(1, 'month');

  const buildDays = (month: Dayjs) => {
    const start = month.startOf('month').day(); // 0=Sun
    const totalDays = month.daysInMonth();
    const days: (Dayjs | null)[] = [];
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(month.date(i));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const isInRange = (d: Dayjs | null) => {
    if (!d) return false;
    const { start, end } = range;
    if (start && end) return d.isAfter(start, 'day') && d.isBefore(end, 'day');
    if (start && !end && hovering) {
      return (d.isAfter(start, 'day') && d.isBefore(hovering, 'day')) ||
             (d.isAfter(hovering, 'day') && d.isBefore(start, 'day'));
    }
    return false;
  };

  const isStart = (d: Dayjs | null) => d && range.start && d.isSame(range.start, 'day');
  const isEnd = (d: Dayjs | null) => d && range.end && d.isSame(range.end, 'day');

  const handleDayClick = (d: Dayjs) => {
    if (!range.start || (range.start && range.end)) {
      setRange({ start: d, end: null });
    } else {
      const [s, e] = d.isBefore(range.start, 'day')
        ? [d, range.start]
        : [range.start, d];
      setRange({ start: s, end: e });
      onChange?.({ start: s, end: e });
    }
  };

  const cellStyle = (d: Dayjs | null, monthSlot: 0 | 1): React.CSSProperties => {
    if (!d) return { height: 32, pointerEvents: 'none', opacity: 0 };
    const isToday = d.isSame(today, 'day');
    const inRange = isInRange(d);
    const start = isStart(d);
    const end = isEnd(d);
    const base: React.CSSProperties = {
      height: 32,
      width: 32,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: start || end ? 6 : 0,
      cursor: 'pointer',
      fontSize: 13,
      color: d.month() !== viewMonth.month() + monthSlot ? 'rgba(0,0,0,0.15)' : '#333',
      background: start || end ? '#1890ff' : inRange ? '#e6f7ff' : 'transparent',
      transition: 'background 0.15s',
    };
    if (start || end) base.color = '#fff';
    if (isToday && !start && !end) base.fontWeight = 600;
    return base;
  };

  return (
    <div style={{ userSelect: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', ...style }} className={className} onMouseDown={(e) => e.stopPropagation()}>
      {/* header nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
        <button
          type="button"
          onClick={() => setViewMonth(viewMonth.subtract(1, 'month'))}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, padding: '2px 6px', borderRadius: 4, color: '#666' }}
        >‹</button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
          {viewMonth.format('YYYY 年 M 月')}
        </span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
          {nextMonth.format('YYYY 年 M 月')}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(viewMonth.add(1, 'month'))}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, padding: '2px 6px', borderRadius: 4, color: '#666' }}
        >›</button>
      </div>

      {/* two month grids */}
      <div style={{ display: 'flex', gap: 16, padding: '0 8px' }}>
        {[viewMonth, nextMonth].map((month, monthSlot) => (
          <div key={monthSlot} style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, textAlign: 'center' }}>
              {WDAY.map((w) => (
                <div key={w} style={{ fontSize: 11, color: '#999', padding: '4px 0' }}>{w}</div>
              ))}
              {buildDays(month).map((d, i) => (
                <div
                  key={i}
                  style={cellStyle(d, monthSlot as 0 | 1)}
                  onMouseEnter={() => d && !range.end && setHovering(d)}
                  onMouseLeave={() => setHovering(null)}
                  onClick={() => d && handleDayClick(d)}
                >
                  {d?.date()}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '8px 12px', borderTop: '1px solid #f0f0f0', marginTop: 4, fontSize: 13 }}>
        <span style={{ color: '#999' }}>
          {range.start ? range.start.format('M/D') : '?'} → {range.end ? range.end.format('M/D') : range.start ? '选择结束日期' : '选择开始日期'}
        </span>
      </div>
    </div>
  );
}
