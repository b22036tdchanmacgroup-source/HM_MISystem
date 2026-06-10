import React, { useState, useRef, useEffect } from 'react';
import { Network, ChevronRight, Users, Building, User, PieChart, Star, TrendingUp, X } from 'lucide-react';
import GovernanceD3Chart from './GovernanceD3Chart';
import ShareholdersD3Chart from './ShareholdersD3Chart';
import { SHAREHOLDER_DATA, COMPANY_DETAILS_MAP } from './shareholderData';
import { GOV_D3_STYLE, GOV_D3_CURRENT } from './govD3Data';

interface TeamOverlayProps {
  onClose: () => void;
  [key: string]: unknown;
}

const CHART_BASE_DATE = '2026.06';

const LOGO_MAP: Record<string, string | undefined> = Object.fromEntries(
  GOV_D3_CURRENT.nodes.map(n => [n.id, n.logo])
);



interface ScaleCompany {
  id: string;
  name: string;
  value: number;
  pct: string;
  unlistedVal: number;
  shares: number;
  pricePerShare: number;
  borderColor: string;
  titleColor: string;
}

const SCALE_COMPANIES_ROW1: ScaleCompany[] = [
  { id: 'baron', name: 'A사', value: 1250000, pct: '32.1', unlistedVal: 12500, shares: 100000, pricePerShare: 125000, borderColor: '#2845a0', titleColor: '#2845a0' },
  { id: 'ptc', name: 'B사', value: 850000, pct: '21.8', unlistedVal: 8500, shares: 100000, pricePerShare: 85000, borderColor: '#c62828', titleColor: '#c62828' },
  { id: 'hanmaek', name: 'C사', value: 500000, pct: '12.8', unlistedVal: 5000, shares: 100000, pricePerShare: 50000, borderColor: '#29b6f6', titleColor: '#0288d1' }
];

const SCALE_COMPANIES_ROW2: ScaleCompany[] = [
  { id: 'jp', name: 'D사', value: 350000, pct: '9.0', unlistedVal: 3500, shares: 100000, pricePerShare: 35000, borderColor: '#7c4dff', titleColor: '#5e35b1' },
  { id: 'saman', name: 'F사', value: 220000, pct: '5.6', unlistedVal: 2200, shares: 100000, pricePerShare: 22000, borderColor: '#ffb300', titleColor: '#ff8f00' },
  { id: 'open', name: 'E사', value: 150000, pct: '3.8', unlistedVal: 1500, shares: 100000, pricePerShare: 15000, borderColor: '#03a9f4', titleColor: '#0288d1' },
  { id: 'jhind', name: 'G사', value: 110000, pct: '2.8', unlistedVal: 1100, shares: 100000, pricePerShare: 11000, borderColor: '#a1887b', titleColor: '#6d4c41' }
];

const SCALE_COMPANIES_ROW3: ScaleCompany[] = [
  { id: 'open_end', name: 'OPEN END', value: 60000, pct: '1.5', unlistedVal: 600, shares: 100000, pricePerShare: 6000, borderColor: '#e91e63', titleColor: '#c2185b' },
  { id: 'jh', name: 'I사', value: 45000, pct: '1.2', unlistedVal: 450, shares: 100000, pricePerShare: 4500, borderColor: '#9c27b0', titleColor: '#7b1fa2' },
  { id: 'halla', name: 'H사', value: 30000, pct: '0.8', unlistedVal: 300, shares: 100000, pricePerShare: 3000, borderColor: '#4caf50', titleColor: '#388e3c' },
  { id: 'hyunta', name: 'J사', value: 25000, pct: '0.6', unlistedVal: 250, shares: 100000, pricePerShare: 2500, borderColor: '#009688', titleColor: '#00796b' }
];

