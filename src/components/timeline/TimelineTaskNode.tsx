import React, { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface TaskBarNodeData {
  label: string;
  progress: number;
  taskId: string;
  isViewing: boolean;
  start: string;
  end: string;
  onSelect: (id: string) => void;
  onResizeStart: (
    taskId: string,
    type: 'start' | 'end',
    originalDate: string,
    e: React.MouseEvent,
  ) => void;
  [key: string]: unknown;
}

const TimelineTaskNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as TaskBarNodeData;
  const isViewing = nodeData.isViewing || selected;

  return (
    <div className={`dtl-tl-bar-wrap dtl-flow-bar-wrap ${isViewing ? 'dtl-tl-row-viewing' : ''}`}>
      <div className="dtl-tl-bar-bg" />
      <div
        className={`dtl-tl-bar ${isViewing ? 'active' : ''}`}
        style={{ position: 'relative', left: 0, width: '100%', cursor: 'pointer' }}
        onClick={() => nodeData.onSelect(nodeData.taskId)}
        role="button"
        tabIndex={0}
        aria-label={`${nodeData.label} 타임라인 바`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            nodeData.onSelect(nodeData.taskId);
          }
        }}
      >
        <div
          className="dtl-tl-resize-handle left"
          onMouseDown={(e) => {
            e.stopPropagation();
            nodeData.onResizeStart(nodeData.taskId, 'start', nodeData.start, e);
          }}
          role="separator"
          aria-label="시작일 조절"
        />
        <div className="dtl-tl-bar-fill" style={{ width: `${nodeData.progress}%` }} />
        <div
          className="dtl-tl-resize-handle right"
          onMouseDown={(e) => {
            e.stopPropagation();
            nodeData.onResizeStart(nodeData.taskId, 'end', nodeData.end, e);
          }}
          role="separator"
          aria-label="종료일 조절"
        />
      </div>
    </div>
  );
};

export default memo(TimelineTaskNode);
