import React, { useState } from 'react';
import { BarChart2, Target } from 'lucide-react';

interface CompanyData {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  employees: number;
  orders: { target: number; actual: number };
  sales: { target: number; actual: number };
  prevOrders: number;
  prevSales: number;
  color: string;
}

const B = import.meta.env.BASE_URL;

const COMPANIES_DATA: CompanyData[] = [
  { id: 'hanmaek', name: '한맥기술', domain: 'ENG. Business',              logo: `${B}images/logo/Hanmac.svg`,    employees: 393, orders: { target: 800, actual: 620 }, sales: { target: 700, actual: 510 }, prevOrders: 580, prevSales: 470, color: '#1a5e35' },
  { id: 'saman',   name: '삼안',     domain: 'ENG. Business',              logo: `${B}images/logo/Saman.svg`,     employees: 1976, orders: { target: 700, actual: 520 }, sales: { target: 600, actual: 430 }, prevOrders: 490, prevSales: 400, color: '#0f766e' },
  { id: 'jhind',   name: '장헌산업', domain: 'Manufacture & Construction', logo: `${B}images/logo/Jangheon.svg`,  employees: 35,  orders: { target: 400, actual: 280 }, sales: { target: 350, actual: 240 }, prevOrders: 260, prevSales: 210, color: '#b45309' },
  { id: 'jh',      name: '장헌',     domain: 'Manufacture & Construction', logo: `${B}images/logo/jangheon_1.svg`,employees: 20,  orders: { target: 200, actual: 160 }, sales: { target: 180, actual: 135 }, prevOrders: 145, prevSales: 120, color: '#a16207' },
  { id: 'ptc',     name: '피티씨',   domain: 'Manufacture & Construction', logo: `${B}images/logo/PTC.svg`,       employees: 26,  orders: { target: 150, actual: 110 }, sales: { target: 140, actual: 105 }, prevOrders: 95,  prevSales: 88,  color: '#9a3412' },
  { id: 'halla',   name: '한라',     domain: 'Environment EPC & Plant',    logo: `${B}images/logo/Halla.svg`,     employees: 222,  orders: { target: 150, actual: 95  }, sales: { target: 130, actual: 85  }, prevOrders: 80,  prevSales: 72,  color: '#065f46' },
  { id: 'baron',   name: '바론',     domain: 'IT Business',                logo: `${B}images/logo/Baron.svg`,     employees: 182,  orders: { target: 100, actual: 65  }, sales: { target: 100, actual: 75  }, prevOrders: 55,  prevSales: 62,  color: '#1d4ed8' },
];

const GROUP = {
  orders:    { target: COMPANIES_DATA.reduce((s, c) => s + c.orders.target, 0), actual: COMPANIES_DATA.reduce((s, c) => s + c.orders.actual, 0) },
  sales:     { target: COMPANIES_DATA.reduce((s, c) => s + c.sales.target,  0), actual: COMPANIES_DATA.reduce((s, c) => s + c.sales.actual,  0) },
  employees: COMPANIES_DATA.reduce((s, c) => s + c.employees, 0),
};

const DOMAINS = [
  { name: 'ENG. Business',              companies: COMPANIES_DATA.filter(c => c.domain === 'ENG. Business') },
  { name: 'Manufacture & Construction', companies: COMPANIES_DATA.filter(c => c.domain === 'Manufacture & Construction') },
  { name: 'Environment EPC & Plant',    companies: COMPANIES_DATA.filter(c => c.domain === 'Environment EPC & Plant') },
  { name: 'IT Business',                companies: COMPANIES_DATA.filter(c => c.domain === 'IT Business') },
];

const GROUP_FIN = {
  operatingProfit: 182, operatingMargin: 9.2, operatingYoY: 12.3,
  netIncome: 143,       netMargin: 7.2,       netYoY: 8.7,
  domesticProjects: 89, overseasProjects: 23,
  overseasOffices: 7,   overseasCountries: 4,
};

const INDUSTRY_NEWS = [
  { company: '한맥기술', title: '스마트시티 교통인프라 기본설계 수주',    date: '05.28', type: 'info' as const },
  { company: '삼안',     title: '제3연육교 기본·실시설계 용역 수주',      date: '05.22', type: 'info' as const },
  { company: '장헌산업', title: '동남아 3개국 친환경자재 수출 MOU 체결', date: '05.15', type: 'warn' as const },
  { company: '한라',     title: '하수처리 현대화 설계·시공 통합 입찰',    date: '05.10', type: 'ok'   as const },
  { company: '바론',     title: 'AI 기반 MES 공급 계약 체결',            date: '05.08', type: 'info' as const },
  { company: '피티씨',   title: '플랜트 특수부품 납품 물량 확대 계약',    date: '04.30', type: 'warn' as const },
];

