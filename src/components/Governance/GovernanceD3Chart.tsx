import React, { useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  GOV_D3_COLORS, GOV_D3_CURRENT, GOV_D3_STYLE,
  type GovD3Node,
} from './govD3Data';

export interface GovD3HoverInfo {
  nodeId: string; name: string; sub: string; k: string; memo?: string;
  outgoing: Array<{ name: string; pct: string }>;
  incoming: Array<{ name: string; pct: string }>;
}

interface GovernanceD3ChartProps {
  onNodeHover?: (info: GovD3HoverInfo | null) => void;
  onNodeClick?: (nodeId: string) => void;
}

const SVG_W = 1106;
const SVG_H = 620;
const HOVER_SCALE = 1.02;
const HOVER_REL_SCALE = 1.015;
const HOVER_REL_SW_EXTRA = 0.8;

function hoverNodeScale(d: GovD3Node, hoveredId: string, rel: Set<string>): number {
  if (d.id === hoveredId) return HOVER_SCALE;
  if (rel.has(d.id)) return HOVER_REL_SCALE;
  return 1;
}

function hoverStrokeWidth(d: GovD3Node, hoveredId: string, rel: Set<string>): number {
  const base = baseStrokeWidth(d);
  if (d.id === hoveredId) return base + 2;
  if (rel.has(d.id)) return base + HOVER_REL_SW_EXTRA;
  return base;
}


