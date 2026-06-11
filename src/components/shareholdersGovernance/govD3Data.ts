const BASE = import.meta.env.BASE_URL;

// ─── 스타일 타입 / 색상 ──────────────────────────
export interface GovD3Style {
  fill: string; stroke: string; sw: number; dash: string | null;
}

export const GOV_D3_STYLE: Record<string, GovD3Style> = {
  navy:    { fill: '#ffffff', stroke: '#2b3f87', sw: 2.2, dash: null },
  purple:  { fill: '#ffffff', stroke: '#6a3d9a', sw: 2.2, dash: null },
  sky:     { fill: '#ffffff', stroke: '#5aa7d6', sw: 2.2, dash: null },
  skydash: { fill: '#ffffff', stroke: '#5aa7d6', sw: 2.2, dash: '8 5' },
  black:   { fill: '#ffffff', stroke: '#1f1f1f', sw: 2.2, dash: null },
  non:     { fill: '#ffffff', stroke: '#a8a795', sw: 2.0, dash: null },
  red:     { fill: '#ffffff', stroke: '#c0392b', sw: 2.2, dash: null },
  amber:   { fill: '#ffffff', stroke: '#e08c1a', sw: 2.2, dash: null },
  del:     { fill: '#fef2f2', stroke: '#dca0a0', sw: 2.0, dash: null },
  slot:    { fill: 'none',    stroke: '#a07f1f', sw: 2.0, dash: '8 5' },
  note:    { fill: '#ffffff', stroke: '#a07f1f', sw: 2.2, dash: '8 5' },
  top:     { fill: '#ffffff', stroke: '#1a1a1a', sw: 2.2, dash: null },
  sh_baron: { fill: '#ffffff', stroke: '#8a8f9a',              sw: 2.2, dash: null },
  sh_child: { fill: '#ffffff', stroke: '#4273ae',              sw: 2.2, dash: null },
  sh_jp:    { fill: '#ffffff', stroke: 'rgba(66,115,174,0.8)', sw: 2.2, dash: null },
};

export const GOV_D3_COLORS: Record<string, string> = {
  navy:   '#2b3f87',
  purple: '#6a3d9a',
  red:    '#c0392b',
  steel:  '#5b87a8',
  orange: '#e08c1a',
  note:   '#a07f1f',
  del:    '#d8434f',
  gray:   '#8a8f9a',
  black:  '#1a1a1a',
};

// ─── 데이터 타입 ─────────────────────────────────
export interface GovD3Node {
  id: string; name: string; sub: string; k: string;
  x: number; y: number; w: number; h: number;
  memo?: string;
  logo?: string; lar?: number; lscale?: number;
  hide?: boolean;
}

export interface GovD3Link {
  s: string; t: string; pct: string; c: string;
  d: string; lx: number; ly: number; dash?: string;
  hide?: boolean; noArrow?: boolean;
}

export interface GovD3Annot {
  x: number; y: number; w: number; h: number;
  badge: string; bw: number;
}

export interface GovD3JunctionArrow {
  x: number; y: number; c: string;
}

export interface GovD3Dataset {
  title: string; titleNote: string;
  badge: string; badgeWarn: boolean;
  nodes: GovD3Node[]; links: GovD3Link[]; annots: GovD3Annot[];
  junctionArrows?: GovD3JunctionArrow[];
}