const TeamOverlay: React.FC<TeamOverlayProps> = ({ onClose: _onClose }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isScaleMode, setIsScaleMode] = useState<boolean>(false);
  const [showChangeModal, setShowChangeModal] = useState<boolean>(false);
  const cardRefs = useRef<Record<string, HTMLDivElement>>({});

  const handleShowShChanges = () => {
    setShowChangeModal(true);
  };

  const getBizBadgeClass = (bizType: string) => {
    if (bizType === 'ENG. Business') return 'eng';
    if (bizType === 'Manufacture & Construction') return 'mc';
    if (bizType === 'Environment EPC & Plant') return 'env';
    if (bizType === 'IT Business') return 'it';
    return '';
  };
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedNodeId) return;
    const el = cardRefs.current[selectedNodeId];
    if (el && gridRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedNodeId]);

  // 상세 보기 모드 여부
  const isDetailMode = selectedNodeId !== null;
  const currentCompany = SHAREHOLDER_DATA.find(company => company.nodeId === selectedNodeId);
  const detailInfo = selectedNodeId ? (COMPANY_DETAILS_MAP[selectedNodeId] || COMPANY_DETAILS_MAP['hanmaek']) : null;
  const detailColor = currentCompany ? (GOV_D3_STYLE[currentCompany.k]?.stroke ?? '#888888') : '#888888';
  const detailLogo = selectedNodeId ? LOGO_MAP[selectedNodeId] : undefined;

  // 법인/개인 주주 지분 합산 및 주식 수 계산
  let corpSharesTotalStr = '0주 (0.0%)';
  let indSharesTotalStr = '0주 (0.0%)';
  let corpPct = 0;
  
  if (detailInfo && currentCompany) {
    const totalSharesVal = parseFloat(detailInfo.totalSharesNum.replace(/[^0-9]/g, ''));
    
    const corpSharesSum = currentCompany.shareholders
      .filter(s => s.type === '법인')
      .reduce((sum, s) => sum + Math.round(totalSharesVal * parseFloat(s.pct) / 100), 0);
    const corpPctSum = currentCompany.shareholders
      .filter(s => s.type === '법인')
      .reduce((sum, s) => sum + parseFloat(s.pct), 0);
    corpPct = corpPctSum;

    const indSharesSum = currentCompany.shareholders
      .filter(s => s.type === '개인')
      .reduce((sum, s) => sum + Math.round(totalSharesVal * parseFloat(s.pct) / 100), 0);
    const indPctSum = currentCompany.shareholders
      .filter(s => s.type === '개인')
      .reduce((sum, s) => sum + parseFloat(s.pct), 0);

    corpSharesTotalStr = `${corpSharesSum.toLocaleString()}주 (${corpPctSum.toFixed(1)}%)`;
    indSharesTotalStr = `${indSharesSum.toLocaleString()}주 (${indPctSum.toFixed(1)}%)`;
  }

  // 당기 vs 전기 평가 비교액 연산
  let diffPriceStr = '—';
  let diffCapStr = '—';
  let isPriceUp = true;
  let isCapUp = true;

  if (detailInfo) {
    const curPrice = parseInt(detailInfo.pricePerShare.replace(/[^0-9]/g, ''));
    const prevPrice = parseInt(detailInfo.prevPricePerShare.replace(/[^0-9]/g, ''));
    const diffPrice = curPrice - prevPrice;
    isPriceUp = diffPrice >= 0;
    const pctPrice = ((diffPrice / prevPrice) * 100).toFixed(1);
    diffPriceStr = `${isPriceUp ? '▲' : '▼'} ${Math.abs(diffPrice).toLocaleString()}원 (${isPriceUp ? '+' : ''}${pctPrice}%)`;

    const curCap = parseInt(detailInfo.marketCap.replace(/[^0-9]/g, ''));
    const prevCap = parseInt(detailInfo.prevMarketCap.replace(/[^0-9]/g, ''));
    const diffCap = curCap - prevCap;
    isCapUp = diffCap >= 0;
    const pctCap = ((diffCap / prevCap) * 100).toFixed(1);
    diffCapStr = `${isCapUp ? '▲' : '▼'} ${Math.abs(diffCap).toLocaleString()} 백만원 (${isCapUp ? '+' : ''}${pctCap}%)`;
  }

  return (
    <div className="team-overlay">

      {/* ── 헤더 ── */}
      <div className="team-panel-header">
        <div className="team-panel-title">
          <Network size={20} aria-hidden="true" />
          <span>한맥가족 지배구조 및 주주 현황</span>
          <span className="team-total-badge">기준 {CHART_BASE_DATE}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDetailMode && (
            <button className="sh-back-btn" onClick={() => setSelectedNodeId(null)} style={{ padding: '7px 15px', fontSize: '12.5px', height: '34px', boxSizing: 'border-box' }}>
              <span className="back-arrow">←</span> 전체보기
            </button>
          )}
        </div>
      </div>

      {/* ── 좌/우 2패널 레이아웃 ── */}
      <div className="gov-two-panel">

        {/* ── 왼쪽: 최대주주 + 지배구조 ── */}
        <div className="gov-left-panel">

          <div className="gov-sh-section">
            <div className="gov-sh-body">
              <div className="sh-chart-wrap">
                <div className="gov-d3-toggle">
                  <span className="sh-chart-title-label deco-title">최대주주 현황</span>
                </div>
                <ShareholdersD3Chart />
              </div>
            </div>
          </div>

          <div className="gov-structure-section">
            <GovernanceD3Chart 
              onNodeClick={id => setSelectedNodeId(id)} 
              onNodeHover={info => setHoveredNodeId(info ? info.nodeId : null)}
            />
          </div>

        </div>

        {/* ── 오른쪽: 주주 현황 (상세 또는 그리드 리스트) ── */}
        <div className="gov-right-panel">

          {isScaleMode && !isDetailMode ? (
            <div className="sh-scale-container">
              {/* 제목 바 + 돌아가기 버튼 */}
              <div className="sh-scale-topbar">
                <span className="sh-chart-title-label deco-title">가족사 규모</span>
                <button className="gov-scale-btn" onClick={() => setIsScaleMode(false)}>
                  주주 현황 <ChevronRight size={11} className="gov-scale-btn-icon" />
                </button>
              </div>

              {/* 트리맵 그리드 */}
              <div className="sh-scale-treemap">
                {/* 1행: A, B, C */}
                <div className="sh-scale-row sh-scale-row-1">
                  {SCALE_COMPANIES_ROW1.map(comp => {
                    const isHovered = hoveredNodeId === comp.id;
                    return (
                      <div
                        key={comp.id}
                        className={`gov-scale-card${isHovered ? ' hovered' : ''}`}
                        style={{ borderColor: comp.borderColor, cursor: 'pointer', '--card-color': comp.borderColor } as React.CSSProperties}
                        onClick={() => {
                          setSelectedNodeId(comp.id);
                          setIsScaleMode(false);
                        }}
                      >
                        <div className="gov-scale-card-header" style={{ color: comp.titleColor }}>{comp.name}</div>
                        <div className="gov-scale-card-value-wrap">
                          <div className="gov-scale-card-value">{comp.value.toLocaleString()} 백만원</div>
                          <div className="gov-scale-card-pct">({comp.pct}%)</div>
                        </div>
                        <div className="gov-scale-card-details">
                          <div className="gov-scale-detail-row">
                            <span className="label">주식 수</span>
                            <span className="val">{comp.shares.toLocaleString()} 주</span>
                          </div>
                          <div className="gov-scale-divider" />
                          <div className="gov-scale-detail-row">
                            <span className="label">주당 가치</span>
                            <span className="val">{comp.pricePerShare.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2행: D, F, E, G */}
                <div className="sh-scale-row sh-scale-row-2">
                  {SCALE_COMPANIES_ROW2.map(comp => {
                    const isHovered = hoveredNodeId === comp.id;
                    return (
                      <div
                        key={comp.id}
                        className={`gov-scale-card${isHovered ? ' hovered' : ''}`}
                        style={{ borderColor: comp.borderColor, cursor: 'pointer', '--card-color': comp.borderColor } as React.CSSProperties}
                        onClick={() => {
                          setSelectedNodeId(comp.id);
                          setIsScaleMode(false);
                        }}
                      >
                        <div className="gov-scale-card-header" style={{ color: comp.titleColor }}>{comp.name}</div>
                        <div className="gov-scale-card-value-wrap">
                          <div className="gov-scale-card-value">{comp.value.toLocaleString()} 백만원</div>
                          <div className="gov-scale-card-pct">({comp.pct}%)</div>
                        </div>
                        <div className="gov-scale-card-details">
                          <div className="gov-scale-detail-row">
                            <span className="label">주식 수</span>
                            <span className="val">{comp.shares.toLocaleString()} 주</span>
                          </div>
                          <div className="gov-scale-divider" />
                          <div className="gov-scale-detail-row">
                            <span className="label">주당 가치</span>
                            <span className="val">{comp.pricePerShare.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3행: OPEN END, I, H, J */}
                <div className="sh-scale-row sh-scale-row-3">
                  {SCALE_COMPANIES_ROW3.map(comp => {
                    const isHovered = comp.id !== 'open_end' && hoveredNodeId === comp.id;
                    return (
                      <div
                        key={comp.id}
                        className={`gov-scale-card${isHovered ? ' hovered' : ''}`}
                        style={{ borderColor: comp.borderColor, cursor: comp.id === 'open_end' ? 'default' : 'pointer', '--card-color': comp.borderColor } as React.CSSProperties}
                        onClick={() => {
                          if (comp.id !== 'open_end') {
                            setSelectedNodeId(comp.id);
                            setIsScaleMode(false);
                          }
                        }}
                      >
                        <div className="gov-scale-card-header" style={{ color: comp.titleColor }}>{comp.name}</div>
                        <div className="gov-scale-card-value-wrap">
                          <div className="gov-scale-card-value">{comp.value.toLocaleString()} 백만원</div>
                          <div className="gov-scale-card-pct">({comp.pct}%)</div>
                        </div>
                        <div className="gov-scale-card-details">
                          <div className="gov-scale-detail-row">
                            <span className="label">주식 수</span>
                            <span className="val">{comp.shares.toLocaleString()} 주</span>
                          </div>
                          <div className="gov-scale-divider" />
                          <div className="gov-scale-detail-row">
                            <span className="label">주당 가치</span>
                            <span className="val">{comp.pricePerShare.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 하단 스탯 4종 정보 카드 */}
              <div className="sh-scale-stats-row">
                <div className="sh-scale-stat-card">
                  <div className="sh-scale-stat-icon-wrap"><Users size={18} /></div>
                  <div className="sh-scale-stat-info">
                    <span className="sh-scale-stat-label">전체 회사가치 합계</span>
                    <span className="sh-scale-stat-val">3,890,000 백만원</span>
                    <span className="sh-scale-stat-val-desc">(3조 8,900억원)</span>
                  </div>
                </div>
                <div className="sh-scale-stat-card">
                  <div className="sh-scale-stat-icon-wrap"><Star size={18} /></div>
                  <div className="sh-scale-stat-info">
                    <span className="sh-scale-stat-label">최대 회사 가치</span>
                    <span className="sh-scale-stat-val">A사 1,250,000 백만원</span>
                    <span className="sh-scale-stat-val-desc">(1조 2,500억원)</span>
                  </div>
                </div>
                <div className="sh-scale-stat-card">
                  <div className="sh-scale-stat-icon-wrap"><TrendingUp size={18} /></div>
                  <div className="sh-scale-stat-info">
                    <span className="sh-scale-stat-label">평균 회사 가치</span>
                    <span className="sh-scale-stat-val">389,000 백만원</span>
                    <span className="sh-scale-stat-val-desc">(3,890억원)</span>
                  </div>
                </div>
                <div className="sh-scale-stat-card">
                  <div className="sh-scale-stat-icon-wrap"><Building size={18} /></div>
                  <div className="sh-scale-stat-info">
                    <span className="sh-scale-stat-label">100억원 이상 회사</span>
                    <span className="sh-scale-stat-val">6개사 / 10개사</span>
                    <span className="sh-scale-stat-val-desc">(60.0%)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : !isDetailMode ? (
            <>
              {/* 제목 바 + 가족사 규모 버튼 */}
              <div className="sh-panel-topbar">
                <span className="sh-chart-title-label deco-title">가족사 주주 현황</span>
                <button className="gov-scale-btn" onClick={() => setIsScaleMode(true)}>
                  가족사 규모 <ChevronRight size={11} className="gov-scale-btn-icon" />
                </button>
              </div>

              {/* 회사별 주주현황 카드 그리드 */}
              <div className="sh-table-grid" ref={gridRef}>
                {SHAREHOLDER_DATA.map(company => {
                  const color = GOV_D3_STYLE[company.k]?.stroke ?? '#888888';
                  const logo = LOGO_MAP[company.nodeId];
                  const isActive = selectedNodeId === company.nodeId;
                  const isDimmed = selectedNodeId !== null && !isActive;
                  const isHovered = hoveredNodeId === company.nodeId;
                  const corpShs = company.shareholders.filter(s => s.type === '법인');
                  const indShs = company.shareholders.filter(s => s.type === '개인');
                  const corpSum = corpShs.reduce((acc, s) => {
                    const val = parseFloat(s.pct);
                    return isNaN(val) ? acc : acc + val;
                  }, 0);
                  const indSum = indShs.reduce((acc, s) => {
                    const val = parseFloat(s.pct);
                    return isNaN(val) ? acc : acc + val;
                  }, 0);

                  return (
                    <div
                      key={company.nodeId}
                      ref={el => { if (el) cardRefs.current[company.nodeId] = el; }}
                      className={`sh-company-card${isActive ? ' active' : ''}${isDimmed ? ' dimmed' : ''}${isHovered ? ' hovered' : ''}`}
                      style={{ '--card-color': color, cursor: 'pointer' } as React.CSSProperties}
                      onClick={() => setSelectedNodeId(company.nodeId)}
                    >
                      {/* 헤더: 로고 + 회사명 */}
                      <div className="sh-card-header">
                        {logo ? (
                          <img src={logo} className="sh-card-logo" alt="" />
                        ) : (
                          <span className="sh-card-logo-placeholder">
                            {company.name.charAt(0)}
                          </span>
                        )}
                        <span className="sh-card-name">{company.name}</span>
                      </div>

                      {/* 주주 리스트 */}
                      <div className="sh-card-body">
                        {/* 법인 주주 그룹 */}
                        {corpShs.length > 0 && (
                          <div className="sh-card-group-section">
                            <div className="sh-card-group-header corp">
                              <span>법인</span>
                              <span>{corpSum.toFixed(1)}%</span>
                            </div>
                            {corpShs.map((sh, i) => (
                              <div key={`corp-${i}`} className="sh-sh-row sh-row-corp">
                                <span className="sh-td-name">{sh.name}</span>
                                <span className="sh-td-pct">{sh.pct}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* 개인 주주 그룹 */}
                        {indShs.length > 0 && (
                          <div className="sh-card-group-section" style={{ marginTop: '8px' }}>
                            <div className="sh-card-group-header ind">
                              <span>개인</span>
                              <span>{indSum.toFixed(1)}%</span>
                            </div>
                            {indShs.map((sh, i) => (
                              <div key={`ind-${i}`} className="sh-sh-row sh-row-ind">
                                <span className="sh-td-name">{sh.name}</span>
                                <span className="sh-td-pct">{sh.pct}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            detailInfo && currentCompany && (
              <div className="sh-detail-container">

                {/* 상단 요약 정보 (회사 기본정보 + 기업가치) */}
                <div className="sh-detail-header-card">
                  <div className="sh-detail-company-info">
                    {detailLogo ? (
                      <img src={detailLogo} className="sh-detail-logo" alt="" />
                    ) : (
                      <span className="sh-detail-logo-placeholder" style={{ backgroundColor: detailColor }}>
                        {currentCompany.name.charAt(0)}
                      </span>
                    )}
                    <div className="sh-detail-name-wrap">
                      <div className="sh-detail-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="sh-detail-name">{currentCompany.name}</span>
                        {detailInfo.bizType && (
                          <span className={`sh-detail-biz-badge ${getBizBadgeClass(detailInfo.bizType)}`}>
                            {detailInfo.bizType}
                          </span>
                        )}
                        {detailInfo.firmType && detailInfo.firmType !== '비외감기업' && (
                          <span className="sh-detail-firm-type">({detailInfo.firmType})</span>
                        )}
                      </div>
                      <div className="sh-detail-meta-row">
                        <span>설립일 <b>{detailInfo.estDate}</b></span>
                        <span className="divider">|</span>
                        <span>업종 <b>{detailInfo.industry}</b></span>
                        <span className="divider">|</span>
                        <span>대표이사 <b>{detailInfo.ceo}</b></span>
                        <span className="divider">|</span>
                        <span>임직원 수 <b>{detailInfo.employees}</b></span>
                      </div>
                    </div>
                  </div>

                  {/* 기업 가치 평가 박스 */}
                  <div className="sh-detail-valuation-box">
                    <span className="val-title">비상장주식 평가에 따른 기업가치(시가총액)</span>
                    <span className="val-amount">{detailInfo.marketCap}</span>
                    <span className="val-date">(기준일 {detailInfo.valuationDate})</span>
                  </div>
                </div>

                {/* 중간: 주주 현황 (차트 + 주주 테이블) */}
                <div className="sh-detail-body-row">
                  <div className="sh-detail-chart-card">
                    <div className="sh-detail-card-header">
                      <div className="sh-detail-section-title">주주현황</div>
                      <button className="sh-btn-change-history" onClick={handleShowShChanges}>
                        주주 변동 사항
                      </button>
                    </div>
                    <div className="sh-detail-chart-content">
                      {/* 파이 차트 영역 */}
                      <div className="sh-pie-chart-wrap">
                        <div className="sh-pie-chart" style={{
                          background: `conic-gradient(#2845a0 0% ${corpPct}%, #8c4a0e ${corpPct}% 100%)`
                        } as React.CSSProperties}>
                          <div className="sh-pie-center">
                            <span className="pie-label">발행주식총수</span>
                            <span className="pie-value">{detailInfo.totalSharesNum}</span>
                          </div>
                        </div>
                        <div className="sh-pie-legend">
                          <span className="legend-item corp">
                            <span className="legend-dot"></span>
                            법인 {corpPct.toFixed(1)}%
                          </span>
                          <span className="legend-item ind">
                            <span className="legend-dot"></span>
                            개인 {(100 - corpPct).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* 법인 주주 리스트 */}
                      <div className="sh-sh-list-col">
                        <div className="sh-list-header corp-bg">
                          <span className="list-header-title">법인</span>
                          <span className="list-header-total">{corpSharesTotalStr}</span>
                        </div>
                        <div className="sh-list-body">
                          {currentCompany.shareholders.filter(s => s.type === '법인').map((sh, idx) => {
                            const pctVal = parseFloat(sh.pct);
                            const totalSharesVal = parseFloat(detailInfo.totalSharesNum.replace(/[^0-9]/g, ''));
                            const sharesNum = Math.round(totalSharesVal * pctVal / 100);
                            const sharesStr = sharesNum.toLocaleString() + '주';
                            return (
                              <div key={idx} className="sh-sh-detail-row">
                                <span className="sh-detail-row-name font-corp">{sh.name}</span>
                                <span className="sh-detail-row-shares">{sharesStr}</span>
                                <span className="sh-detail-row-pct">{sh.pct}</span>
                              </div>
                            );
                          })}
                          {currentCompany.shareholders.filter(s => s.type === '법인').length === 0 && (
                            <div className="sh-detail-row-empty">법인 주주 없음</div>
                          )}
                        </div>
                      </div>

                      {/* 개인 주주 리스트 */}
                      <div className="sh-sh-list-col">
                        <div className="sh-list-header ind-bg">
                          <span className="list-header-title">개인</span>
                          <span className="list-header-total">{indSharesTotalStr}</span>
                        </div>
                        <div className="sh-list-body">
                          {currentCompany.shareholders.filter(s => s.type === '개인').map((sh, idx) => {
                            const pctVal = parseFloat(sh.pct);
                            const totalSharesVal = parseFloat(detailInfo.totalSharesNum.replace(/[^0-9]/g, ''));
                            const sharesNum = Math.round(totalSharesVal * pctVal / 100);
                            const sharesStr = sharesNum.toLocaleString() + '주';
                            return (
                              <div key={idx} className="sh-sh-detail-row">
                                <span className="sh-detail-row-name font-ind">{sh.name}</span>
                                <span className="sh-detail-row-shares">{sharesStr}</span>
                                <span className="sh-detail-row-pct">{sh.pct}</span>
                              </div>
                            );
                          })}
                          {currentCompany.shareholders.filter(s => s.type === '개인').length === 0 && (
                            <div className="sh-detail-row-empty">개인 주주 없음</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단: 비상장주식 평가 요약 테이블 (당기/전기 비교 포함) */}
                <div className="sh-detail-valuation-table-card">
                  <div className="sh-detail-section-title">비상장주식 평가 요약 및 전기 비교</div>
                  <div className="table-responsive">
                    <table className="sh-valuation-table">
                      <thead>
                        <tr>
                          <th>구분</th>
                          <th>평가 기준일</th>
                          <th>평가 방식</th>
                          <th>적용 할인율</th>
                          <th>주당 평가액</th>
                          <th>기업가치(시가총액)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="cur-year-row">
                          <td className="row-type-label">당기 (2026년)</td>
                          <td>{detailInfo.valuationDate}</td>
                          <td>{detailInfo.evalMethod}</td>
                          <td>{detailInfo.discountRate}</td>
                          <td className="val-cell">{detailInfo.pricePerShare}</td>
                          <td className="highlight-text val-cell">{detailInfo.marketCap}</td>
                        </tr>
                        <tr className="prev-year-row">
                          <td className="row-type-label">전기 (2025년)</td>
                          <td>{detailInfo.prevValuationDate}</td>
                          <td>{detailInfo.evalMethod}</td>
                          <td>{detailInfo.prevDiscountRate}</td>
                          <td className="val-cell">{detailInfo.prevPricePerShare}</td>
                          <td className="val-cell">{detailInfo.prevMarketCap}</td>
                        </tr>
                        <tr className="diff-row">
                          <td className="row-type-label">증감 (변동)</td>
                          <td>—</td>
                          <td>—</td>
                          <td>—</td>
                          <td className={isPriceUp ? 'diff-up' : 'diff-down'}>{diffPriceStr}</td>
                          <td className={`highlight-text ${isCapUp ? 'diff-up' : 'diff-down'}`}>{diffCapStr}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 최하단: 핵심 지표 4장 카드 */}
                <div className="sh-detail-stats-row">
                  <div className="sh-stat-card">
                    <div className="sh-stat-icon-wrap"><Users size={18} /></div>
                    <div className="sh-stat-info">
                      <span className="sh-stat-label">총 주주수</span>
                      <span className="sh-stat-val">{detailInfo.totalShCount}명</span>
                    </div>
                  </div>
                  <div className="sh-stat-card">
                    <div className="sh-stat-icon-wrap"><Building size={18} /></div>
                    <div className="sh-stat-info">
                      <span className="sh-stat-label">법인</span>
                      <span className="sh-stat-val">{detailInfo.corpShCount}</span>
                    </div>
                  </div>
                  <div className="sh-stat-card">
                    <div className="sh-stat-icon-wrap"><User size={18} /></div>
                    <div className="sh-stat-info">
                      <span className="sh-stat-label">개인</span>
                      <span className="sh-stat-val">{detailInfo.indShCount}</span>
                    </div>
                  </div>
                  <div className="sh-stat-card">
                    <div className="sh-stat-icon-wrap"><PieChart size={18} /></div>
                    <div className="sh-stat-info">
                      <span className="sh-stat-label">1인당 평균 보유지분율</span>
                      <span className="sh-stat-val">{detailInfo.avgPct}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

        </div>
      </div>
      {showChangeModal && (
        <div className="sh-change-modal-overlay" onClick={() => setShowChangeModal(false)}>
          <div className="sh-change-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sh-change-modal-header">
              <div className="sh-change-modal-title">
                <TrendingUp size={18} />
                <span>주주 변동 사항 내역 (최근 1개년 예시)</span>
              </div>
              <button className="sh-change-modal-close" onClick={() => setShowChangeModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="sh-change-modal-body">
              <table className="sh-change-table">
                <thead>
                  <tr>
                    <th>변동일자</th>
                    <th>주주명</th>
                    <th>변동유형</th>
                    <th>변동 주식수</th>
                    <th>변동 후 지분율</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2025.04.12</td>
                    <td>홍길동</td>
                    <td><span className="sh-badge-type decrease">주식양도</span></td>
                    <td className="negative">-10,000주</td>
                    <td>3.1% <span className="diff-down">(▼2.1%)</span></td>
                    <td>특수관계인 간 양도</td>
                  </tr>
                  <tr>
                    <td>2025.10.18</td>
                    <td>(주)한맥기술</td>
                    <td><span className="sh-badge-type increase">유상증자</span></td>
                    <td className="positive">+50,000주</td>
                    <td>22.5% <span className="diff-up">(▲7.5%)</span></td>
                    <td>제3자배정 증자 참여</td>
                  </tr>
                  <tr>
                    <td>2026.02.05</td>
                    <td>김철수</td>
                    <td><span className="sh-badge-type increase">장내매수</span></td>
                    <td className="positive">+5,000주</td>
                    <td>1.2% <span className="diff-up">(▲1.2%)</span></td>
                    <td>단순 투자 목적 취득</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamOverlay;
