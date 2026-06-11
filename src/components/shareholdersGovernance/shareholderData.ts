export type ShareholderType = '법인' | '개인';

export interface Shareholder {
  name: string;
  type: ShareholderType;
  pct: string;
  nodeId?: string;
}

export interface CompanyShareholders {
  nodeId: string;
  name: string;
  k: string;
}

export const SHAREHOLDER_DATA: (CompanyShareholders & { shareholders: Shareholder[] })[] = [
  {
    nodeId: 'hanmaek', name: '한맥기술', k: 'red',
    shareholders: [
      { name: '주주1',      type: '개인', pct: '40.73%' },
      { name: '한맥기술',    type: '법인', pct: '11.45%', nodeId: 'hanmaek' },
      { name: '피티씨',      type: '법인', pct: '9.86%', nodeId: 'ptc' },
      { name: '장헌파트너스',  type: '법인', pct: '9.81%', nodeId: 'jp' },
      { name: '바론',        type: '법인', pct: '8.67%', nodeId: 'baron' },
      { name: '주주2',      type: '개인', pct: '6.64%' },
      { name: '주주3',      type: '개인', pct: '5.31%' },
      { name: '주주4',      type: '개인', pct: '4.09%' },
      { name: '주주5',      type: '개인', pct: '3.44%' },
    ],
  },
  {
    nodeId: 'saman', name: '삼안', k: 'amber',
    shareholders: [
      { name: '장헌파트너스',  type: '법인', pct: '65.39%', nodeId: 'jp' },
      { name: '한맥기술',    type: '법인', pct: '25.21%', nodeId: 'hanmaek' },
      { name: '농협은행',    type: '법인', pct: '3.42%' },
      { name: '바론',        type: '법인', pct: '2.36%', nodeId: 'baron' },
      { name: '우리은행',    type: '법인', pct: '2.09%' },
      { name: '기업은행',    type: '법인', pct: '1.36%' },
      { name: '기타',        type: '개인', pct: '0.16%' },
    ],
  },
  {
    nodeId: 'jp', name: '장헌파트너스', k: 'sky',
    shareholders: [
      { name: '주주1',      type: '개인', pct: '45.32%' },
      { name: '피티씨',      type: '법인', pct: '9.73%', nodeId: 'ptc' },
      { name: '한맥기술',    type: '법인', pct: '9.60%', nodeId: 'hanmaek' },
      { name: '바론',        type: '법인', pct: '9.60%', nodeId: 'baron' },
      { name: '주주2',      type: '개인', pct: '7.47%' },
      { name: '주주3',      type: '개인', pct: '4.60%' },
      { name: '주주4',      type: '개인', pct: '3.88%' },
      { name: '주주5',      type: '개인', pct: '3.30%' },
      { name: '주주6',      type: '개인', pct: '2.45%' },
      { name: '주주7',      type: '개인', pct: '2.45%' },
      { name: '주주8',      type: '개인', pct: '1.60%' },
    ],
  },
  {
    nodeId: 'jhind', name: '장헌산업', k: 'sky',
    shareholders: [
      { name: '장헌파트너스',  type: '법인', pct: '100.00%', nodeId: 'jp' },
    ],
  },
  {
    nodeId: 'jh', name: '장헌', k: 'sky',
    shareholders: [
      { name: '피티씨',      type: '법인', pct: '100.00%', nodeId: 'ptc' },
    ],
  },
  {
    nodeId: 'ptc', name: '피티씨', k: 'purple',
    shareholders: [
      { name: '바론',        type: '법인', pct: '44.55%', nodeId: 'baron' },
      { name: '주주1',      type: '개인', pct: '38.10%' },
      { name: '한맥기술',    type: '법인', pct: '9.80%', nodeId: 'hanmaek' },
      { name: '주주2',      type: '개인', pct: '4.10%' },
      { name: '주주3',      type: '개인', pct: '3.45%' },
    ],
  },
  {
    nodeId: 'baron', name: '바론', k: 'navy',
    shareholders: [
      { name: '주주1',      type: '개인', pct: '70.00%' },
      { name: '주주2',      type: '개인', pct: '30.00%' },
    ],
  },
  {
    nodeId: 'halla', name: '한라', k: 'non',
    shareholders: [
      { name: '삼안',        type: '법인', pct: '90.23%', nodeId: 'saman' },
      { name: '한맥기술',    type: '법인', pct: '9.77%', nodeId: 'hanmaek' },
    ],
  },
  {
    nodeId: 'sanha', name: '산하종합기술', k: 'non',
    shareholders: [
      { name: '주주1',      type: '개인', pct: '43.30%' },
      { name: '주주2',      type: '개인', pct: '38.70%' },
      { name: '주주3',      type: '개인', pct: '6.00%' },
      { name: '주주4',      type: '개인', pct: '4.00%' },
      { name: '주주5',      type: '개인', pct: '4.00%' },
      { name: '주주6',      type: '개인', pct: '4.00%' },
    ],
  },
  {
    nodeId: 'hyunta', name: '현타', k: 'black',
    shareholders: [
      { name: '주주1',      type: '개인', pct: '100.00%' },
    ],
  },
];

