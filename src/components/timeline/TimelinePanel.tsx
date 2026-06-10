import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Clock } from 'lucide-react';
import type { Project } from '../../types';
import TimelineTaskNode, { type TaskBarNodeData } from './TimelineTaskNode';
import TimelineBackgroundNode, { type TimelineBackgroundData } from './TimelineBackgroundNode';

const MS_PER_DAY = 86400000;
const ROW_HEIGHT = 28;
const DATE_HEADER_HEIGHT = 40;
const DEFAULT_CONTAINER_WIDTH = 1000;
const BASE_INTERVALS = [15, 30, 60, 90, 180, 240, 365, 730, 1095] as const;
const MAX_GRID_SEGMENTS = 28;

const elk = new ELK();

const nodeTypes = {
  taskBar: TimelineTaskNode,
  timelineBackground: TimelineBackgroundNode,
};

interface TimelineItem {
  label: string;
  start: string;
  end: string;
  progress: number;
  taskId: string;
}

interface ResizingTask {
  taskId: string;
  type: 'start' | 'end';
  originalDate: string;
}

interface TimelinePanelProps {
  selectedProject: Project | undefined;
  selectedId: string | null;
  detailTimelineItems: TimelineItem[];
  viewingTaskId: string | null;
  setViewingTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  onTaskDateChange: (taskId: string, field: 'startDate' | 'endDate', date: string) => void;
  timelinePanelHeight: number;
  startResizingTimelinePanel: (e: React.MouseEvent) => void;
}

function computeDtlRange(selectedProject: Project | undefined) {
  let min = selectedProject?.startDate
    ? new Date(selectedProject.startDate).getTime()
    : Date.now();
  let max = selectedProject?.endDate
    ? new Date(selectedProject.endDate).getTime()
    : min + 30 * MS_PER_DAY;

  if (max <= min) max = min + MS_PER_DAY;

  return {
    min,
    max,
    rangeDays: Math.max(1, Math.ceil((max - min) / MS_PER_DAY)),
  };
}

function computeDtlIntervals(rangeDays: number) {
  const fullViewDays = rangeDays;
  return [...BASE_INTERVALS.filter((v) => v < fullViewDays), fullViewDays];
}

interface TimelineFlowProps {
  selectedProject: Project;
  selectedId: string | null;
  items: TimelineItem[];
  viewingTaskId: string | null;
  setViewingTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  onTaskDateChange: (taskId: string, field: 'startDate' | 'endDate', date: string) => void;
}

