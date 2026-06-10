import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export type OrgChartTab = 'members' | 'sales' | 'cashflow';

interface OrgChartPopupProps {
  open: boolean;
  initialTab?: OrgChartTab;
  onClose: () => void;
}

const TABS: { key: OrgChartTab; label: string }[] = [
  { key: 'members',  label: '인원현황' },
  { key: 'sales',    label: '수주/매출' },
  { key: 'cashflow', label: '현금흐름' },
];

// ─── 탭별 콘텐츠 — DB 연결 전 mock UI ───────────
const MembersContent: React.FC = () => (
  <div className="orgchart-content-placeholder">
    <p className="orgchart-placeholder-label">인원현황</p>
    <p className="orgchart-placeholder-desc">가족사 지배구조 및 인원 현황 데이터가 여기에 표시됩니다.</p>
    <p className="orgchart-placeholder-desc" style={{ opacity: 0.45 }}>출처: 김우진 수석님 자료</p>
  </div>
);

const SalesContent: React.FC = () => (
  <div className="orgchart-content-placeholder">
    <p className="orgchart-placeholder-label">수주/매출</p>
    <p className="orgchart-placeholder-desc">수주 및 매출 현황 데이터가 여기에 표시됩니다.</p>
  </div>
);

const CashflowContent: React.FC = () => (
  <div className="orgchart-content-placeholder">
    <p className="orgchart-placeholder-label">현금흐름</p>
    <p className="orgchart-placeholder-desc">현금흐름 현황 데이터가 여기에 표시됩니다.</p>
  </div>
);

const TAB_CONTENT: Record<OrgChartTab, React.FC> = {
  members:  MembersContent,
  sales:    SalesContent,
  cashflow: CashflowContent,
};

// ─── 메인 팝업 ───────────────────────────────────
const OrgChartPopup: React.FC<OrgChartPopupProps> = ({ open, initialTab = 'members', onClose }) => {
  const [activeTab, setActiveTab] = useState<OrgChartTab>(initialTab);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!open) return null;

  const Content = TAB_CONTENT[activeTab];

  return (
    <div className="orgchart-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="orgchart-popup" ref={ref}>
        <div className="orgchart-header">
          <div className="orgchart-tabs">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`orgchart-tab ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="orgchart-close" onClick={onClose} title="닫기">
            <X size={16} />
          </button>
        </div>
        <div className="orgchart-body">
          <Content />
        </div>
      </div>
    </div>
  );
};

export default OrgChartPopup;