export interface CompanyDetailInfo {
  estDate: string;
  industry: string;
  ceo: string;
  employees: string;
  firmType: string;
  marketCap: string;
  prevMarketCap: string;
  pricePerShare: string;
  prevPricePerShare: string;
  totalSharesNum: string;
  valuationDate: string;
  prevValuationDate: string;
  discountRate: string;
  prevDiscountRate: string;
  evalMethod: string;
  totalShCount: number;
  corpShCount: string;
  indShCount: string;
  avgPct: string;
  bizType: string;
}

export const COMPANY_DETAILS_MAP: Record<string, CompanyDetailInfo> = {
  hanmaek: {
    estDate: '1996-05-03', industry: '토목엔지니어링', ceo: '이경훈', employees: '393명', firmType: '외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '56,638 백만원',
    pricePerShare: '(평가 예정)', prevPricePerShare: '288,967원',
    totalSharesNum: '196,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '25.0%',
    evalMethod: '(평가 예정)',
    totalShCount: 9, corpShCount: '4명 (44.4%)', indShCount: '5명 (55.6%)', avgPct: '11.1%',
    bizType: 'ENG. Business'
  },
  saman: {
    estDate: '1967-12-30', industry: '토목엔지니어링', ceo: '최동식', employees: '1,976명', firmType: '외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '127,125 백만원',
    pricePerShare: '(평가 예정)', prevPricePerShare: '212,304원',
    totalSharesNum: '598,789주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '20.0%',
    evalMethod: '(평가 예정)',
    totalShCount: 7, corpShCount: '6명 (85.7%)', indShCount: '1명 (14.3%)', avgPct: '14.3%',
    bizType: 'ENG. Business'
  },
  jp: {
    estDate: '2009-11-20', industry: '토목시공', ceo: '배문교', employees: '(작성예정)', firmType: '외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '46,221 백만원',
    pricePerShare: '(평가 예정)', prevPricePerShare: '177,774원',
    totalSharesNum: '260,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '25.0%',
    evalMethod: '(평가 예정)',
    totalShCount: 11, corpShCount: '3명 (27.3%)', indShCount: '8명 (72.7%)', avgPct: '9.1%',
    bizType: 'Manufacture & Construction'
  },
  jhind: {
    estDate: '(작성예정)', industry: '제조', ceo: '(작성예정)', employees: '(작성예정)', firmType: '외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '평가 전',
    pricePerShare: '(평가 예정)', prevPricePerShare: '평가 전',
    totalSharesNum: '260,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '—',
    evalMethod: '(평가 예정)',
    totalShCount: 1, corpShCount: '1명 (100.0%)', indShCount: '0명 (0.0%)', avgPct: '100.0%',
    bizType: 'IT Business'
  },
  jh: {
    estDate: '2009-11-16', industry: '토목시공', ceo: '안병록', employees: '(작성예정)', firmType: '비외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '평가 전',
    pricePerShare: '(평가 예정)', prevPricePerShare: '평가 전',
    totalSharesNum: '190,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '—',
    evalMethod: '(평가 예정)',
    totalShCount: 1, corpShCount: '1명 (100.0%)', indShCount: '0명 (0.0%)', avgPct: '100.0%',
    bizType: 'Manufacture & Construction'
  },
  ptc: {
    estDate: '(작성예정)', industry: '토목시공', ceo: '(작성예정)', employees: '26명', firmType: '비외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '3,681 백만원',
    pricePerShare: '(평가 예정)', prevPricePerShare: '122,707원',
    totalSharesNum: '30,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '25.0%',
    evalMethod: '(평가 예정)',
    totalShCount: 5, corpShCount: '2명 (40.0%)', indShCount: '3명 (60.0%)', avgPct: '20.0%',
    bizType: 'Manufacture & Construction'
  },
  baron: {
    estDate: '2006-06-21', industry: '토목소프트웨어 개발, 공급', ceo: '장종찬', employees: '182명', firmType: '비외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '304 백만원',
    pricePerShare: '(평가 예정)', prevPricePerShare: '15,178원',
    totalSharesNum: '20,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '20.0%',
    evalMethod: '(평가 예정)',
    totalShCount: 2, corpShCount: '0명 (0.0%)', indShCount: '2명 (100.0%)', avgPct: '50.0%',
    bizType: 'IT Business'
  },
  halla: {
    estDate: '1999-04-09', industry: '전기·설비·환경·플랜트', ceo: '김원근,최영수', employees: '222명', firmType: '외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '13,261 백만원',
    pricePerShare: '(평가 예정)', prevPricePerShare: '1,010원',
    totalSharesNum: '13,130,120주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '22.0%',
    evalMethod: '(평가 예정)',
    totalShCount: 2, corpShCount: '2명 (100.0%)', indShCount: '0명 (0.0%)', avgPct: '50.0%',
    bizType: 'Environment EPC & Plant'
  },
  sanha: {
    estDate: '(작성예정)', industry: '(작성예정)', ceo: '(작성예정)', employees: '(작성예정)', firmType: '비외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '평가 전',
    pricePerShare: '(평가 예정)', prevPricePerShare: '평가 전',
    totalSharesNum: '100,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '—',
    evalMethod: '(평가 예정)',
    totalShCount: 6, corpShCount: '0명 (0.0%)', indShCount: '6명 (100.0%)', avgPct: '16.7%',
    bizType: '(작성예정)'
  },
  hyunta: {
    estDate: '(작성예정)', industry: '(작성예정)', ceo: '(작성예정)', employees: '(작성예정)', firmType: '비외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '평가 전',
    pricePerShare: '(평가 예정)', prevPricePerShare: '평가 전',
    totalSharesNum: '60,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '—',
    evalMethod: '(평가 예정)',
    totalShCount: 1, corpShCount: '0명 (0.0%)', indShCount: '1명 (100.0%)', avgPct: '100.0%',
    bizType: '(작성예정)'
  },
  open: {
    estDate: '2021-01-25', industry: '소프트웨어 개발업', ceo: '(작성예정)', employees: '(작성예정)', firmType: '비외감기업',
    marketCap: '(평가 예정)', prevMarketCap: '평가 전',
    pricePerShare: '(평가 예정)', prevPricePerShare: '평가 전',
    totalSharesNum: '10,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.12.31',
    discountRate: '(평가 예정)', prevDiscountRate: '—',
    evalMethod: '(평가 예정)',
    totalShCount: 2, corpShCount: '1명 (50.0%)', indShCount: '1명 (50.0%)', avgPct: '50.0%',
    bizType: 'IT Business'
  },
};
