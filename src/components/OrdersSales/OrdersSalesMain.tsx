import { useState, useEffect } from 'react'
import '../../styles/OrdersSales.css'
import logoHanmac from '../../assets/logo_hanmac.png'
import logoSaman from '../../assets/logo_saman.png'
import logoJangheon from '../../assets/logo_jangheon.png'
import logoJujangheon from '../../assets/logo_jujangheon.png'
import logoPtc from '../../assets/logo_ptc.png'
import logoHalla from '../../assets/logo_halla.png'
import logoBaron from '../../assets/logo_baron.png'

interface CompanyData {
  name: string
  division: string
  logoType: 'hanmac' | 'saman' | 'jangheon-ind' | 'jangheon-corp' | 'ptc' | 'halla' | 'baron'
  orders: {
    target: number
    actual: number
    rate: number
  }
  sales: {
    target: number
    actual: number
    rate: number
  }
}

function OrdersSalesMain() {
  const [animateProgress, setAnimateProgress] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Overall Group Metrics
  const groupMetrics = {
    orders: {
      rate: 77.8,
      actual: 11123.0,
      target: 14288.9
    },
    sales: {
      rate: 74.9,
      actual: 8862.7,
      target: 11835.1
    },
    perPersonOrders: 3.4,
    perPersonSales: 2.7,
    backlog: 2571.9
  }

  // Company-specific data from the image
  const companies: CompanyData[] = [
    {
      name: '한맥기술',
      division: 'ENG. Business',
      logoType: 'hanmac',
      orders: { target: 2532.1, actual: 2840.3, rate: 112.2 },
      sales: { target: 2122.0, actual: 2207.5, rate: 104.0 }
    },
    {
      name: '삼안',
      division: 'ENG. Business',
      logoType: 'saman',
      orders: { target: 2245.2, actual: 1821.8, rate: 81.1 },
      sales: { target: 1904.2, actual: 1533.3, rate: 80.5 }
    },
    {
      name: '장헌산업',
      division: 'Manufacture & Construction',
      logoType: 'jangheon-ind',
      orders: { target: 2070.6, actual: 1259.1, rate: 60.8 },
      sales: { target: 1705.0, actual: 1010.7, rate: 59.3 }
    },
    {
      name: '(주)장헌',
      division: 'Manufacture & Construction',
      logoType: 'jangheon-corp',
      orders: { target: 1850.8, actual: 1933.4, rate: 104.5 },
      sales: { target: 1550.4, actual: 1142.1, rate: 73.7 }
    },
    {
      name: '피티씨',
      division: 'Manufacture & Construction',
      logoType: 'ptc',
      orders: { target: 1715.1, actual: 940.2, rate: 54.8 },
      sales: { target: 1421.1, actual: 650.8, rate: 45.8 }
    },
    {
      name: '한라산업개발',
      division: 'Environment EPC & Plant',
      logoType: 'halla',
      orders: { target: 1504.4, actual: 608.1, rate: 40.4 },
      sales: { target: 1209.9, actual: 517.3, rate: 42.8 }
    },
    {
      name: '바론컨설턴트',
      division: 'IT Business',
      logoType: 'baron',
      orders: { target: 2370.7, actual: 1720.1, rate: 72.6 },
      sales: { target: 1922.5, actual: 1801.0, rate: 93.7 }
    }
  ]

  // Render company logo mark based on logoType
  const renderLogoMark = (type: CompanyData['logoType']) => {
    switch (type) {
      case 'hanmac':
        return <img src={logoHanmac} alt="한맥기술" className="company-logo" />
      case 'saman':
        return <img src={logoSaman} alt="삼안" className="company-logo" />
      case 'jangheon-ind':
        return <img src={logoJangheon} alt="장헌산업" className="company-logo" />
      case 'jangheon-corp':
        return <img src={logoJujangheon} alt="(주)장헌" className="company-logo" />
      case 'ptc':
        return <img src={logoPtc} alt="피티씨" className="company-logo" />
      case 'halla':
        return <img src={logoHalla} alt="한라산업개발" className="company-logo" />
      case 'baron':
        return <img src={logoBaron} alt="바론컨설턴트" className="company-logo" />
      default:
        return null
    }
  }

  // Circular progress stroke calculation
  const getStrokeDash = (percentage: number, radius: number = 42) => {
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    return {
      strokeDasharray: `${circumference} ${circumference}`,
      strokeDashoffset
    }
  }

  // Helper to wrap numbers in <span className="num"> for letter-spacing: 0
  const formatNumbers = (text: string | number) => {
    const str = String(text);
    const parts = str.split(/([0-9.,]+)/g);
    return parts.map((part, i) => {
      if (/[0-9]/.test(part)) {
        return <span key={i} className="num">{part}</span>;
      }
      return part;
    });
  };

  const renderCompanyCard = (company: CompanyData, index: number) => (
    <div key={index} className="company-card">
      {/* Company Name Header */}
      <div className="company-card-header">
        {renderLogoMark(company.logoType)}
        <span className="company-name">{company.name}</span>
      </div>

      {/* Company Metrics */}
      <div className="company-metrics">
        {/* Orders Row */}
        <div className="metric-block orders-theme">
          <div className="block-title">수주</div>
          <div className="block-details">
            <div className="block-col">
              <span className="detail-label">목표/실적</span>
              <span className="detail-value">
                {formatNumbers(company.orders.target.toLocaleString())}{' '}/{' '}
                <strong className="actual-value">{formatNumbers(company.orders.actual.toLocaleString())}</strong>
                <span className="unit-small">억원</span>
              </span>
            </div>
            <div className="block-row">
              <span className="detail-label">달성률</span>
              <span className="detail-value">
                {formatNumbers(company.orders.rate)}<span className="unit-small">%</span>
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className={`progress-fill green-bar${company.orders.rate > 100 ? ' over' : ''}`}
                style={{ width: `${animateProgress ? Math.min(company.orders.rate, 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="block-line"></div>
        {/* Sales Row */}
        <div className="metric-block sales-theme">
          <div className="block-title">매출</div>
          <div className="block-details">
            <div className="block-col">
              <span className="detail-label">목표/실적</span>
              <span className="detail-value">
                {formatNumbers(company.sales.target.toLocaleString())}{' '}/{' '}
                <strong className="actual-value">{formatNumbers(company.sales.actual.toLocaleString())}</strong>
                <span className="unit-small">억원</span>
              </span>
            </div>
            <div className="block-row">
              <span className="detail-label">달성률</span>
              <span className="detail-value">
                {formatNumbers(company.sales.rate)}<span className="unit-small">%</span>
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className={`progress-fill brown-bar${company.sales.rate > 100 ? ' over' : ''}`}
                style={{ width: `${animateProgress ? Math.min(company.sales.rate, 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="mis-app">
      {/* Main Container */}
      <main className="mis-container">
        {/* Top Summaries Section */}
        <section className="summary-section">
          {/* Orders (수주) Summary */}
          <div className="summary-card orders-theme">
            <h2 className="summary-title">수주</h2>
            <div className="summary-content">
              <div className="circular-progress-wrapper">
                <svg className="circular-progress" width="160" height="160" viewBox="0 0 100 100">
                  <defs>
                    <mask id="green-mask">
                      <circle
                        className="circle-progress"
                        cx="50"
                        cy="50"
                        r="48"
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                        style={getStrokeDash(animateProgress ? groupMetrics.orders.rate : 0, 48)}
                      />
                    </mask>
                  </defs>
                  <circle className="circle-bg" cx="50" cy="50" r="48" />
                  <foreignObject x="0" y="0" width="100" height="100" mask="url(#green-mask)">
                    <div className="conic-fill green" />
                  </foreignObject>
                </svg>
                <div className="progress-label">
                  <span className="label-title">달성률</span>
                  <span className="label-value">
                    {formatNumbers(groupMetrics.orders.rate)}<span className="unit-small">%</span>
                  </span>
                </div>
              </div>

              <div className="summary-metrics">
                <div className="metric-block target">
                  <span className="metric-name">목표</span>
                  <span className="metric-val">
                    {formatNumbers(groupMetrics.orders.target.toLocaleString(undefined, { minimumFractionDigits: 1 }))}
                    <span className="unit-small">억원</span>
                  </span>
                </div>
                <div className="metric-block earning">
                  <span className="metric-name">실적</span>
                  <span className="metric-val">
                    {formatNumbers(groupMetrics.orders.actual.toLocaleString(undefined, { minimumFractionDigits: 1 }))}
                    <span className="unit-small">억원</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Analytics indicators */}
          <div className="summary-center">
            <div className="center-card orders-theme">
              <span className="center-title">인당 수주</span>
              <span className="center-value">
                {formatNumbers(groupMetrics.perPersonOrders)}
                <span className="unit-small">억원</span>
              </span>
            </div>
            <div className="center-divider"></div>
            <div className="center-card sales-theme">
              <span className="center-title">인당 매출</span>
              <span className="center-value">
                {formatNumbers(groupMetrics.perPersonSales)}
                <span className="unit-small">억원</span>
              </span>
            </div>
            <div className="center-card backlog-theme ">
              <span className="center-title">수주 잔고</span>
              <span className="center-value">
                {formatNumbers(groupMetrics.backlog.toLocaleString(undefined, { minimumFractionDigits: 1 }))}
                <span className="unit-small">억원</span>
              </span>
            </div>
          </div>

          {/* Sales (매출) Summary */}
          <div className="summary-card sales-theme">
            <h2 className="summary-title">매출</h2>
            <div className="summary-content flex-row-reverse">
              <div className="circular-progress-wrapper">
                <svg className="circular-progress" width="160" height="160" viewBox="0 0 100 100">
                  <defs>
                    <mask id="brown-mask">
                      <circle
                        className="circle-progress"
                        cx="50"
                        cy="50"
                        r="48"
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                        style={getStrokeDash(animateProgress ? groupMetrics.sales.rate : 0, 48)}
                      />
                    </mask>
                  </defs>
                  <circle className="circle-bg" cx="50" cy="50" r="48" />
                  <foreignObject x="0" y="0" width="100" height="100" mask="url(#brown-mask)">
                    <div className="conic-fill brown" />
                  </foreignObject>
                </svg>
                <div className="progress-label">
                  <span className="label-title">달성률</span>
                  <span className="label-value">
                    {formatNumbers(groupMetrics.sales.rate)}<span className="unit-small">%</span>
                  </span>
                </div>
              </div>

              <div className="summary-metrics">
                <div className="metric-block target">
                  <span className="metric-name">목표</span>
                  <span className="metric-val">
                    {formatNumbers(groupMetrics.sales.target.toLocaleString(undefined, { minimumFractionDigits: 1 }))}
                    <span className="unit-small">억원</span>
                  </span>
                </div>
                <div className="metric-block earning">
                  <span className="metric-name">실적</span>
                  <span className="metric-val">
                    {formatNumbers(groupMetrics.sales.actual.toLocaleString(undefined, { minimumFractionDigits: 1 }))}
                    <span className="unit-small">억원</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Division Grid Section */}
        <section className="division-grid-container">
          {/* ENG. Business */}
          <div className="division-col eng">
            <div className="div-header-cell">ENG. Business</div>
            <div className="division-cards cols-2">
              {companies.filter(c => c.division === 'ENG. Business').map(renderCompanyCard)}
            </div>
          </div>

          {/* Manufacture & Construction */}
          <div className="division-col manu">
            <div className="div-header-cell">Manufacture & Construction</div>
            <div className="division-cards cols-3">
              {companies.filter(c => c.division === 'Manufacture & Construction').map(renderCompanyCard)}
            </div>
          </div>

          {/* Environment EPC & Plant */}
          <div className="division-col envi">
            <div className="div-header-cell">Environment EPC & Plant</div>
            <div className="division-cards cols-1">
              {companies.filter(c => c.division === 'Environment EPC & Plant').map(renderCompanyCard)}
            </div>
          </div>

          {/* IT Business */}
          <div className="division-col it">
            <div className="div-header-cell">IT Business</div>
            <div className="division-cards cols-1">
              {companies.filter(c => c.division === 'IT Business').map(renderCompanyCard)}
            </div>
          </div>
        </section>

        {/* Footer Insights Section */}
        <section className="insights-section">
          {/* Key Notifications */}
          <div className="insight-panel-card">
            <h3 className="panel-card-title">주요 알림</h3>
            <ul className="notif-list">
              <li className="notif-item">
                <span className="dot red-dot"></span>
                <span className="notif-text">한라산업개발 매출 목표 달성률 <strong className="text-danger">{formatNumbers('40.4%')}</strong></span>
              </li>
              <li className="notif-item">
                <span className="dot orange-dot"></span>
                <span className="notif-text">가족사 매출 목표 달성률 <strong className="text-warning">{formatNumbers('74.9%')}</strong></span>
              </li>
              <li className="notif-item">
                <span className="dot green-dot"></span>
                <span className="notif-text">바론컨설턴트 매출 목표 달성률 <strong>{formatNumbers('93.7%')}</strong></span>
              </li>
              <li className="notif-item">
                <span className="dot green-dot"></span>
                <span className="notif-text">한맥기술 수주 목표 달성률 <strong>{formatNumbers('112.2%')}</strong></span>
              </li>
            </ul>
          </div>

          {/* Group Key Insights */}
          <div className="insight-panel-card span-group-insights">
            <h3 className="panel-card-title">그룹 주요 인사이트</h3>
            <div className="insights-grid">
              <div className="insight-item-box">
                <div className="insight-box-title">토목 설계 업계 순위</div>
                <div className="insight-box-big-text">
                  Top 5<span className="small-text">(엔지니어링 기준)</span>
                </div>
                <div className="insight-box-desc">
                  삼안 5위 (<strong className="color-up">▲1</strong>) 한맥 25위 (<strong className="color-down">▼2</strong>)
                </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-item-box">
                <div className="insight-box-title">국내 프로젝트</div>
                <div className="insight-box-big-text">
                  124<span className="unit-small">건</span>
                </div>
                <div className="insight-box-desc">
                  설계 <strong>20</strong>건 / 감리 <strong>24</strong>건 / 시공 <strong>50</strong>건
                </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-item-box">
                <div className="insight-box-title">해외 프로젝트</div>
                <div className="insight-box-big-text">
                  42<span className="unit-small">건</span>
                </div>
                <div className="insight-box-desc">
                  신규 수주 <strong className="color-flat">-</strong>건
                </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-item-box">
                <div className="insight-box-title">해외지사</div>
                <div className="insight-box-big-text font-split">
                  12<span className="unit-small">개국</span> 18<span className="unit-small">개소</span>
                </div>
                <div className="insight-box-desc">
                  (동남아, 중동, 북미 등)
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Comments */}
          <div className="insight-panel-card">
            <h3 className="panel-card-title">전략 코멘트</h3>
            <ul className="comment-list">
              <li className="comment-item">
                {formatNumbers('상반기 그룹 수주 실적은 목표 대비 77%로 양호')}
              </li>
              <li className="comment-item">
                {formatNumbers('매출은 74% 수준으로 일부 계열사의 프로젝트 매출 인식이 지연')}
              </li>
              <li className="comment-item">
                {formatNumbers('하반기에는 해외사업 확대와 저성과 계열사 집중 관리가 필요')}
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

export default OrdersSalesMain
