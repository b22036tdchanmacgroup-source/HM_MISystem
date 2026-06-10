import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(d: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const t = d.getTime();
  return t > start.getTime() && t < end.getTime();
}

function fmt(d: Date | null): string {
  if (!d) return '—';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}


function parseInputDate(s: string): Date | null {
  const clean = s.replace(/[.\-\/\s]/g, '');
  if (clean.length !== 8) return null;
  const y = parseInt(clean.slice(0, 4));
  const m = parseInt(clean.slice(4, 6));
  const d = parseInt(clean.slice(6, 8));
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return null;
  return date;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [startDate, setStartDate] = useState<Date | null>(parseDate(value?.from ?? ''));
  const [endDate, setEndDate] = useState<Date | null>(parseDate(value?.to ?? ''));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [inputFrom, setInputFrom] = useState(startDate ? fmt(startDate) : '');
  const [inputTo, setInputTo] = useState(endDate ? fmt(endDate) : '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 외부 value 변경 시 내부 상태 동기화
  useEffect(() => {
    const s = parseDate(value?.from ?? '');
    const e = parseDate(value?.to ?? '');
    setStartDate(s);
    setEndDate(e);
    setInputFrom(s ? fmt(s) : '');
    setInputTo(e ? fmt(e) : '');
  }, [value]);

  // 캘린더 클릭 시 input 동기화
  useEffect(() => { setInputFrom(startDate ? fmt(startDate) : ''); }, [startDate]);
  useEffect(() => { setInputTo(endDate ? fmt(endDate) : ''); }, [endDate]);

  const handleFromBlur = () => {
    const parsed = parseInputDate(inputFrom);
    if (parsed) {
      setStartDate(parsed);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    } else {
      setInputFrom(startDate ? fmt(startDate) : '');
    }
  };

  const handleToBlur = () => {
    const parsed = parseInputDate(inputTo);
    if (parsed) {
      setEndDate(parsed);
    } else {
      setInputTo(endDate ? fmt(endDate) : '');
    }
  };

  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(viewYear, viewMonth, d));
    return arr;
  }, [viewYear, viewMonth]);

  const handleDayClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (date.getTime() < startDate.getTime()) {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const moveMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const previewEnd =
    startDate && !endDate && hoverDate && hoverDate.getTime() > startDate.getTime()
      ? hoverDate
      : null;

  const handleApply = () => {
    if (startDate && endDate) {
      onChange({ from: toDateString(startDate), to: toDateString(endDate) });
    } else if (startDate) {
      onChange({ from: toDateString(startDate), to: toDateString(startDate) });
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setStartDate(parseDate(value?.from ?? ''));
    setEndDate(parseDate(value?.to ?? ''));
    setHoverDate(null);
    setOpen(false);
  };

  const isActive = !!value;

  return (
    <div className="date-range-picker-wrap" ref={ref}>
      <button
        className={`header-action-btn-new date-filter-btn ${isActive ? 'active' : ''}`}
        onClick={() => setOpen(v => !v)}
        title={isActive ? `${value!.from} ~ ${value!.to}` : '날짜 필터'}
      >
        <CalendarDays size={16} />
      </button>

      {open && (
        <div className="date-range-popup">
          {/* 선택 결과 요약 */}
          <div className="drc-summary">
            <div className="drc-summary-item">
              <label className="drc-summary-label" htmlFor="drc-input-from">시작일</label>
              <input
                id="drc-input-from"
                className={`drc-date-input${startDate ? ' active' : ''}`}
                value={inputFrom}
                onChange={e => setInputFrom(e.target.value)}
                onBlur={handleFromBlur}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="YYYY.MM.DD"
                maxLength={10}
                aria-label="시작일 입력"
              />
            </div>
            <span className="drc-arrow">→</span>
            <div className="drc-summary-item">
              <label className="drc-summary-label" htmlFor="drc-input-to">종료일</label>
              <input
                id="drc-input-to"
                className={`drc-date-input${endDate ? ' active' : ''}`}
                value={inputTo}
                onChange={e => setInputTo(e.target.value)}
                onBlur={handleToBlur}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="YYYY.MM.DD"
                maxLength={10}
                aria-label="종료일 입력"
              />
            </div>
          </div>

          {/* 월 네비게이션 */}
          <div className="drc-nav">
            <button className="drc-navbtn" onClick={() => moveMonth(-1)} aria-label="이전 달">‹</button>
            <span className="drc-month-title">{viewYear}년 {viewMonth + 1}월</span>
            <button className="drc-navbtn" onClick={() => moveMonth(1)} aria-label="다음 달">›</button>
          </div>

          {/* 요일 헤더 */}
          <div className="drc-grid">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`drc-weekday${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>{w}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="drc-grid" onMouseLeave={() => setHoverDate(null)}>
            {cells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;

              const isStart = isSameDay(date, startDate);
              const isEnd = isSameDay(date, endDate) || (!!previewEnd && isSameDay(date, previewEnd));
              const inRange =
                isBetween(date, startDate, endDate) ||
                isBetween(date, startDate, previewEnd);
              const isPreview = !endDate && (inRange || (!!previewEnd && isEnd));
              const isToday = isSameDay(date, today);
              const isConfirmedEnd = isEnd && !!endDate;
              const dow = date.getDay();

              const hasRangeBg = inRange || ((isStart || isEnd) && (!!endDate || !!previewEnd));
              const borderRadius =
                isStart && isConfirmedEnd ? '50%' :
                isStart ? '50% 0 0 50%' :
                isConfirmedEnd ? '0 50% 50% 0' : '0';

              const cellKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const dayClass = [
                'drc-day',
                isStart || isConfirmedEnd ? 'drc-selected' : '',
                isEnd && isPreview && !isStart ? 'drc-preview-end' : '',
              ].filter(Boolean).join(' ');

              const dayColor =
                isStart || isConfirmedEnd ? '#fff' :
                dow === 0 ? 'rgba(255,107,107,0.9)' :
                dow === 6 ? 'rgba(126,179,212,0.9)' :
                undefined;

              return (
                <div key={cellKey} className="drc-cell-wrap">
                  {hasRangeBg && startDate && (
                    <div
                      className="drc-range-bg"
                      style={{
                        borderRadius,
                        opacity: isPreview ? 0.45 : 1,
                      }}
                    />
                  )}
                  <button
                    className={dayClass}
                    onClick={() => handleDayClick(date)}
                    onMouseEnter={() => setHoverDate(date)}
                    style={{
                      fontWeight: isToday || isStart || isEnd ? 700 : 400,
                      color: dayColor,
                    }}
                    aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
                  >
                    {date.getDate()}
                    {isToday && !isStart && !isConfirmedEnd && <span className="drc-today-dot" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 안내 텍스트 + 버튼 */}
          <div className="drc-footer">
            <span className="drc-hint">
              {!startDate ? '시작일을 선택하세요' : !endDate ? '종료일을 선택하세요' : '범위가 선택되었습니다'}
            </span>
          </div>
          <div className="date-range-actions">
            <button className="date-range-btn cancel" onClick={handleCancel}>취소</button>
            <button className="date-range-btn apply" onClick={handleApply} disabled={!startDate}>
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