function blendWithWhite(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const ch = (v: number) => Math.round(255 * (1 - alpha) + v * alpha).toString(16).padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

function baseStrokeWidth(d: GovD3Node): number {
  return GOV_D3_STYLE[d.k]?.sw ?? 2;
}

function nodeTransform(d: GovD3Node, scale = 1): string {
  if (scale === 1) return `translate(${d.x},${d.y})`;
  const cx = d.w / 2, cy = d.h / 2;
  return `translate(${d.x},${d.y}) translate(${cx},${cy}) scale(${scale}) translate(${-cx},${-cy})`;
}

const GovernanceD3Chart: React.FC<GovernanceD3ChartProps> = ({ onNodeHover, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const onNodeHoverRef = useRef(onNodeHover);
  const onNodeClickRef = useRef(onNodeClick);
  useEffect(() => {
    onNodeHoverRef.current = onNodeHover;
    onNodeClickRef.current = onNodeClick;
  });

  const draw = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const dataset = GOV_D3_CURRENT;
    svg.selectAll('*').remove();
    const byId = Object.fromEntries(dataset.nodes.map(n => [n.id, n]));

    // 마커 정의
    const defs = svg.append('defs');
    Object.entries(GOV_D3_COLORS).forEach(([k, c]) => {
      defs.append('marker').attr('id', `gmk-${k}`)
        .attr('markerWidth', 5).attr('markerHeight', 5)
        .attr('refX', 4.5).attr('refY', 2.5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,0L5,2.5L0,5Z').attr('fill', c);
    });
    defs.append('filter')
      .attr('id', 'gov-nd-hover-shadow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 3)
      .attr('stdDeviation', 5)
      .attr('flood-opacity', 0.18);

    // 호버 배경 그라디언트: 상단 2/3 흰색, 하단 1/3 stroke 틴트
    Object.entries(GOV_D3_STYLE).forEach(([k, style]) => {
      const stroke = style?.stroke;
      if (!stroke || stroke === 'none') return;
      const grad = defs.append('linearGradient')
        .attr('id', `gov-hover-grad-${k}`)
        .attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1)
        .attr('gradientUnits', 'objectBoundingBox');
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
      grad.append('stop').attr('offset', '45%').attr('stop-color', '#ffffff');
      grad.append('stop').attr('offset', '65%').attr('stop-color', blendWithWhite(stroke, 0.06));
      grad.append('stop').attr('offset', '82%').attr('stop-color', blendWithWhite(stroke, 0.12));
      grad.append('stop').attr('offset', '100%').attr('stop-color', blendWithWhite(stroke, 0.20));
    });

    const g = svg.append('g');

    // 어노테이션 그룹 박스 (CURRENT에는 없음, PLAN 전용)
    dataset.annots.forEach(a => {
      g.append('rect').attr('x', a.x).attr('y', a.y).attr('width', a.w).attr('height', a.h)
        .attr('rx', 15).attr('fill', '#fdf1f2').attr('stroke', '#d8434f')
        .attr('stroke-width', 2).attr('stroke-dasharray', '9 6');
      g.append('rect').attr('x', a.x).attr('y', a.y - 13).attr('width', a.bw).attr('height', 26)
        .attr('rx', 13).attr('fill', '#d8434f');
      g.append('text').attr('x', a.x + a.bw / 2).attr('y', a.y + 5).attr('text-anchor', 'middle')
        .attr('font-size', 13).attr('font-weight', 800).attr('fill', '#fff').text(a.badge);
    });

    // 엣지
    const links = g.append('g').attr('fill', 'none')
      .selectAll<SVGPathElement, (typeof dataset.links)[0]>('path')
      .data(dataset.links).join('path')
      .attr('class', 'gov-d3-edge').attr('data-s', d => d.s).attr('data-t', d => d.t)
      .attr('d', d => d.d)
      .attr('stroke', d => GOV_D3_COLORS[d.c] ?? '#888')
      .attr('stroke-width', 2.2)
      .attr('stroke-dasharray', d => d.dash ?? null);

    // 엣지 draw 애니메이션 (파선 제외)
    links.each(function(d) {
      if (d.dash) { d3.select(this).attr('marker-end', `url(#gmk-${d.c})`); return; }
      const len = this.getTotalLength();
      const el = this;
      d3.select(this).attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
        .transition('draw').delay(180).duration(650).ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0);
      // transition.on('end')는 호버 등 다른 transition이 끼어들면 발화 안 됨
      // setTimeout으로 animation 완료 시점 이후 무조건 적용
      setTimeout(() => {
        const sel = d3.select(el).attr('stroke-dashoffset', 0).attr('stroke-dasharray', null);
        if (!d.noArrow) sel.attr('marker-end', `url(#gmk-${d.c})`);
      }, 180 + 650 + 50);
    });

    // 분기 지점 화살표
    if (dataset.junctionArrows?.length) {
      const arrowG = g.append('g').attr('class', 'gov-junction-arrows');
      dataset.junctionArrows.forEach(({ x, y, c }) => {
        const color = GOV_D3_COLORS[c] ?? c;
        arrowG.append('path')
          .attr('d', `M${x - 5.5},${y - 5.5} L${x + 5.5},${y - 5.5} L${x},${y + 5.5} Z`)
          .attr('fill', color)
          .attr('opacity', 0)
          .transition('draw').delay(300).duration(380).attr('opacity', 1);
      });
    }

    // 엣지 지분율 레이블
    const labels = g.append('g')
      .selectAll<SVGTextElement, (typeof dataset.links)[0]>('text')
      .data(dataset.links.filter(d => !!d.pct)).join('text')
      .attr('class', 'gov-d3-lbl').attr('data-key', d => `${d.s}>${d.t}`)
      .attr('x', d => d.lx).attr('y', d => d.ly)
      .attr('text-anchor', d => d.pct === '100%' ? 'end' : 'start')
      .attr('font-size', 17).attr('font-weight', 700)
      .attr('paint-order', 'stroke').attr('stroke', '#fdfcf9')
      .attr('stroke-width', 6).attr('stroke-linejoin', 'round')
      .attr('fill', d => GOV_D3_COLORS[d.c] ?? '#888')
      .attr('opacity', 0).text(d => d.pct);
    labels.transition('draw').delay(520).duration(380).attr('opacity', 1);

    // 노드 그룹
    const nodes = g.append('g')
      .selectAll<SVGGElement, GovD3Node>('g.gov-d3-nd')
      .data(dataset.nodes, d => d.id).join('g')
      .attr('class', 'gov-d3-nd').attr('data-id', d => d.id)
      .attr('transform', d => nodeTransform(d, 1)).attr('opacity', 0)
      .style('cursor', 'pointer');

    // 모서리: top-left=0, top-right=r, bottom-right=0, bottom-left=r
    nodes.append('path')
      .attr('d', d => {
        const w = d.w, h = d.h, r = 14;
        return `M0,0 H${w - r} Q${w},0 ${w},${r} V${h} H${r} Q0,${h} 0,${h - r} V0 Z`;
      })
      .attr('fill', d => GOV_D3_STYLE[d.k]?.fill ?? '#fff')
      .attr('stroke', d => GOV_D3_STYLE[d.k]?.stroke ?? '#999')
      .attr('stroke-width', d => baseStrokeWidth(d))
      .attr('stroke-dasharray', d => GOV_D3_STYLE[d.k]?.dash ?? null);

    // 회사명 텍스트 (logo 기준점이 되므로 class 지정)
    nodes.append('text').attr('class', 'gov-nd-name')
      .attr('x', d => d.w / 2).attr('y', d => d.h / 2 - 1)
      .attr('text-anchor', 'middle').attr('font-weight', 800)
      .attr('font-size', d => d.k === 'slot' ? 14 : 18)
      .attr('fill', d => d.k === 'slot' ? '#8a7626' : '#2c3a30').text(d => d.name);

    // 로고 삽입 (getComputedTextLength 기반 수평 정렬)
    nodes.each(function(d) {
      if (!d.logo) return;
      const grp = d3.select(this);
      const t = grp.select<SVGTextElement>('text.gov-nd-name');
      const tNode = t.node();
      if (!tNode) return;
      const tw = tNode.getComputedTextLength();
      let lh = 22 * (d.lscale ?? 1);
      let lw = lh * (d.lar ?? 1);
      const gap = 7;
      const maxRow = d.w - 22;
      if (lw + gap + tw > maxRow) {
        const s = (maxRow - gap - tw) / lw;
        lh = Math.max(12, lh * s);
        lw = lh * (d.lar ?? 1);
      }
      const startX = (d.w - (lw + gap + tw)) / 2;
      const baseY = d.h / 2 - 1;
      t.attr('text-anchor', 'start').attr('x', startX + lw + gap);
      grp.insert('image', 'text.gov-nd-name')
        .attr('href', d.logo)
        .attr('x', startX)
        .attr('y', baseY - 7 - lh / 2)
        .attr('width', lw)
        .attr('height', lh)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    });

    // 업종 서브텍스트
    nodes.append('text').attr('x', d => d.w / 2).attr('y', d => d.h / 2 + 19)
      .attr('text-anchor', 'middle').attr('font-size', 13).attr('font-weight', 600)
      .attr('fill', '#2c3a30').text(d => `(${d.sub})`);

    // top-left 코너 브래킷 (ㄴ 뒤집은 형태, 테두리 컬러 맞춤)
    const CORNER_S = 18, CORNER_T = 3;
    nodes.each(function(d) {
      if (d.k === 'slot') return;
      d3.select(this).append('path')
        .attr('class', 'gov-nd-corner')
        .attr('d', `M0,0 H${CORNER_S} V${CORNER_T} H${CORNER_T} V${CORNER_S} H0 Z`)
        .attr('fill', GOV_D3_STYLE[d.k]?.stroke ?? '#999');
    });

    nodes.transition('draw').delay((_, i) => 150 + i * 45).duration(380).ease(d3.easeCubicOut).attr('opacity', 1);
    nodes.filter(d => !!d.hide).attr('opacity', 0).style('pointer-events', 'none');
    links.filter(l => !!l.hide).attr('opacity', 0).style('pointer-events', 'none');
    labels.filter(l => !!l.hide).attr('opacity', 0);

    // ── 호버 및 클릭 인터랙션 ──────────────────────────────
    nodes
      .on('click', (_, n) => {
        if (n.id === 'hanmac') {
          onNodeClickRef.current?.(n.id);
        }
      })
      .on('mouseenter', function(_, n) {
        const out = dataset.links.filter(l => l.s === n.id && l.pct);
        const inn = dataset.links.filter(l => l.t === n.id && l.pct);
        const allOut = dataset.links.filter(l => l.s === n.id);
        const allInn = dataset.links.filter(l => l.t === n.id);
        const rel = new Set([n.id, ...allOut.map(l => l.t), ...allInn.map(l => l.s)]);

        d3.select(this).raise();

        nodes.transition('hover').duration(120)
          .attr('opacity', d => rel.has(d.id) ? 1 : 0.7)
          .attr('transform', d => nodeTransform(d, hoverNodeScale(d, n.id, rel)));
        nodes.each(function(d) {
          d3.select(this).select<SVGPathElement>('path:not(.gov-nd-corner)').transition('hover').duration(120)
            .attr('stroke-width', hoverStrokeWidth(d, n.id, rel))
            .attr('fill', d.id === n.id ? `url(#gov-hover-grad-${d.k})` : (GOV_D3_STYLE[d.k]?.fill ?? '#fff'))
            .attr('filter', d.id === n.id ? 'url(#gov-nd-hover-shadow)' : null);
        });
        links.each(function(l) {
          const isRel = l.s === n.id || l.t === n.id;
          const el = d3.select(this);
          el.interrupt('hover').interrupt('hover-dash');
          if (isRel) {
            const len = this.getTotalLength();
            const dashLen = 8, gapLen = 5, period = dashLen + gapLen;
            el.attr('stroke-dashoffset', null)
              .attr('stroke-dasharray', `0 ${len + 999}`)
              .attr('marker-end', null)
              .attr('stroke-width', 2.8)
              .attr('opacity', 1)
              .transition('hover-dash').duration(600).ease(d3.easeCubicInOut)
              .attrTween('stroke-dasharray', () => (t: number) => {
                const drawn = t * len;
                const full = Math.floor(drawn / period);
                const rem = drawn % period;
                const parts: number[] = [];
                for (let i = 0; i < full; i++) parts.push(dashLen, gapLen);
                parts.push(Math.min(rem, dashLen), len + 999);
                return parts.join(' ');
              })
              .on('end', function() {
                if (!l.noArrow) d3.select(this).attr('marker-end', `url(#gmk-${l.c})`);
              });
          } else {
            el.transition('hover').duration(120)
              .attr('opacity', 0.2)
              .attr('stroke-width', 2.2);
          }
        });
        labels.transition('hover').duration(120)
          .attr('opacity', l => (l.s === n.id || l.t === n.id) ? 1 : 0.7);

        onNodeHoverRef.current?.({
          nodeId: n.id, name: n.name, sub: n.sub, k: n.k, memo: n.memo,
          outgoing: out.map(l => ({ name: byId[l.t]?.name ?? l.t, pct: l.pct })),
          incoming: inn.map(l => ({ name: byId[l.s]?.name ?? l.s, pct: l.pct })),
        });
      })
      .on('mouseleave', () => {
        nodes.transition('hover').duration(150)
          .attr('opacity', 1)
          .attr('transform', d => nodeTransform(d, 1));
        nodes.each(function(d) {
          d3.select(this).select<SVGPathElement>('path:not(.gov-nd-corner)').transition('hover').duration(150)
            .attr('stroke-width', baseStrokeWidth(d))
            .attr('fill', GOV_D3_STYLE[d.k]?.fill ?? '#fff')
            .attr('filter', null);
        });
        links.each(function(l) {
          d3.select(this).interrupt('hover').interrupt('hover-dash')
            .attr('stroke-dashoffset', null)
            .attr('stroke-dasharray', l.dash ?? null)
            .attr('marker-end', l.noArrow ? null : `url(#gmk-${l.c})`)
            .transition('hover').duration(200)
            .attr('opacity', 1)
            .attr('stroke-width', 2.2);
        });
        labels.transition('hover').duration(150).attr('opacity', 1);
        onNodeHoverRef.current?.(null);
      });
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    draw(d3.select(svgRef.current));
  }, [draw]);

  return (
    <div className="gov-d3-chart-wrap">
      <div className="gov-d3-toggle">
        <span className="sh-chart-title-label">2. 지배구조</span>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="gov-d3-svg" aria-label="지배구조도" />
      <span className="gov-d3-hint">노드 호버: 출자관계 하이라이트</span>
    </div>
  );
};

export default GovernanceD3Chart;