// ── 도넛 차트 ──────────────────────────────────────────────────
interface DonutSlice { label: string; value: number; color: string; actualValue: number }

const DonutChart: React.FC<{ title: string; slices: DonutSlice[]; totalLabel: string; totalValue: string }> =
  ({ title, slices, totalLabel, totalValue }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const radius = 40;
    const circ = 2 * Math.PI * radius;
    let acc = 0;
    return (
      <div className="osd-donut-card">
        <div className="osd-card-title">{title}</div>
        <div className="osd-donut-body">
          <div className="osd-donut-svg-wrap" style={{ position: 'relative' }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#ede8e0" strokeWidth="16" />
              {slices.map((s, i) => {
                const pct = s.value / 100;
                const len = pct * circ;
                const offset = acc;
                acc += pct;
                return (
                  <circle key={i} cx="50" cy="50" r={radius} fill="none"
                    stroke={s.color}
                    strokeWidth={hovered === i ? 20 : 16}
                    strokeDasharray={`${len} ${circ}`}
                    strokeDashoffset={-offset * circ}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-width 0.15s', cursor: 'pointer' }}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
              <circle cx="50" cy="50" r={30} fill="#fff" />
              <text x="50" y="43" textAnchor="middle" fontSize="7.5" fill="#8e8780" fontWeight="700">{totalLabel}</text>
              <text x="50" y="58" textAnchor="middle" fontSize="12"  fill="#1e1b18" fontWeight="850">{totalValue}</text>
            </svg>
          </div>
          <div className="osd-donut-legend">
            {slices.map((s, i) => (
              <div key={i} className={`osd-legend-row${hovered === i ? ' hov' : ''}`}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                <span className="osd-legend-dot" style={{ background: s.color }} />
                <span className="osd-legend-name">{s.label}</span>
                <span className="osd-legend-pct">{s.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

// ── KPI 요약 패널 (수주 / 매출) ────────────────────────────────
const KpiPanel: React.FC<{ type: 'orders' | 'sales'; target: number; actual: number }> =
  ({ type, target, actual }) => {
    const rate = Math.round((actual / target) * 100);
    const isOrders = type === 'orders';
    const accentColor = isOrders ? '#1a5e35' : '#92400e';
    const label = isOrders ? '수주' : '매출';
    const icon = isOrders ? <BarChart2 size={16} /> : <Target size={16} />;
    return (
      <div className="osd-kpi-panel">
        <div className="osd-kpi-header">
          <span className="osd-kpi-icon" style={{ color: accentColor }}>{icon}</span>
          <span className="osd-kpi-title" style={{ color: accentColor }}>{label}</span>
        </div>
        <div className="osd-kpi-table" style={{ '--kpi-accent': accentColor } as React.CSSProperties}>
          <div className="osd-kpi-col">
            <span className="osd-kpi-col-label">목표</span>
            <span className="osd-kpi-col-num">{target.toLocaleString()}</span>
          </div>
          <div className="osd-kpi-col">
            <span className="osd-kpi-col-label">실적</span>
            <span className="osd-kpi-col-num osd-kpi-actual" style={{ color: accentColor }}>{actual.toLocaleString()}</span>
          </div>
          <div className="osd-kpi-col">
            <span className="osd-kpi-col-label">달성률</span>
            <span className="osd-kpi-col-rate" style={{ color: accentColor }}>{rate}%</span>
          </div>
        </div>
        <div className="osd-kpi-bar-wrap">
          <div className="osd-kpi-bar-track">
            <div className="osd-kpi-bar-fill" style={{ width: `${Math.min(rate, 100)}%`, background: `linear-gradient(90deg, ${accentColor}55 0%, ${accentColor} 100%)` }} />
            <div className="osd-kpi-bar-target" />
          </div>
          <div className="osd-kpi-bar-labels">
            <span style={{ color: accentColor, fontSize: '18px', fontWeight: 700 }}>{actual.toLocaleString()}</span>
            <span style={{ fontSize: '16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>목표 {target.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export const OrdersSalesDashboard: React.FC = () => {
  const [insightTab, setInsightTab] = useState<'insight' | 'industry'>('insight');

  const orderSlices: DonutSlice[] = [...COMPANIES_DATA]
    .sort((a, b) => b.orders.actual - a.orders.actual)
    .map(c => ({ label: c.name, actualValue: c.orders.actual, value: (c.orders.actual / GROUP.orders.actual) * 100, color: c.color }));

  const salesSlices: DonutSlice[] = [...COMPANIES_DATA]
    .sort((a, b) => b.sales.actual - a.sales.actual)
    .map(c => ({ label: c.name, actualValue: c.sales.actual, value: (c.sales.actual / GROUP.sales.actual) * 100, color: c.color }));

  const groupPerOrder = GROUP.orders.actual / GROUP.employees;
  const groupPerSales = GROUP.sales.actual / GROUP.employees;

  return (
    <div className="osd-page">

      {/* ── 1행: 신규 KPI 탑 요약 ── */}
      <div className="osd-row-kpi-top">
        {/* Card 1: 수주잔고 */}
        <div className="osd-top-kpi-card card-backlog">
          <div className="osd-top-kpi-circle orange">
            {/* 수주잔고: 크레인/건설현장 아이콘 */}
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
              <rect x="20" y="28" width="6" height="16" rx="2" fill="#92400e" opacity="0.9"/>
              <rect x="14" y="25" width="18" height="5" rx="2" fill="#92400e"/>
              <rect x="6" y="10" width="4" height="34" rx="2" fill="#b45309"/>
              <rect x="6" y="10" width="28" height="4" rx="2" fill="#b45309"/>
              <line x1="34" y1="12" x2="23" y2="25" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="34" cy="10" r="4" fill="#d97706"/>
              <rect x="4" y="42" width="40" height="4" rx="2" fill="#78350f"/>
              <rect x="10" y="30" width="4" height="12" rx="1" fill="#92400e" opacity="0.5"/>
              <rect x="32" y="30" width="4" height="12" rx="1" fill="#92400e" opacity="0.5"/>
            </svg>
          </div>
          <div className="osd-top-kpi-right">
            <span className="osd-top-kpi-label-new">수주잔고</span>
            <div className="osd-top-kpi-main-new">
              <span className="num orange">{(2300 + GROUP.orders.actual - GROUP.sales.actual).toLocaleString()}</span>
              <span className="unit">억</span>
              <span className="sub-val-new up">▲ 4.8%</span>
            </div>
          </div>
        </div>

        {/* Card 2: 인당 생산성 */}
        <div className="osd-top-kpi-card card-productivity">
          <div className="osd-top-kpi-circle green">
            {/* 인당생산성: 인력/팀 헬멧 아이콘 */}
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
              <circle cx="24" cy="13" r="7" fill="#1a5e35" opacity="0.85"/>
              <path d="M10 38c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1a5e35" strokeWidth="3" strokeLinecap="round" fill="none"/>
              {/* 헬멧 */}
              <path d="M15 15 Q15 8 24 8 Q33 8 33 15" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="rgba(34,197,94,0.12)"/>
              <rect x="13" y="15" width="22" height="3" rx="1.5" fill="#22c55e" opacity="0.7"/>
              {/* 인원수 배지 */}
              <circle cx="36" cy="10" r="7" fill="#14532d"/>
              <text x="36" y="14" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">{GROUP.employees}</text>
            </svg>
          </div>
          <div className="osd-top-kpi-right">
            <span className="osd-top-kpi-label-new">인당 생산성 <span className="sub-desc-new">({GROUP.employees}명 기준)</span></span>
            <div className="osd-top-kpi-split-new">
              <div className="split-item-new">
                <span className="split-lbl orders">수주</span>
                <span className="split-val orders">{groupPerOrder.toFixed(2)}억</span>
              </div>
              <div className="split-div-new" />
              <div className="split-item-new">
                <span className="split-lbl sales">매출</span>
                <span className="split-val sales">{groupPerSales.toFixed(2)}억</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: 연말 수주/매출 달성률(예상) */}
        <div className="osd-top-kpi-card card-achievement">
          <div className="osd-top-kpi-circle blue">
            {/* 달성률: 계기판/게이지 아이콘 */}
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
              <path d="M8 30 A16 16 0 0 1 40 30" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" fill="none"/>
              <path d="M8 30 A16 16 0 0 1 37.5 21" stroke="#1565c0" strokeWidth="5" strokeLinecap="round" fill="none"/>
              <circle cx="24" cy="30" r="3" fill="#1565c0"/>
              <line x1="24" y1="30" x2="30" y2="18" stroke="#1565c0" strokeWidth="2" strokeLinecap="round"/>
              <text x="24" y="42" textAnchor="middle" fontSize="8" fill="#1565c0" fontWeight="bold">98%</text>
              <circle cx="12" cy="30" r="2" fill="#93c5fd"/>
              <circle cx="36" cy="30" r="2" fill="#93c5fd"/>
              <circle cx="9" cy="22" r="2" fill="#bfdbfe"/>
              <circle cx="39" cy="22" r="2" fill="#bfdbfe"/>
            </svg>
          </div>
          <div className="osd-top-kpi-right">
            <span className="osd-top-kpi-label-new">연말 수주/매출 달성률(예상)</span>
            <div className="osd-top-kpi-split-new">
              <div className="split-item-new">
                <span className="split-lbl orders">수주</span>
                <span className="split-val rate orders">98.2%</span>
              </div>
              <div className="split-div-new" />
              <div className="split-item-new">
                <span className="split-lbl sales">매출</span>
                <span className="split-val rate sales">96.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: 가족사 신규 수주 */}
        <div className="osd-top-kpi-card card-neworders">
          <div className="osd-top-kpi-circle green">
            {/* 신규수주: 계약서/핸드셰이크 아이콘 */}
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34">
              {/* 계약서 */}
              <rect x="10" y="6" width="22" height="28" rx="3" fill="#dcfce7" stroke="#1a5e35" strokeWidth="1.5"/>
              <line x1="15" y1="14" x2="27" y2="14" stroke="#1a5e35" strokeWidth="2" strokeLinecap="round"/>
              <line x1="15" y1="19" x2="27" y2="19" stroke="#1a5e35" strokeWidth="2" strokeLinecap="round"/>
              <line x1="15" y1="24" x2="22" y2="24" stroke="#1a5e35" strokeWidth="2" strokeLinecap="round"/>
              {/* 도장/체크 */}
              <circle cx="34" cy="34" r="10" fill="#14532d"/>
              <path d="M29 34 L32 37 L39 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <div className="osd-top-kpi-right">
            <span className="osd-top-kpi-label-new">가족사 신규 수주</span>
            <div className="osd-top-kpi-main-new">
              <span className="num green">{GROUP.orders.actual.toLocaleString()}</span>
              <span className="unit">억</span>
              <span className="sub-val-new rate green">{Math.round((GROUP.orders.actual / GROUP.orders.target) * 100)}% 달성</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2행: 총괄 요약 ── */}
      <div className="osd-row-summary">
        <DonutChart title="가족사 수주 기여도" slices={orderSlices} totalLabel="실적 합계" totalValue={`${GROUP.orders.actual.toLocaleString()}억`} />
        <div className="osd-summary-center">
          <KpiPanel type="orders" target={GROUP.orders.target} actual={GROUP.orders.actual} />
          <div className="osd-tvsa-badge"><span className="osd-tvsa-text">Target<br />vs.<br />Actual</span></div>
          <KpiPanel type="sales" target={GROUP.sales.target} actual={GROUP.sales.actual} />
        </div>
        <DonutChart title="가족사 매출 기여도" slices={salesSlices} totalLabel="실적 합계" totalValue={`${GROUP.sales.actual.toLocaleString()}억`} />
      </div>

      {/* ── 3행: 도메인 & 가족사 카드 ── */}
      <div className="osd-row-companies">
        <div className="osd-domain-header-row">
          {DOMAINS.map((dom, i) => (
            <div key={i} className="osd-domain-hdr" style={{ gridColumn: `span ${dom.companies.length}` }}>
              <span className="osd-domain-name">{dom.name}</span>
              <span className="osd-domain-cnt">{dom.companies.length}개사</span>
            </div>
          ))}
        </div>
        <div className="osd-company-card-row">
          {DOMAINS.flatMap(d => d.companies).map(comp => {
            const oa = (comp.orders.actual / comp.orders.target) * 100;
            const sa = (comp.sales.actual / comp.sales.target) * 100;
            const oDiff = comp.orders.actual - comp.prevOrders;
            const oDiffPct = ((oDiff / comp.prevOrders) * 100).toFixed(1);
            const sDiff = comp.sales.actual - comp.prevSales;
            const sDiffPct = ((sDiff / comp.prevSales) * 100).toFixed(1);
            return (
              <div key={comp.id} className="osd-company-card" style={{ '--cc': comp.color } as React.CSSProperties}>
                <div className="osd-cc-header">
                  {comp.logo
                    ? <img src={comp.logo} alt={comp.name} className="osd-cc-logo" />
                    : <span className="osd-cc-logo-fb" style={{ background: comp.color }}>{comp.name[0]}</span>}
                  <span className="osd-cc-name">{comp.name}</span>
                  <span className="osd-cc-dot" style={{ background: comp.color }} />
                </div>
                {/* 수주 */}
                <div className="osd-cc-metric">
                  <div className="osd-cc-metric-header">
                    <span className="osd-cc-metric-label orders">수주</span>
                    <span className="osd-cc-metric-rate orders">{oa.toFixed(1)}%</span>
                  </div>
                  <div className="osd-cc-nums">
                    <span className="osd-cc-num-lbl">목표</span>
                    <span className="osd-cc-num">{comp.orders.target}억</span>
                    <span className="osd-cc-num bold" style={{ marginLeft: 8 }}>{comp.orders.actual}억</span>
                  </div>
                  <div className="osd-cc-bar-track">
                    <div className="osd-cc-bar-fill" style={{ width: `${Math.min(oa, 100)}%`, background: `linear-gradient(90deg, ${comp.color}44 0%, ${comp.color} 100%)` }} />
                  </div>
                  <div className="osd-cc-yoy">
                    <span className="osd-cc-yoy-lbl">전년</span>
                    <span className="osd-cc-yoy-prev">{comp.prevOrders}억</span>
                    <span className={`osd-cc-yoy-diff ${oDiff >= 0 ? 'up' : 'dn'}`}>{oDiff >= 0 ? '▲' : '▼'}{Math.abs(Number(oDiffPct))}%</span>
                  </div>
                </div>
                {/* 매출 */}
                <div className="osd-cc-metric">
                  <div className="osd-cc-metric-header">
                    <span className="osd-cc-metric-label sales">매출</span>
                    <span className="osd-cc-metric-rate sales">{sa.toFixed(1)}%</span>
                  </div>
                  <div className="osd-cc-nums">
                    <span className="osd-cc-num-lbl">목표</span>
                    <span className="osd-cc-num">{comp.sales.target}억</span>
                    <span className="osd-cc-num bold" style={{ marginLeft: 8 }}>{comp.sales.actual}억</span>
                  </div>
                  <div className="osd-cc-bar-track">
                    <div className="osd-cc-bar-fill" style={{ width: `${Math.min(sa, 100)}%`, background: `linear-gradient(90deg, ${comp.color}88 0%, ${comp.color}dd 100%)` }} />
                  </div>
                  <div className="osd-cc-yoy">
                    <span className="osd-cc-yoy-lbl">전년</span>
                    <span className="osd-cc-yoy-prev">{comp.prevSales}억</span>
                    <span className={`osd-cc-yoy-diff ${sDiff >= 0 ? 'up' : 'dn'}`}>{sDiff >= 0 ? '▲' : '▼'}{Math.abs(Number(sDiffPct))}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4행: 인사이트 ── */}
      <div className="osd-row-insights">

        {/* 주요 인사이트 (탭) */}
        <div className="osd-insight-card osd-insight-card--tabs">
          <div className="osd-insight-tabs">
            <button className={`osd-itab${insightTab === 'insight' ? ' active' : ''}`} onClick={() => setInsightTab('insight')}>주요 인사이트</button>
            <button className={`osd-itab${insightTab === 'industry' ? ' active' : ''}`} onClick={() => setInsightTab('industry')}>가족사 관련 산업 동향</button>
          </div>

          {insightTab === 'insight' ? (
            <div className="osd-insight-body">
              <div className="osd-alert-item warn">
                <span className="osd-alert-dot warn" />
                <span>가족사 수주 목표 달성률 <b>{Math.round((GROUP.orders.actual / GROUP.orders.target) * 100)}%</b> — 목표 대비 관리 필요</span>
              </div>
              <div className="osd-alert-item warn">
                <span className="osd-alert-dot warn" />
                <span>가족사 매출 목표 달성률 <b>{Math.round((GROUP.sales.actual / GROUP.sales.target) * 100)}%</b> — 목표 대비 관리 필요</span>
              </div>
              <div className="osd-alert-item info">
                <span className="osd-alert-dot info" />
                <span><b>장헌</b> 수주 80.0% — 가족사 내 최고 달성률 기록 중</span>
              </div>
              <div className="osd-alert-item ok">
                <span className="osd-alert-dot ok" />
                <span><b>바론</b> IT 매출 75.0% — 안정적 수익 구조 진입</span>
              </div>
            </div>
          ) : (
            <div className="osd-industry-news">
              {INDUSTRY_NEWS.map((n, i) => (
                <div key={i} className={`osd-alert-item ${n.type}`}>
                  <span className={`osd-alert-dot ${n.type}`} />
                  <span><b>{n.company}</b> {n.title} <span className="osd-news-date">{n.date}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 가족사 주요 인사이트 */}
        <div className="osd-insight-card">
          <div className="osd-insight-hdr"><span>가족사 주요 인사이트</span></div>
          <div className="osd-insight-kpis-row">
            <div className="osd-fin-kpi">
              <span className="osd-fin-kpi-label operating">영업이익</span>
              <span className="osd-fin-kpi-val">{GROUP_FIN.operatingProfit}억</span>
              <div className="osd-fin-kpi-sub">
                <span>이익률 {GROUP_FIN.operatingMargin}%</span>
                <span className="osd-fin-yoy up">▲{GROUP_FIN.operatingYoY}%</span>
              </div>
            </div>
            <div className="osd-fin-kpi">
              <span className="osd-fin-kpi-label net">당기순이익</span>
              <span className="osd-fin-kpi-val">{GROUP_FIN.netIncome}억</span>
              <div className="osd-fin-kpi-sub">
                <span>이익률 {GROUP_FIN.netMargin}%</span>
                <span className="osd-fin-yoy up">▲{GROUP_FIN.netYoY}%</span>
              </div>
            </div>
            <div className="osd-fin-kpi">
              <span className="osd-fin-kpi-label projects">프로젝트 건수</span>
              <span className="osd-fin-kpi-val">{GROUP_FIN.domesticProjects + GROUP_FIN.overseasProjects}건</span>
              <div className="osd-fin-kpi-sub">
                <span>국내 {GROUP_FIN.domesticProjects}</span>
                <span className="osd-fin-sep">·</span>
                <span>해외 {GROUP_FIN.overseasProjects}</span>
              </div>
            </div>
            <div className="osd-fin-kpi">
              <span className="osd-fin-kpi-label overseas">해외지사</span>
              <span className="osd-fin-kpi-val">{GROUP_FIN.overseasOffices}개소</span>
              <div className="osd-fin-kpi-sub">
                <span>{GROUP_FIN.overseasCountries}개국 운영</span>
              </div>
            </div>
          </div>
        </div>

        {/* 운영전략 코멘트 */}
        <div className="osd-insight-card osd-insight-card--strategy">
          <div className="osd-insight-hdr"><span>운영전략 코멘트</span></div>
          <div className="osd-insight-body">
            <div className="osd-alert-item info">
              <span className="osd-alert-dot info" />
              <span><b>ENG</b> 공공발주 선점 완료 → 하반기 대형 민간 컨소시엄 신규 진입 추진</span>
            </div>
            <div className="osd-alert-item warn">
              <span className="osd-alert-dot warn" />
              <span><b>M&amp;C</b> 건자재 단가 상승 대응 → 공동조달 플랫폼 4Q 가동, 원가율 -5%p 목표</span>
            </div>
            <div className="osd-alert-item ok">
              <span className="osd-alert-dot ok" />
              <span><b>환경 EPC</b> 하수처리 현대화 통합사업 우선협상 진입 → 매출 안정화 기대</span>
            </div>
            <div className="osd-alert-item info">
              <span className="osd-alert-dot info" />
              <span><b>IT(바론)</b> SI 외주 의존 축소 → 클라우드 라이선스 매출 20%p 전환 추진</span>
            </div>
            <div className="osd-alert-item ok">
              <span className="osd-alert-dot ok" />
              <span><b>해외</b> 동남아 3개국 MOU 활용 → 친환경자재 수출 조기 계약 체결 목표</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrdersSalesDashboard;