// ─── 지배구조 현황 ───────────────────────────────
export const GOV_D3_CURRENT: GovD3Dataset = {
  title: '지배구조 — 현황', titleNote: '선 색 = 출자 주체 기준',
  badge: '상호출자 4건 · 비외감 5개사', badgeWarn: false,
  nodes: [
    { id: 'baron',   name: '바론',         sub: '비외감기업', k: 'navy',   x: 470, y: 40,  w: 185, h: 78, logo: `${BASE}images/logo/Baron.svg`,    lar: 1.674 },
    { id: 'ptc',     name: '피티씨',       sub: '비외감기업', k: 'purple', x: 57,  y: 200, w: 193, h: 83, logo: `${BASE}images/logo/PTC.svg`,      lar: 1.0 },
    { id: 'hanmaek', name: '한맥기술',     sub: '외감기업',   k: 'red',    x: 385, y: 200, w: 190, h: 83, logo: `${BASE}images/logo/Hanmac.svg`,   lar: 1.647, lscale: 0.67 },
    { id: 'jp',      name: '장헌파트너스', sub: '외감기업',   k: 'sky',    x: 652, y: 200, w: 193, h: 85, logo: `${BASE}images/logo/Jangheon.svg`, lar: 2.0 },
    { id: 'open',    name: 'OPEN END',    sub: '비외감기업', k: 'non',    x: 920, y: 200, w: 195, h: 83, logo: `${BASE}images/logo/open_end.png`, lar: 1.5 },
    { id: 'saman',   name: '삼안',         sub: '외감기업',   k: 'amber',  x: 655, y: 375, w: 190, h: 85, logo: `${BASE}images/logo/Saman.svg`,    lar: 1.0 },
    { id: 'jhind',   name: '장헌산업',     sub: '외감기업',   k: 'sky',    x: 920, y: 375, w: 195, h: 84, logo: `${BASE}images/logo/Jangheon.svg`, lar: 2.0 },
    { id: 'halla',   name: '한라',         sub: '외감기업',   k: 'non',    x: 653, y: 550, w: 195, h: 83, logo: `${BASE}images/logo/Halla.svg`,    lar: 3.803, lscale: 0.5 },
    { id: 'jh',      name: '장헌',         sub: '비외감기업', k: 'sky',    x: 57,  y: 375, w: 193, h: 85, logo: `${BASE}images/logo/jangheon_1.svg`, lar: 1.0 },
    { id: 'hyunta',  name: '현타',         sub: '비외감기업', k: 'black',  x: 57,  y: 550, w: 193, h: 83 },
    { id: 'sanha',   name: '산하종합기술', sub: '비외감기업', k: 'black',  x: 265, y: 550, w: 193, h: 83, logo: `${BASE}images/logo/shtnc.png`, lar: 1.0 },
  ],
  links: [
    { s: 'baron',   t: 'ptc',    pct: '44.55%', c: 'navy',   d: 'M562 118 V160 H153 V200', lx: 165, ly: 178 },
    { s: 'baron',   t: 'hanmaek',pct: '8.67%',  c: 'navy',   d: 'M562 118 V160 H480 V200', lx: 490, ly: 178 },
    { s: 'baron',   t: 'jp',     pct: '9.60%',  c: 'navy',   d: 'M562 118 V160 H748 V200', lx: 758, ly: 178 },
    { s: 'baron',   t: 'saman',  pct: '2.36%',  c: 'navy',   d: 'M655 79 H885 V418 H845',  lx: 895, ly: 320 },
    { s: 'ptc',     t: 'hanmaek',pct: '9.86%',  c: 'purple', d: 'M250 241 H385',            lx: 310, ly: 231 },
    { s: 'hanmaek', t: 'ptc',    pct: '9.80%',  c: 'red',    d: 'M385 256 H250',            lx: 275, ly: 276 },
    { s: 'jp',      t: 'hanmaek',pct: '9.81%',  c: 'steel',  d: 'M652 232 H575',            lx: 595, ly: 222 },
    { s: 'hanmaek', t: 'jp',     pct: '9.60%',  c: 'red',    d: 'M575 256 H652',            lx: 585, ly: 272 },
    { s: 'jp',      t: 'saman',  pct: '65.39%', c: 'steel',  d: 'M748 285 V375',            lx: 760, ly: 335 },
    { s: 'ptc',     t: 'jp',     pct: '9.73%',  c: 'purple', d: 'M153 283 V310 H670 V285',  lx: 585, ly: 335 },
    { s: 'hanmaek', t: 'saman',  pct: '25.21%', c: 'red',    d: 'M480 283 V417 H655',       lx: 580, ly: 437 },
    { s: 'saman',   t: 'halla',  pct: '90.23%', c: 'orange', d: 'M750 460 V550',            lx: 760, ly: 505 },
    { s: 'hanmaek', t: 'halla',  pct: '9.77%',  c: 'red',    d: 'M480 283 V591 H653',       lx: 490, ly: 512 },
    { s: 'baron',   t: 'open',   pct: '80.0%', c: 'navy',   d: 'M562 118 V160 H1017 V200', lx: 1025, ly: 178 },
    { s: 'open',    t: 'jhind',  pct: '100.0%',  c: 'gray',   d: 'M1018 283 V375',           lx: 1034, ly: 332 },
    { s: 'ptc',     t: 'jh',     pct: '100.0%',  c: 'purple', d: 'M153 283 V375',            lx: 170, ly: 345 },
  ],
  annots: [],
  junctionArrows: [
    { x: 562, y: 160, c: 'navy' },
  ],
};

