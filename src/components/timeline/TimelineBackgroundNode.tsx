import React, { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface TimelineBackgroundData {
  timelineWidth: number;
  contentHeight: number;
  numSegments: number;
  totalDays: number;
  intervalDays: number;
  viewStartMs: number;
  todayLineLeft: number;
  showTodayLine: boolean;
  [key: string]: unknown;
}

const TimelineBackgroundNode: React.FC<NodeProps> = ({ data }) => {
  const bg = data as TimelineBackgroundData;

  return (
    <div
      className="dtl-tl-flow-background"
      style={{ width: bg.timelineWidth, height: bg.contentHeight, pointerEvents: 'none' }}
    >
      <div className="dtl-tl-grid">
        {Array.from({ length: bg.numSegments + 1 }).map((_, i) => {
          const leftPx = (i / bg.numSegments) * bg.timelineWidth;
          const isEdge = i === 0 || i === bg.numSegments;
          return (
            <div
              key={i}
              className="dtl-grid-line"
              style={{
                left: `${leftPx}px`,
                borderLeft: isEdge ? '1px solid rgba(6, 75, 54, 0.3)' : undefined,
                zIndex: isEdge ? 1 : undefined,
              }}
            />
          );
        })}
      </div>

      <div className="dtl-tl-date-row dtl-tl-date-row-flow">
        {Array.from({ length: bg.numSegments + 1 }).map((_, i) => {
          const leftPx = (i / bg.numSegments) * bg.timelineWidth;
          const d = new Date(
            bg.viewStartMs + (i / bg.numSegments) * bg.totalDays * 86400000,
          );
          const labelText =
            bg.intervalDays >= 30
              ? `${d.getFullYear()}.${d.getMonth() + 1}`
              : `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
          let transform = 'translateX(-50%)';
          if (i === 0) transform = 'translateX(4px)';
          if (i === bg.numSegments) transform = 'translateX(calc(-100% - 4px))';

          return (
            <div
              key={i}
              className="dtl-tl-date-cell"
              style={{ left: `${leftPx}px`, transform }}
            >
              {labelText}
            </div>
          );
        })}
      </div>

      {bg.showTodayLine && (
        <div
          className="dtl-today-line"
          style={{ left: `${bg.todayLineLeft}px`, marginLeft: 0 }}
        >
          <div
            className="dtl-today-badge"
            style={{
              transform:
                bg.todayLineLeft < 40
                  ? 'translateX(4px)'
                  : bg.todayLineLeft > bg.timelineWidth - 40
                    ? 'translateX(calc(-100% - 4px))'
                    : 'translateX(-50%)',
            }}
          >
            TODAY ({new Date().getMonth() + 1}.{String(new Date().getDate()).padStart(2, '0')})
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TimelineBackgroundNode);
