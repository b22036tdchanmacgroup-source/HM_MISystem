import React from 'react';
import { Monitor, RotateCcw } from 'lucide-react';
import DateRangePicker, { type DateRange } from './DateRangePicker';

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
export interface Stats {
  total: number;
  ongoing: number;
  hold: number;
  completed: number;
  issue: number;
}

export interface AppHeaderProps {
  showTeamView: boolean;
  setShowTeamView: React.Dispatch<React.SetStateAction<boolean>>;
  stats: Stats;
  filters: string[];
  setFilters: React.Dispatch<React.SetStateAction<string[]>>;
  activeSummaryFilter: string | null;
  setActiveSummaryFilter: React.Dispatch<React.SetStateAction<string | null>>;
  toggleIssueFilter: () => void;
  onQuickStatClick: (tab: 'members' | 'sales' | 'cashflow') => void;
  isDualMode: boolean;
  onDualModeToggle: () => void;
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
}

export type { DateRange };

// ─────────────────────────────────────────────
// 스탯 바 항목 정의 — 항목 추가/수정은 여기서만
// ─────────────────────────────────────────────
const STAT_ITEMS = [
  { filterKey: '진행', label: '인원현황',  color: '#10b981', getValue: (s: Stats) => s.ongoing   },
  { filterKey: '보류', label: '수주/매출', color: '#ff9f0a', getValue: (s: Stats) => s.hold      },
  { filterKey: '완료', label: '현금흐름',  color: '#b0b0b0', getValue: (s: Stats) => s.completed },
] as const;


// ─────────────────────────────────────────────
// 서브 컴포넌트: 좌측 — 타이틀
// ─────────────────────────────────────────────
const HeaderTitle: React.FC = () => (
  <div className="side-left-group">
    <div className="side-title-container">
      <div className="side-title-wrap">
        {/* 타이틀 문구 수정 시 아래 span 내용만 변경 */}
        <span className="side-title-main main_tit">한맥가족 MIS</span>
        <span className="side-title-sub" style={{ display: 'none' }}>
          Management Information System
        </span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 서브 컴포넌트: 중앙 — 스탯 바
// ─────────────────────────────────────────────

const HeaderStats: React.FC<{
  showTeamView: boolean;
  setShowTeamView: React.Dispatch<React.SetStateAction<boolean>>;
  activeSummaryFilter: string | null;
  setActiveSummaryFilter: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ showTeamView, setShowTeamView, activeSummaryFilter, setActiveSummaryFilter }) => (
  <div className="side-polygon-stats">
    <div className="poly-stat-item" style={{ fontSize: '18px', gap: '8px' }}>
      <span
        onClick={() => {
          setShowTeamView(true);
          setActiveSummaryFilter(null);
        }}
        className={`poly-click-stat ${showTeamView ? 'active' : ''}`}
        style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
      >
        지배구조
      </span>
      {STAT_ITEMS.map((item) => (
        <React.Fragment key={item.filterKey}>
          <span
            onClick={() => {
              setActiveSummaryFilter(item.filterKey);
              setShowTeamView(false);
            }}
            className={`poly-click-stat ${!showTeamView && activeSummaryFilter === item.filterKey ? 'active' : ''}`}
            style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}

    </div>
  </div>
);

// ─────────────────────────────────────────────
// 서브 컴포넌트: 우측 — 필터 배지 + 액션 버튼
// ─────────────────────────────────────────────
const DualMonitorIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div className="dual-monitor-icon-wrap" style={{ width: size, height: size }}>
    <Monitor size={size * 0.75} className="m-icon m-back" />
    <Monitor size={size * 0.75} className="m-icon m-front" />
  </div>
);

const HeaderActions: React.FC<{
  isDualMode: boolean;
  onDualModeToggle: () => void;
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
}> = ({ isDualMode, onDualModeToggle, dateRange, onDateRangeChange }) => (
  <div className="side-right-actions">
    {dateRange && (
      <span className="header-date-range-text">
        {dateRange.from} ~ {dateRange.to}
        <span className="date-filter-clear" onClick={() => onDateRangeChange(null)} title="날짜 필터 초기화">
          <RotateCcw size={10} />
        </span>
      </span>
    )}
    <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    <button
      className={`header-view-btn-new ${isDualMode ? 'active' : ''}`}
      title="듀얼모드"
      onClick={onDualModeToggle}
    >
      <DualMonitorIcon size={16} />
    </button>
  </div>
);

// ─────────────────────────────────────────────
// 메인 헤더 — 서브 컴포넌트 조합
// ─────────────────────────────────────────────
const AppHeader: React.FC<AppHeaderProps> = ({
  showTeamView,
  setShowTeamView,
  stats: _stats,
  filters: _filters,
  setFilters: _setFilters,
  activeSummaryFilter,
  setActiveSummaryFilter,
  toggleIssueFilter: _toggleIssueFilter,
  onQuickStatClick: _onQuickStatClick,
  isDualMode,
  onDualModeToggle,
  dateRange,
  onDateRangeChange,
}) => (
  <aside className="side">
    <HeaderTitle />
    <HeaderStats
      showTeamView={showTeamView}
      setShowTeamView={setShowTeamView}
      activeSummaryFilter={activeSummaryFilter}
      setActiveSummaryFilter={setActiveSummaryFilter}
    />
    <HeaderActions
      isDualMode={isDualMode}
      onDualModeToggle={onDualModeToggle}
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
    />
  </aside>
);

export default AppHeader;