// ─── 지배구조 개선(案) ───────────────────────────
export const GOV_D3_PLAN: GovD3Dataset = {
  title: '지배구조 — 개선(案)', titleNote: '장헌 직속 편제 · 비외감 2개사 정리',
  badge: '검토 3건', badgeWarn: true,
  nodes: [
    { id: 'baron',   name: '바론',         sub: '비외감기업',      k: 'navy',    x: 470, y: 33,  w: 170, h: 70 },
    { id: 'ptc',     name: '피티씨',       sub: '비외감기업',      k: 'purple',  x: 57,  y: 168, w: 178, h: 75 },
    { id: 'hanmaek', name: '한맥기술',     sub: '외감기업',        k: 'red',     x: 330, y: 168, w: 175, h: 75 },
    { id: 'jp',      name: '장헌파트너스', sub: '외감기업',        k: 'sky',     x: 597, y: 168, w: 178, h: 77 },
    { id: 'open',    name: '오픈엔드',     sub: '비외감기업',      k: 'non',     x: 790, y: 168, w: 140, h: 75, logo: `${BASE}images/logo/open_end.png`, lar: 1.5 },
    { id: 'jh',      name: '장헌',         sub: '비외감기업',      k: 'skydash', x: 950, y: 168, w: 146, h: 75, logo: `${BASE}images/logo/jangheon_1.svg`, lar: 1.0, memo: '바론 직속 편제(이동)' },
    { id: 'jhind',   name: '장헌산업',     sub: '외감기업',        k: 'sky',     x: 950, y: 300, w: 146, h: 76 },
    { id: 'saman',   name: '삼안',         sub: '외감기업',        k: 'amber',   x: 600, y: 303, w: 175, h: 77 },
    { id: 'slot',    name: '이동여부 검토',sub: '장헌산업 편입(안)',k: 'slot',    x: 942, y: 412, w: 156, h: 55 },
    { id: 'halla',   name: '한라',         sub: '외감기업',        k: 'non',     x: 598, y: 433, w: 180, h: 75 },
    { id: 'sanha',   name: '산하종합기술', sub: '비외감기업',      k: 'del',     x: 57,  y: 338, w: 178, h: 75, logo: `${BASE}images/logo/shtnc.png`, lar: 1.0, memo: '삭제(청산·정리) 검토' },
    { id: 'hyunta',  name: '현타',         sub: '비외감기업',      k: 'del',     x: 57,  y: 433, w: 178, h: 75, memo: '삭제(청산·정리) 검토' },
  ],
  links: [
    { s: 'baron',   t: 'ptc',    pct: '44.55%', c: 'navy',   d: 'M555 103 V120 H146 V164',  lx: 158, ly: 153 },
    { s: 'baron',   t: 'hanmaek',pct: '8.67%',  c: 'navy',   d: 'M555 103 V120 H418 V164',  lx: 432, ly: 153 },
    { s: 'baron',   t: 'jp',     pct: '9.60%',  c: 'navy',   d: 'M555 103 V120 H686 V164',  lx: 697, ly: 153 },
    { s: 'baron',   t: 'saman',  pct: '2.36%',  c: 'navy',   d: 'M640 80 H820 V342 H779',   lx: 791, ly: 342 },
    { s: 'ptc',     t: 'hanmaek',pct: '9.86%',  c: 'purple', d: 'M235 192 H326',             lx: 283, ly: 182 },
    { s: 'hanmaek', t: 'ptc',    pct: '9.80%',  c: 'red',    d: 'M330 222 H239',             lx: 245, ly: 247 },
    { s: 'jp',      t: 'hanmaek',pct: '9.81%',  c: 'steel',  d: 'M597 192 H509',             lx: 517, ly: 182 },
    { s: 'hanmaek', t: 'jp',     pct: '9.60%',  c: 'red',    d: 'M505 222 H593',             lx: 550, ly: 245 },
    { s: 'jp',      t: 'saman',  pct: '65.39%', c: 'steel',  d: 'M686 245 V299',             lx: 715, ly: 295 },
    { s: 'ptc',     t: 'saman',  pct: '9.73%',  c: 'purple', d: 'M146 243 V282 H648 V299',   lx: 616, ly: 268 },
    { s: 'hanmaek', t: 'saman',  pct: '25.21%', c: 'red',    d: 'M440 243 V342 H596',        lx: 537, ly: 368 },
    { s: 'saman',   t: 'halla',  pct: '90.23%', c: 'orange', d: 'M688 380 V429',             lx: 616, ly: 413 },
    { s: 'hanmaek', t: 'halla',  pct: '9.77%',  c: 'red',    d: 'M418 243 V470 H594',        lx: 550, ly: 496 },
    { s: 'baron',   t: 'open',   pct: '80.00%', c: 'navy',   d: 'M555 103 V120 H860 V164',   lx: 880, ly: 153 },
    { s: 'baron',   t: 'jh',     pct: '100.0%',  c: 'navy',   d: 'M555 103 V120 H1023 V164',  lx: 1035, ly: 153 },
    { s: 'jh',      t: 'jhind',  pct: '100.0%',  c: 'note',   d: 'M1023 243 V296',            lx: 1035, ly: 278 },
    { s: 'jhind',   t: 'slot',   pct: '',       c: 'note',   d: 'M1023 376 V408', dash: '6 5', lx: 0, ly: 0 },
  ],
  annots: [
    { x: 42, y: 322, w: 208, h: 196, badge: '삭제(청산·정리) 검토', bw: 160 },
  ],
};