const TimelineFlow: React.FC<TimelineFlowProps> = ({
  selectedProject,
  selectedId,
  items,
  viewingTaskId,
  setViewingTaskId,
  onTaskDateChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setViewport, getViewport, screenToFlowPosition } = useReactFlow();

  const dtlRange = useMemo(() => computeDtlRange(selectedProject), [selectedProject]);
  const dtlIntervals = useMemo(
    () => computeDtlIntervals(dtlRange.rangeDays),
    [dtlRange.rangeDays],
  );

  const [dtlIntervalIndex, setDtlIntervalIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(DEFAULT_CONTAINER_WIDTH);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [resizingTask, setResizingTask] = useState<ResizingTask | null>(null);
  const [tempResizeFlowX, setTempResizeFlowX] = useState<number | null>(null);

  const dtlZoomAnchor = useRef<{ time: number; mouseX: number } | null>(null);
  const lastCenteredProjectId = useRef<string | null>(null);

  const { min: pStartT, max: pEndT } = dtlRange;
  const sDays = dtlIntervals[Math.min(dtlIntervalIndex, dtlIntervals.length - 1)] ?? dtlRange.rangeDays;
  const dtlDayWidth = containerWidth / sDays;

  const viewStart = useMemo(() => new Date(pStartT), [pStartT]);
  const viewEnd = useMemo(() => new Date(pEndT), [pEndT]);
  const totalDays = Math.max(
    1,
    Math.ceil((viewEnd.getTime() - viewStart.getTime()) / MS_PER_DAY),
  );
  const numSegments = Math.min(totalDays, MAX_GRID_SEGMENTS);
  const intervalDays = totalDays / numSegments;
  const timelineWidth = totalDays * dtlDayWidth;
  const contentHeight = DATE_HEADER_HEIGHT + items.length * ROW_HEIGHT + 40;

  useEffect(() => {
    if (selectedId && dtlIntervals.length > 0) {
      setDtlIntervalIndex(dtlIntervals.length - 1);
    }
  }, [selectedId, dtlIntervals.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width || DEFAULT_CONTAINER_WIDTH);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth || DEFAULT_CONTAINER_WIDTH);
    return () => observer.disconnect();
  }, []);

  const calcBarGeometry = useCallback(
    (item: TimelineItem) => {
      const startT = item.start ? new Date(item.start).getTime() : pStartT;
      const endT = item.end ? new Date(item.end).getTime() : pEndT;
      const left = ((startT - viewStart.getTime()) / MS_PER_DAY + 0.5) * dtlDayWidth;
      const width = Math.max(dtlDayWidth, ((endT - startT) / MS_PER_DAY + 1) * dtlDayWidth);
      return { left, width, startT, endT };
    },
    [pStartT, pEndT, viewStart, dtlDayWidth],
  );

  const handleResizeStart = useCallback(
    (taskId: string, type: 'start' | 'end', _originalDate: string, _e: React.MouseEvent) => {
      const item = items.find((it) => it.taskId === taskId);
      if (!item) return;
      setResizingTask({
        taskId,
        type,
        originalDate: type === 'start' ? item.start : item.end,
      });
    },
    [items],
  );

  const handleSelect = useCallback(
    (taskId: string) => {
      setViewingTaskId(taskId);
    },
    [setViewingTaskId],
  );

  // ELK.js로 행(Y) 배치, X는 날짜 기준 수동 계산
  useEffect(() => {
    let cancelled = false;

    const buildNodes = async () => {
      const graph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'org.eclipse.elk.layered',
          'elk.direction': 'DOWN',
          'elk.spacing.nodeNode': '4',
          'elk.padding': `[top=${DATE_HEADER_HEIGHT},left=0,bottom=40,right=0]`,
        },
        children: items.map((item) => {
          const { width } = calcBarGeometry(item);
          return {
            id: item.taskId,
            width: Math.round(width),
            height: ROW_HEIGHT,
          };
        }),
        edges: items.slice(0, -1).map((_, i) => ({
          id: `e-${i}`,
          sources: [items[i].taskId],
          targets: [items[i + 1].taskId],
        })),
      };

      const layout = await elk.layout(graph);
      if (cancelled) return;

      const todayLineLeft =
        ((Date.now() - viewStart.getTime()) / MS_PER_DAY + 0.5) * dtlDayWidth;
      const showTodayLine = todayLineLeft >= 0 && todayLineLeft <= timelineWidth;

      const bgData: TimelineBackgroundData = {
        timelineWidth,
        contentHeight,
        numSegments,
        totalDays,
        intervalDays,
        viewStartMs: viewStart.getTime(),
        todayLineLeft,
        showTodayLine,
      };

      const backgroundNode: Node = {
        id: 'timeline-bg',
        type: 'timelineBackground',
        position: { x: 0, y: 0 },
        data: bgData,
        style: { width: timelineWidth, height: contentHeight },
        draggable: false,
        selectable: false,
        zIndex: -1,
      };

      const taskNodes: Node[] = (layout.children ?? []).map((child) => {
        const item = items.find((it) => it.taskId === child.id)!;
        let { left, width } = calcBarGeometry(item);

        if (resizingTask && resizingTask.taskId === item.taskId && tempResizeFlowX !== null) {
          if (resizingTask.type === 'start') {
            const rightEdge = left + width;
            left = tempResizeFlowX;
            width = Math.max(dtlDayWidth, rightEdge - left);
          } else {
            width = Math.max(dtlDayWidth, tempResizeFlowX - left);
          }
        }

        const nodeData: TaskBarNodeData = {
          label: item.label,
          progress: item.progress,
          taskId: item.taskId,
          isViewing: item.taskId === viewingTaskId,
          start: item.start,
          end: item.end,
          onSelect: handleSelect,
          onResizeStart: handleResizeStart,
        };

        return {
          id: item.taskId,
          type: 'taskBar',
          position: { x: left, y: child.y ?? DATE_HEADER_HEIGHT },
          data: nodeData,
          style: { width, height: ROW_HEIGHT },
          draggable: false,
          selectable: true,
        };
      });

      setNodes([backgroundNode, ...taskNodes]);
    };

    void buildNodes();
    return () => {
      cancelled = true;
    };
  }, [
    items,
    calcBarGeometry,
    dtlDayWidth,
    viewingTaskId,
    resizingTask,
    tempResizeFlowX,
    handleSelect,
    handleResizeStart,
    timelineWidth,
    contentHeight,
    numSegments,
    totalDays,
    intervalDays,
    viewStart,
  ]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const { x: vpX } = getViewport();
      const mouseTime =
        pStartT + ((-vpX + mouseX) / dtlDayWidth) * MS_PER_DAY;

      let nextIndex = dtlIntervalIndex;
      if (e.deltaY < 0) {
        nextIndex = Math.max(0, dtlIntervalIndex - 1);
      } else {
        nextIndex = Math.min(dtlIntervals.length - 1, dtlIntervalIndex + 1);
      }

      if (nextIndex !== dtlIntervalIndex) {
        dtlZoomAnchor.current = { time: mouseTime, mouseX };
        setDtlIntervalIndex(nextIndex);
      }
    },
    [dtlIntervalIndex, dtlIntervals.length, dtlDayWidth, getViewport, pStartT],
  );

  useLayoutEffect(() => {
    if (dtlZoomAnchor.current === null) return;

    const { time, mouseX } = dtlZoomAnchor.current;
    const newVpX = ((time - pStartT) / MS_PER_DAY) * dtlDayWidth - mouseX;
    const { y, zoom } = getViewport();
    setViewport({ x: -newVpX, y, zoom }, { duration: 0 });
    dtlZoomAnchor.current = null;
  }, [dtlIntervalIndex, dtlDayWidth, pStartT, getViewport, setViewport]);

  useEffect(() => {
    if (
      !selectedId ||
      !selectedProject ||
      lastCenteredProjectId.current === selectedId
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const todayLeft = ((Date.now() - viewStart.getTime()) / MS_PER_DAY + 0.5) * dtlDayWidth;
      const width = containerRef.current?.clientWidth ?? containerWidth;
      const { y, zoom } = getViewport();
      setViewport({ x: -(todayLeft - width / 2), y, zoom }, { duration: 0 });
      lastCenteredProjectId.current = selectedId;
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedId, selectedProject, viewStart, dtlDayWidth, containerWidth, getViewport, setViewport]);

  useEffect(() => {
    if (!viewingTaskId || items.length === 0) return;

    const item = items.find((it) => it.taskId === viewingTaskId);
    if (!item) return;

    const { left, width } = calcBarGeometry(item);
    const nodeIdx = items.findIndex((it) => it.taskId === viewingTaskId);
    const rowY = DATE_HEADER_HEIGHT + nodeIdx * (ROW_HEIGHT + 4);
    const widthPx = containerRef.current?.clientWidth ?? containerWidth;
    const { zoom } = getViewport();

    setViewport(
      {
        x: -(left + width / 2 - widthPx / 2),
        y: -(rowY - 20),
        zoom,
      },
      { duration: 300 },
    );
  }, [viewingTaskId, items, calcBarGeometry, containerWidth, getViewport, setViewport]);

  useEffect(() => {
    if (!resizingTask) return;

    const handleMouseMove = (e: MouseEvent) => {
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setTempResizeFlowX(flowPos.x);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const snappedDate = new Date(
        viewStart.getTime() + (flowPos.x / dtlDayWidth - 0.5) * MS_PER_DAY,
      )
        .toISOString()
        .split('T')[0];

      onTaskDateChange(
        resizingTask.taskId,
        resizingTask.type === 'start' ? 'startDate' : 'endDate',
        snappedDate,
      );
      setResizingTask(null);
      setTempResizeFlowX(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingTask, screenToFlowPosition, viewStart, dtlDayWidth, onTaskDateChange]);

  return (
    <div
      ref={containerRef}
      className="dtl-tl-flow-wrap"
      onWheel={handleWheel}
    >
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable
        minZoom={1}
        maxZoom={1}
        defaultViewport={{ x: 0, y: 0, zoom: 1 } as Viewport}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
};

const TimelinePanel: React.FC<TimelinePanelProps> = ({
  selectedProject,
  selectedId,
  detailTimelineItems,
  viewingTaskId,
  setViewingTaskId,
  onTaskDateChange,
  timelinePanelHeight,
  startResizingTimelinePanel,
}) => (
  <>
    <div
      className="timeline-panel-resizer"
      onMouseDown={startResizingTimelinePanel}
      role="separator"
      aria-label="타임라인 패널 높이 조절"
    />
    <div
      className="detail-timeline-panel"
      style={{ height: `${timelinePanelHeight}px`, flex: `0 0 ${timelinePanelHeight}px` }}
    >
      <div className="detail-timeline-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={16} color="#064b36" />
          <span>업무별 타임라인</span>
        </div>
      </div>

      <div className="detail-timeline-body">
        {!selectedProject || detailTimelineItems.length === 0 ? (
          <div className="detail-timeline-empty">등록된 업무 타임라인이 없습니다.</div>
        ) : (
          <ReactFlowProvider>
            <TimelineFlow
              selectedProject={selectedProject}
              selectedId={selectedId}
              items={detailTimelineItems}
              viewingTaskId={viewingTaskId}
              setViewingTaskId={setViewingTaskId}
              onTaskDateChange={onTaskDateChange}
            />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  </>
);

export default TimelinePanel;
