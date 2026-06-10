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
  { id: 'hanmaek', name: '한맥기술', domain: 'ENG. Business',              logo: `${B}images/logo/Hanmac.svg`,    employees: 130, orders: { target: 800, actual: 620 }, sales: { target: 700, actual: 510 }, prevOrders: 580, prevSales: 470, color: '#1a5e35' },
  { id: 'saman',   name: '삼안',     domain: 'ENG. Business',              logo: `${B}images/logo/Saman.svg`,     employees: 150, orders: { target: 700, actual: 520 }, sales: { target: 600, actual: 430 }, prevOrders: 490, prevSales: 400, color: '#0f766e' },
  { id: 'jhind',   name: '장헌산업', domain: 'Manufacture & Construction', logo: `${B}images/logo/Jangheon.svg`,  employees: 35,  orders: { target: 400, actual: 280 }, sales: { target: 350, actual: 240 }, prevOrders: 260, prevSales: 210, color: '#b45309' },
  { id: 'jh',      name: '장헌',     domain: 'Manufacture & Construction', logo: `${B}images/logo/jangheon_1.svg`,employees: 20,  orders: { target: 200, actual: 160 }, sales: { target: 180, actual: 135 }, prevOrders: 145, prevSales: 120, color: '#a16207' },
  { id: 'ptc',     name: '피티씨',   domain: 'Manufacture & Construction', logo: `${B}images/logo/PTC.svg`,       employees: 25,  orders: { target: 150, actual: 110 }, sales: { target: 140, actual: 105 }, prevOrders: 95,  prevSales: 88,  color: '#9a3412' },
  { id: 'halla',   name: '한라',     domain: 'Environment EPC & Plant',    logo: `${B}images/logo/Halla.svg`,     employees: 30,  orders: { target: 150, actual: 95  }, sales: { target: 130, actual: 85  }, prevOrders: 80,  prevSales: 72,  color: '#065f46' },
  { id: 'baron',   name: '바론',     domain: 'IT Business',                logo: `${B}images/logo/Baron.svg`,     employees: 15,  orders: { target: 100, actual: 65  }, sales: { target: 100, actual: 75  }, prevOrders: 55,  prevSales: 62,  color: '#1d4ed8' },
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
  { company: '한맥기술', title: '스마트시티 교통 인프라 기본설계 용역 우선협상대상자 선정', date: '2026.05.28', tag: 'ENG' },
  { company: '삼안',     title: '국토부 제3연육교 기본설계 및 실시설계 용역 수주',           date: '2026.05.22', tag: 'ENG' },
  { company: '장헌산업', title: '친환경 건축자재 동남아 3개국 수출 MOU 체결',                date: '2026.05.15', tag: 'M&C' },
  { company: '한라',     title: '환경부 하수처리시설 현대화 사업 설계·시공 통합 발주 참여', date: '2026.05.10', tag: 'EPC' },
  { company: '바론',     title: 'AI 기반 제조실행시스템(MES) 공급 계약 체결',               date: '2026.05.08', tag: 'IT'  },
  { company: '피티씨',   title: '중공업 플랜트용 특수 부품 납품 물량 확대 계약',            date: '2026.04.30', tag: 'M&C' },
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
              <text x="50" y="44" textAnchor="middle" fontSize="6.5" fill="#8e8780" fontWeight="600">{totalLabel}</text>
              <text x="50" y="57" textAnchor="middle" fontSize="10"  fill="#1e1b18" fontWeight="800">{totalValue}</text>
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
        <div className="osd-kpi-table">
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
            <span style={{ color: accentColor, fontSize: '15px', fontWeight: 700 }}>{actual.toLocaleString()}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>목표 {target.toLocaleString()}</span>
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

      {/* ── 1행: 총괄 요약 ── */}
      <div className="osd-row-summary">
        <DonutChart title="가족사 수주 기여도" slices={orderSlices} totalLabel="실적 합계" totalValue={`${GROUP.orders.actual.toLocaleString()}억`} />
        <div className="osd-summary-center">
          <KpiPanel type="orders" target={GROUP.orders.target} actual={GROUP.orders.actual} />
          <div className="osd-tvsa-badge"><span className="osd-tvsa-text">Target<br />vs.<br />Actual</span></div>
          <KpiPanel type="sales" target={GROUP.sales.target} actual={GROUP.sales.actual} />
        </div>
        <DonutChart title="가족사 매출 기여도" slices={salesSlices} totalLabel="실적 합계" totalValue={`${GROUP.sales.actual.toLocaleString()}억`} />
      </div>

      {/* ── 2행: 도메인 & 가족사 카드 ── */}
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
              <div key={comp.id} className="osd-company-card">
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
                    <span className="osd-cc-metric-label orders">수주 실적</span>
                    <span className="osd-cc-metric-rate orders">{oa.toFixed(1)}%</span>
                  </div>
                  <div className="osd-cc-nums">
                    <span className="osd-cc-num-lbl">목표</span>
                    <span className="osd-cc-num">{comp.orders.target}억</span>
                    <span className="osd-cc-num-lbl" style={{ marginLeft: 6 }}>실적</span>
                    <span className="osd-cc-num bold">{comp.orders.actual}억</span>
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
                    <span className="osd-cc-metric-label sales">매출 실적</span>
                    <span className="osd-cc-metric-rate sales">{sa.toFixed(1)}%</span>
                  </div>
                  <div className="osd-cc-nums">
                    <span className="osd-cc-num-lbl">목표</span>
                    <span className="osd-cc-num">{comp.sales.target}억</span>
                    <span className="osd-cc-num-lbl" style={{ marginLeft: 6 }}>실적</span>
                    <span className="osd-cc-num bold">{comp.sales.actual}억</span>
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

      {/* ── 3행: 인당 생산성 ── */}
      <div className="osd-row-percap">
        <div className="osd-percap-panel">
          <div className="osd-percap-hdr"><span>가족사별 인당 수주 / 매출 (억원)</span></div>
          <div className="osd-percap-list">
            <div className="osd-percap-item total">
              <div className="osd-percap-item-top">
                <span className="osd-percap-item-name">전체</span>
                <span className="osd-percap-item-emp">{GROUP.employees}명</span>
              </div>
              <span className="osd-percap-item-vals">{groupPerOrder.toFixed(2)} / {groupPerSales.toFixed(2)}</span>
            </div>
            {COMPANIES_DATA.map(c => (
              <div key={c.id} className="osd-percap-item">
                <div className="osd-percap-item-top">
                  <span className="osd-percap-item-name">{c.name}</span>
                  <span className="osd-percap-item-emp">{c.employees}명</span>
                </div>
                <span className="osd-percap-item-vals">{(c.orders.actual / c.employees).toFixed(2)} / {(c.sales.actual / c.employees).toFixed(2)}</span>
              </div>
            ))}
          </div>
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
                <span className="osd-alert-badge warn">주의</span>
                <span>가족사 수주 목표 달성률 <b>{Math.round((GROUP.orders.actual / GROUP.orders.target) * 100)}%</b> — 목표 대비 관리 필요</span>
              </div>
              <div className="osd-alert-item warn">
                <span className="osd-alert-badge warn">주의</span>
                <span>가족사 매출 목표 달성률 <b>{Math.round((GROUP.sales.actual / GROUP.sales.target) * 100)}%</b> — 목표 대비 관리 필요</span>
              </div>
              <div className="osd-alert-item info">
                <span className="osd-alert-badge info">달성</span>
                <span><b>장헌</b> 수주 80.0% — 가족사 내 최고 달성률 기록 중</span>
              </div>
              <div className="osd-alert-item ok">
                <span className="osd-alert-badge ok">정상</span>
                <span><b>바론</b> IT 매출 75.0% — 안정적 수익 구조 진입</span>
              </div>
            </div>
          ) : (
            <div className="osd-industry-news">
              {INDUSTRY_NEWS.map((n, i) => (
                <div key={i} className="osd-news-item">
                  <span className={`osd-news-tag osd-news-tag--${n.tag.replace('&', 'n').toLowerCase()}`}>{n.tag}</span>
                  <span className="osd-news-company">{n.company}</span>
                  <span className="osd-news-title">{n.title}</span>
                  <span className="osd-news-date">{n.date}</span>
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
              <span className="osd-fin-kpi-label">영업이익</span>
              <span className="osd-fin-kpi-val">{GROUP_FIN.operatingProfit}억</span>
              <div className="osd-fin-kpi-sub">
                <span>이익률 {GROUP_FIN.operatingMargin}%</span>
                <span className="osd-fin-yoy up">▲{GROUP_FIN.operatingYoY}%</span>
              </div>
            </div>
            <div className="osd-fin-kpi">
              <span className="osd-fin-kpi-label">당기순이익</span>
              <span className="osd-fin-kpi-val">{GROUP_FIN.netIncome}억</span>
              <div className="osd-fin-kpi-sub">
                <span>이익률 {GROUP_FIN.netMargin}%</span>
                <span className="osd-fin-yoy up">▲{GROUP_FIN.netYoY}%</span>
              </div>
            </div>
            <div className="osd-fin-kpi">
              <span className="osd-fin-kpi-label">프로젝트 건수</span>
              <span className="osd-fin-kpi-val">{GROUP_FIN.domesticProjects + GROUP_FIN.overseasProjects}건</span>
              <div className="osd-fin-kpi-sub">
                <span>국내 {GROUP_FIN.domesticProjects}</span>
                <span className="osd-fin-sep">·</span>
                <span>해외 {GROUP_FIN.overseasProjects}</span>
              </div>
            </div>
            <div className="osd-fin-kpi">
              <span className="osd-fin-kpi-label">해외지사</span>
              <span className="osd-fin-kpi-val">{GROUP_FIN.overseasOffices}개소</span>
              <div className="osd-fin-kpi-sub">
                <span>{GROUP_FIN.overseasCountries}개국 운영</span>
              </div>
            </div>
          </div>
        </div>

        {/* 전략 코멘트 */}
        <div className="osd-insight-card">
          <div className="osd-insight-hdr"><span>전략 코멘트</span></div>
          <div className="osd-insight-body osd-strategy-text">
            <p><b>ENG</b> 공공 발주 선점 성공 → 하반기 민간 수주 강화 및 대형 컨소시엄 전략 수립이 필요합니다.</p>
            <p><b>M&amp;C</b> 건자재 단가 상승 대응 → 자재 공동 조달 플랫폼 가동, 원가율 관리가 시급합니다.</p>
            <p><b>IT(바론)</b> SI 외주 → 클라우드·자체 솔루션 라이선스 매출 전환으로 중장기 이익 향상을 추진합니다.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrdersSalesDashboard;
