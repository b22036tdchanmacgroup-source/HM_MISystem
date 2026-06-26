import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GOV_D3_COLORS, GOV_D3_STYLE, HOLDER_LINKS, HOLDER_NODES, type GovD3Node } from './govD3Data';

const W = 1106;
const H = 245;


interface ShareholdersD3ChartProps {
  onNodeClick?: (nodeId: string) => void;
}

const ShareholdersD3Chart: React.FC<ShareholdersD3ChartProps> = ({ onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const onNodeClickRef = useRef(onNodeClick);
  
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  });

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    // 마커 정의
    const defs = svg.append('defs');
    Object.entries(GOV_D3_COLORS).forEach(([k, c]) => {
      defs.append('marker').attr('id', `hmk-${k}`)
        .attr('markerWidth', 5).attr('markerHeight', 5)
        .attr('refX', 4.5).attr('refY', 2.5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,0L5,2.5L0,5Z').attr('fill', c);
    });

    // sh_child 테두리 그라데이션 (청록 → rgba(66,115,174,0.8))
    const grad = defs.append('linearGradient')
      .attr('id', 'sh-child-border-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#2aacaa');
    grad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(66,115,174,0.8)');

    // 엣지
    const links = svg.append('g').attr('fill', 'none')
      .selectAll<SVGPathElement, (typeof HOLDER_LINKS)[0]>('path')
      .data(HOLDER_LINKS).join('path')
      .attr('d', d => d.d)
      .attr('stroke', d => GOV_D3_COLORS[d.c] ?? '#888')
      .attr('stroke-width', 2.0);

    // 엣지 draw 애니메이션
    links.each(function(d) {
      const len = this.getTotalLength();
      const el = this;
      d3.select(this)
        .attr('stroke-dasharray', len).attr('stroke-dashoffset', len)
        .transition().delay(120).duration(550).ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0);
      setTimeout(() => {
        d3.select(el).attr('stroke-dashoffset', 0).attr('stroke-dasharray', null).attr('marker-end', `url(#hmk-${d.c})`);
      }, 120 + 550 + 50);
    });

    // 지분율 레이블
    svg.append('g')
      .selectAll<SVGTextElement, (typeof HOLDER_LINKS)[0]>('text')
      .data(HOLDER_LINKS).join('text')
      .attr('x', d => d.lx).attr('y', d => d.ly)
      .attr('font-size', 17).attr('font-weight', 800)
      .attr('text-anchor', 'start')
      .attr('paint-order', 'stroke').attr('stroke', '#fdfcf9')
      .attr('stroke-width', 6).attr('stroke-linejoin', 'round')
      .attr('fill', '#3a3f4c')
      .attr('opacity', 0).text(d => d.pct)
      .transition().delay(450).duration(350).attr('opacity', 1);

    // 노드 그룹
    const nodes = svg.append('g')
      .selectAll<SVGGElement, GovD3Node>('g.sh-nd')
      .data(HOLDER_NODES, d => d.id).join('g')
      .attr('class', 'sh-nd')
      .attr('data-k', d => d.k)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('opacity', 0)
      .style('cursor', d => d.id === 'hanmac' ? 'pointer' : 'default')
      .on('click', (_, d) => {
        if (d.id === 'hanmac') {
          onNodeClickRef.current?.(d.id);
        }
      });

    // 모서리: top-left=0, top-right=r, bottom-right=0, bottom-left=r
    nodes.append('path')
      .attr('class', 'sh-nd-bg')
      .attr('d', d => {
        const w = d.w, h = d.h, r = 12;
        return `M0,0 H${w - r} Q${w},0 ${w},${r} V${h} H${r} Q0,${h} 0,${h - r} V0 Z`;
      })
      .attr('fill', d => GOV_D3_STYLE[d.k]?.fill ?? '#fff')
      .attr('stroke', d => d.k === 'sh_child' ? 'url(#sh-child-border-grad)' : (GOV_D3_STYLE[d.k]?.stroke ?? '#999'))
      .attr('stroke-width', d => GOV_D3_STYLE[d.k]?.sw ?? 2);

    nodes.append('text').attr('class', 'gov-nd-name')
      .attr('x', d => d.w / 2).attr('y', d => d.h / 2 + 6.5)
      .attr('text-anchor', 'middle').attr('font-weight', 800)
      .attr('font-size', 19)
      .attr('fill', '#2c3a30')
      .style('pointer-events', 'none')
      .text(d => d.name);

    // 로고 삽입
    nodes.each(function(d) {
      if (!d.logo) return;
      const grp = d3.select(this);
      const t = grp.select<SVGTextElement>('text.gov-nd-name');
      const tNode = t.node();
      if (!tNode) return;
      const tw = tNode.getComputedTextLength();
      let lh = 28 * (d.lscale ?? 1);
      let lw = lh * (d.lar ?? 1);
      const gap = 5;
      const maxRow = d.w - 22;
      if (lw + gap + tw > maxRow) {
        const s = (maxRow - gap - tw) / lw;
        lh = Math.max(12, lh * s);
        lw = lh * (d.lar ?? 1);
      }
      const startX = (d.w - (lw + gap + tw)) / 2;
      const baseY = d.h / 2 + 6.5;
      t.attr('text-anchor', 'start').attr('x', startX + lw + gap);
      grp.insert('image', 'text.gov-nd-name')
        .attr('href', d.logo)
        .attr('x', startX)
        .attr('y', baseY - 7 - lh / 2)
        .attr('width', lw)
        .attr('height', lh)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('pointer-events', 'none');
    });

    // 상단 중앙 ㅡ 데코레이션 (sh_child 노드만)
    nodes.each(function(d) {
      if (d.k !== 'sh_child' && d.k !== 'sh_jp') return;
      const barW = 50, barH = 4;
      d3.select(this).append('rect')
        .attr('x', (d.w - barW) / 2)
        .attr('y', 0)
        .attr('width', barW)
        .attr('height', barH)
        .attr('fill', d.k === 'sh_child' ? 'rgba(66,115,174,0.8)' : (GOV_D3_STYLE['sh_child']?.stroke ?? '#4273ae'))
        .style('pointer-events', 'none');
    });

    nodes.transition().delay((_, i) => 80 + i * 40).duration(320).ease(d3.easeCubicOut).attr('opacity', 1);

  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="sh-d3-svg"
      aria-label="최대주주 현황"
    />
  );
};

export default ShareholdersD3Chart;