// ─── 최대주주 현황 (SVG viewBox: 0 0 1106 186) ──────
export const HOLDER_NODES: GovD3Node[] = [
  { id: 'H',       name: '주주1',         sub: '최대주주',   k: 'top',    x: 458, y: 6,   w: 190, h: 66 },
  { id: 'baron',   name: '바론',         sub: '비외감기업', k: 'sh_baron', x: 113, y: 135, w: 190, h: 66, logo: `${BASE}images/logo/Baron.svg`,    lar: 1.674, lscale: 0.67 },
  { id: 'hanmaek', name: '한맥기술',     sub: '외감기업',   k: 'sh_child', x: 343, y: 135, w: 190, h: 66, logo: `${BASE}images/logo/Hanmac.svg`,   lar: 1.647, lscale: 0.67 },
  { id: 'jp',      name: '장헌파트너스', sub: '외감기업',   k: 'sh_jp',    x: 573, y: 135, w: 190, h: 66, logo: `${BASE}images/logo/Jangheon.svg`, lar: 2.0,   lscale: 0.625 },
  { id: 'ptc',     name: '피티씨',       sub: '비외감기업', k: 'sh_child', x: 803, y: 135, w: 190, h: 66, logo: `${BASE}images/logo/PTC.svg`,      lar: 1.0,   lscale: 1 },
];

export const HOLDER_LINKS: GovD3Link[] = [
  { s: 'H', t: 'baron',   pct: '70.00%',  c: 'gray', d: 'M553 72 V91 H208 V131', lx: 118, ly: 128 },
  { s: 'H', t: 'hanmaek', pct: '40.73%', c: 'gray', d: 'M553 72 V91 H438 V131', lx: 348, ly: 128 },
  { s: 'H', t: 'jp',      pct: '45.32%', c: 'gray', d: 'M553 72 V91 H668 V131', lx: 578, ly: 128 },
  { s: 'H', t: 'ptc',     pct: '38.10%', c: 'gray', d: 'M553 72 V91 H898 V131', lx: 808, ly: 128 },
];
