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
      { name: '주주1',      type: '개인', pct: '30.7%' },
      { name: '주주2',      type: '개인', pct: '10.0%' },
      { name: '주주3',      type: '개인', pct: '6.0%' },
      { name: '피티씨',         type: '법인', pct:  '9.9%', nodeId: 'ptc' },
      { name: '장헌파트너스',   type: '법인', pct:  '9.8%', nodeId: 'jp' },
      { name: '바론',           type: '법인', pct:  '8.7%', nodeId: 'baron' },
      { name: '기타',           type: '개인', pct: '24.9%' },
    ],
  },
  {
    nodeId: 'saman', name: '삼안', k: 'amber',
    shareholders: [
      { name: '장헌파트너스',   type: '법인', pct: '65.4%', nodeId: 'jp' },
      { name: '한맥기술',       type: '법인', pct: '25.2%', nodeId: 'hanmaek' },
      { name: '주주1',      type: '개인', pct:  '4.0%' },
      { name: '바론',           type: '법인', pct:  '2.4%', nodeId: 'baron' },
      { name: '기타',           type: '개인', pct:  '3.0%' },
    ],
  },
  {
    nodeId: 'jp', name: '장헌파트너스', k: 'sky',
    shareholders: [
      { name: '주주1',      type: '개인', pct: '35.3%' },
      { name: '주주2',      type: '개인', pct: '10.0%' },
      { name: '주주3',      type: '개인', pct: '5.0%' },
      { name: '바론',           type: '법인', pct:  '9.6%', nodeId: 'baron' },
      { name: '한맥기술',       type: '법인', pct:  '9.6%', nodeId: 'hanmaek' },
      { name: '피티씨',         type: '법인', pct:  '9.7%', nodeId: 'ptc' },
      { name: '기타',           type: '개인', pct: '20.8%' },
    ],
  },
  {
    nodeId: 'jhind', name: '장헌산업', k: 'sky',
    shareholders: [
      { name: '장헌파트너스',   type: '법인', pct: '51.0%', nodeId: 'jp' },
      { name: '주주1',      type: '개인', pct: '20.0%' },
      { name: '주주2',      type: '개인', pct: '15.0%' },
      { name: '주주3',      type: '개인', pct: '9.0%' },
      { name: '기타',           type: '개인', pct:  '5.0%' },
    ],
  },
  {
    nodeId: 'jh', name: '장헌', k: 'sky',
    shareholders: [
      { name: '피티씨',         type: '법인', pct: '60.0%', nodeId: 'ptc' },
      { name: '주주1',      type: '개인', pct: '22.0%' },
      { name: '주주2',      type: '개인', pct: '12.0%' },
      { name: '주주3',      type: '개인', pct: '6.0%' },
    ],
  },
  {
    nodeId: 'ptc', name: '피티씨', k: 'purple',
    shareholders: [
      { name: '바론',           type: '법인', pct: '44.6%', nodeId: 'baron' },
      { name: '주주1',      type: '개인', pct: '22.0%' },
      { name: '주주2',      type: '개인', pct: '16.1%' },
      { name: '주주3',      type: '개인', pct: '4.5%' },
      { name: '한맥기술',       type: '법인', pct:  '9.8%', nodeId: 'hanmaek' },
      { name: '기타',           type: '개인', pct:  '3.0%' },
    ],
  },
  {
    nodeId: 'baron', name: '바론', k: 'navy',
    shareholders: [
      { name: '주주1',      type: '개인', pct: '45.0%' },
      { name: '주주2',      type: '개인', pct: '28.0%' },
      { name: '주주3',      type: '개인', pct: '9.0%' },
      { name: '주주4',      type: '개인', pct: '15.0%' },
      { name: '기타',           type: '개인', pct:  '3.0%' },
    ],
  },
  {
    nodeId: 'halla', name: '한라', k: 'non',
    shareholders: [
      { name: '삼안',           type: '법인', pct: '50.2%', nodeId: 'saman' },
      { name: '주주1',      type: '개인', pct: '20.0%' },
      { name: '주주2',      type: '개인', pct: '12.0%' },
      { name: '주주3',      type: '개인', pct: '5.0%' },
      { name: '한맥기술',       type: '법인', pct:  '9.8%', nodeId: 'hanmaek' },
      { name: '기타',           type: '개인', pct:  '3.0%' },
    ],
  },
  {
    nodeId: 'sanha', name: '산하종합기술', k: 'non',
    shareholders: [
      { name: '한맥기술',       type: '법인', pct: '50.0%', nodeId: 'hanmaek' },
      { name: '주주1',      type: '개인', pct: '20.0%' },
      { name: '주주2',      type: '개인', pct: '15.0%' },
      { name: '주주3',      type: '개인', pct: '10.0%' },
      { name: '기타',           type: '개인', pct:  '5.0%' },
    ],
  },
  {
    nodeId: 'hyunta', name: '현타', k: 'black',
    shareholders: [
      { name: '주주1',      type: '개인', pct: '35.0%' },
      { name: '주주2',      type: '개인', pct: '30.0%' },
      { name: '주주3',      type: '개인', pct: '20.0%' },
      { name: '주주4',      type: '개인', pct: '15.0%' },
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
  baron: {
    estDate: '2010.05.20', industry: '경영컨설팅업', ceo: '홍대표', employees: '5명', firmType: '비외감기업',
    marketCap: '850,000 백만원', prevMarketCap: '720,000 백만원',
    pricePerShare: '17,000원', prevPricePerShare: '14,400원',
    totalSharesNum: '50,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '20.0%', prevDiscountRate: '20.0%',
    evalMethod: '상증세법',
    totalShCount: 5, corpShCount: '1 명 (20.0%)', indShCount: '4 명 (80.0%)', avgPct: '20.0%',
    bizType: 'IT Business'
  },
  ptc: {
    estDate: '2015.08.12', industry: '전기전자 제조업', ceo: '이이사', employees: '42명', firmType: '비외감기업',
    marketCap: '980,000 백만원', prevMarketCap: '860,000 백만원',
    pricePerShare: '9,800원', prevPricePerShare: '8,600원',
    totalSharesNum: '100,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '25.0%', prevDiscountRate: '25.0%',
    evalMethod: 'DCF',
    totalShCount: 6, corpShCount: '3 명 (50.0%)', indShCount: '3 명 (50.0%)', avgPct: '16.7%',
    bizType: 'Environment EPC & Plant'
  },
  hanmaek: {
    estDate: '2005.03.15', industry: '정보통신업', ceo: '김한맥', employees: '28명', firmType: '외감기업',
    marketCap: '1,250,000 백만원', prevMarketCap: '1,014,692 백만원',
    pricePerShare: '6,377원', prevPricePerShare: '5,177원',
    totalSharesNum: '196,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '25.0%', prevDiscountRate: '25.0%',
    evalMethod: 'DCF',
    totalShCount: 28, corpShCount: '10 명 (35.7%)', indShCount: '18 명 (64.3%)', avgPct: '7.0%',
    bizType: 'ENG. Business'
  },
  jp: {
    estDate: '2018.11.02', industry: '금융지원 서비스업', ceo: '박장헌', employees: '12명', firmType: '외감기업',
    marketCap: '760,000 백만원', prevMarketCap: '640,000 백만원',
    pricePerShare: '15,200원', prevPricePerShare: '12,800원',
    totalSharesNum: '50,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '25.0%', prevDiscountRate: '25.0%',
    evalMethod: 'DCF',
    totalShCount: 7, corpShCount: '4 명 (57.1%)', indShCount: '3 명 (42.9%)', avgPct: '14.3%',
    bizType: 'IT Business'
  },
  open: {
    estDate: '2021.01.25', industry: '소프트웨어 개발업', ceo: '최오픈', employees: '8명', firmType: '비외감기업',
    marketCap: '320,000 백만원', prevMarketCap: '280,000 백만원',
    pricePerShare: '32,000원', prevPricePerShare: '28,000원',
    totalSharesNum: '10,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '30.0%', prevDiscountRate: '30.0%',
    evalMethod: '상증세법',
    totalShCount: 4, corpShCount: '2 명 (50.0%)', indShCount: '2 명 (50.0%)', avgPct: '25.0%',
    bizType: 'IT Business'
  },
  saman: {
    estDate: '1998.04.09', industry: '종합엔지니어링', ceo: '삼안대표', employees: '150명', firmType: '외감기업',
    marketCap: '2,400,000 백만원', prevMarketCap: '2,100,000 백만원',
    pricePerShare: '12,000원', prevPricePerShare: '10,500원',
    totalSharesNum: '200,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '20.0%', prevDiscountRate: '20.0%',
    evalMethod: 'DCF',
    totalShCount: 5, corpShCount: '3 명 (60.0%)', indShCount: '2 명 (40.0%)', avgPct: '20.0%',
    bizType: 'ENG. Business'
  },
  jhind: {
    estDate: '2019.07.15', industry: '부동산 개발 및 임대업', ceo: '임장헌', employees: '15명', firmType: '외감기업',
    marketCap: '640,000 백만원', prevMarketCap: '550,000 백만원',
    pricePerShare: '8,000원', prevPricePerShare: '6,875원',
    totalSharesNum: '80,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '25.0%', prevDiscountRate: '25.0%',
    evalMethod: 'DCF',
    totalShCount: 5, corpShCount: '2 명 (40.0%)', indShCount: '3 명 (60.0%)', avgPct: '20.0%',
    bizType: 'IT Business'
  },
  halla: {
    estDate: '2002.10.30', industry: '건설 및 토목공업', ceo: '한라대표', employees: '85명', firmType: '외감기업',
    marketCap: '1,500,000 백만원', prevMarketCap: '1,320,000 백만원',
    pricePerShare: '10,000원', prevPricePerShare: '8,800원',
    totalSharesNum: '150,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '22.0%', prevDiscountRate: '22.0%',
    evalMethod: 'DCF',
    totalShCount: 6, corpShCount: '3 명 (50.0%)', indShCount: '3 명 (50.0%)', avgPct: '16.7%',
    bizType: 'Manufacture & Construction'
  },
  jh: {
    estDate: '2020.09.01', industry: '투자자문업', ceo: '조장헌', employees: '6명', firmType: '비외감기업',
    marketCap: '450,000 백만원', prevMarketCap: '380,000 백만원',
    pricePerShare: '15,000원', prevPricePerShare: '12,666원',
    totalSharesNum: '30,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '25.0%', prevDiscountRate: '25.0%',
    evalMethod: '상증세법',
    totalShCount: 4, corpShCount: '2 명 (50.0%)', indShCount: '2 명 (50.0%)', avgPct: '25.0%',
    bizType: 'IT Business'
  },
  hyunta: {
    estDate: '2022.03.11', industry: '경영 컨설팅', ceo: '나대표', employees: '3명', firmType: '비외감기업',
    marketCap: '210,000 백만원', prevMarketCap: '180,000 백만원',
    pricePerShare: '10,500원', prevPricePerShare: '9,000원',
    totalSharesNum: '20,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '30.0%', prevDiscountRate: '30.0%',
    evalMethod: '상증세법',
    totalShCount: 4, corpShCount: '1 명 (25.0%)', indShCount: '3 명 (75.0%)', avgPct: '25.0%',
    bizType: 'IT Business'
  },
  sanha: {
    estDate: '2016.05.18', industry: '엔지니어링 서비스', ceo: '산하대표', employees: '34명', firmType: '비외감기업',
    marketCap: '580,000 백만원', prevMarketCap: '500,000 백만원',
    pricePerShare: '5,800원', prevPricePerShare: '5,000원',
    totalSharesNum: '100,000주',
    valuationDate: '2026.06.30', prevValuationDate: '2025.06.30',
    discountRate: '25.0%', prevDiscountRate: '25.0%',
    evalMethod: '상증세법',
    totalShCount: 4, corpShCount: '2 명 (50.0%)', indShCount: '2 명 (50.0%)', avgPct: '25.0%',
    bizType: 'ENG. Business'
  }
};

