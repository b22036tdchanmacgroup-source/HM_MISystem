import React from 'react';
import { ChevronLeft, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import type { Project } from '../../types';
import { isImageAttachmentUrl, isVideoAttachmentUrl, isPdfAttachmentUrl } from '../../utils/projectUtils';
import ZoomableImage from './ZoomableImage';

interface AggregatedViewerItem {
  url: string;
  taskId: string | null;
}

interface FilteredTask {
  id?: string;
  attachments?: string[];
  [key: string]: any;
}

interface ViewerPanelProps {
  isAddTaskModalOpen: boolean;
  isViewerFs: boolean;
  viewerRef: React.RefObject<HTMLDivElement>;
  aggregatedViewerInfo: AggregatedViewerItem[];
  slideIndex: number;
  setSlideIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedProject: Project | undefined;
  activeVersionIdx: number | null;
  filteredAndSortedTasks: FilteredTask[];
  toggleViewerFs: () => void;
  setIsViewerFs: React.Dispatch<React.SetStateAction<boolean>>;
}

const ViewerPanel: React.FC<ViewerPanelProps> = ({
  isAddTaskModalOpen,
  isViewerFs,
  viewerRef,
  aggregatedViewerInfo,
  slideIndex,
  setSlideIndex,
  selectedProject,
  activeVersionIdx,
  filteredAndSortedTasks,
  toggleViewerFs,
  setIsViewerFs,
}) => {
  // ── 뷰어에 표시할 URL 목록 결정 ──
  let viewerImageUrls: string[] = [];
  if (aggregatedViewerInfo.length > 0) {
    viewerImageUrls = aggregatedViewerInfo.map(info => info.url);
  } else if (selectedProject?.versions && selectedProject.versions.length > 0) {
    const vIdx = activeVersionIdx ?? 0;
    viewerImageUrls = selectedProject.versions[vIdx].drafts || [];
  }
  const count = viewerImageUrls.length;

  // ── 현재 업무 기준 슬라이드 범위 계산 ──
  const currentTaskId = aggregatedViewerInfo[slideIndex]?.taskId ?? null;
  const firstIdxOfCurrentTask = currentTaskId
    ? aggregatedViewerInfo.findIndex(info => info.taskId === currentTaskId)
    : -1;
  const lastIdxOfCurrentTask = currentTaskId
    ? aggregatedViewerInfo.reduce((acc, curr, idx) => curr.taskId === currentTaskId ? idx : acc, -1)
    : -1;
  const currentTaskOrderIdx = filteredAndSortedTasks.findIndex(t => t.id === currentTaskId);

  // 다음/이전 업무 (첨부파일 있는 것만)
  const nextTaskWithDrafts = filteredAndSortedTasks
    .slice(currentTaskOrderIdx + 1)
    .find(t => t.attachments && t.attachments.length > 0);
  const prevTaskWithDrafts = currentTaskOrderIdx > 0
    ? [...filteredAndSortedTasks].slice(0, currentTaskOrderIdx).reverse()
        .find(t => t.attachments && t.attachments.length > 0)
    : undefined;

  // ── 좌/우 화살표 로직 ──
  const isAtFirstOfTask = count > 0 && slideIndex === firstIdxOfCurrentTask;
  const canGoLeft = !isAtFirstOfTask || !!nextTaskWithDrafts;
  const handleLeftClick = () => {
    if (!isAtFirstOfTask) {
      setSlideIndex(prev => Math.max(0, prev - 1));
    } else if (nextTaskWithDrafts) {
      const nextTaskLastIdx = aggregatedViewerInfo.reduce(
        (acc, curr, idx) => curr.taskId === nextTaskWithDrafts.id ? idx : acc, -1
      );
      if (nextTaskLastIdx !== -1) setSlideIndex(nextTaskLastIdx);
    }
  };

  const isAtLastOfTask = count > 0 && slideIndex === lastIdxOfCurrentTask;
  const canGoRight = !isAtLastOfTask || !!prevTaskWithDrafts;
  const handleRightClick = () => {
    if (!isAtLastOfTask) {
      setSlideIndex(prev => Math.min(count - 1, prev + 1));
    } else if (prevTaskWithDrafts) {
      const prevFirstIdx = aggregatedViewerInfo.findIndex(info => info.taskId === prevTaskWithDrafts.id);
      if (prevFirstIdx !== -1) setSlideIndex(prevFirstIdx);
    }
  };

  return (
    <div
      className={`detail-viewer-panel ${isAddTaskModalOpen ? 'form-open' : ''} ${isViewerFs ? 'is-fs' : ''}`}
      ref={viewerRef}
      style={{ flex: '1 1 0' }}
    >
      {/* 좌 화살표 */}
      {count > 1 && canGoLeft && (
        <button className="arrow arrow-left" onClick={handleLeftClick}>
          <ChevronLeft size={32} />
        </button>
      )}

      {/* 슬라이드 트랙 */}
      <div className="slide-wrap">
        <div className="slide-track" style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
          {count > 0 ? (
            viewerImageUrls.map((url, i) => {
              const isImg  = isImageAttachmentUrl(url);
              const isVid  = isVideoAttachmentUrl(url);
              const isPdf  = isPdfAttachmentUrl(url);
              return (
                <div key={`${url}-${i}`} className="slide">
                  <div className="slide-content-box">
                    {isImg ? (
                      <ZoomableImage src={url} isFullScreen={isViewerFs} toggleFullScreen={toggleViewerFs} />
                    ) : isVid ? (
                      <video key={url} controls className="slide-video" playsInline preload="auto">
                        <source src={url} type="video/mp4" />
                        <source src={url} type="video/webm" />
                        <source src={url} type="video/ogg" />
                        현재 지원이 불가한 파일입니다.
                      </video>
                    ) : isPdf ? (
                      <div className="pdf-viewer-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <iframe src={url} title="pdf-view" className="slide-pdf" />
                        <div className="pdf-controls-top-right" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 110 }}>
                          <button
                            className={`zoom-fs-btn ${isViewerFs ? 'active' : ''}`}
                            onClick={e => { e.stopPropagation(); setIsViewerFs(v => !v); }}
                            title={isViewerFs ? 'Exit full screen' : 'Full screen'}
                          >
                            {isViewerFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="slide-text">미지원 파일</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="slide">
              <div className="slide-text">등록된 시안 파일이 없습니다.</div>
            </div>
          )}
        </div>
      </div>

      {/* 슬라이드 번호 */}
      <div className="slide-meta-fixed">
        {(() => {
          if (count === 0) return '0 / 0';
          if (!currentTaskId) return `${slideIndex + 1} / ${count}`;
          const taskInfo = aggregatedViewerInfo.filter(info => info.taskId === currentTaskId);
          const relativeIdx = taskInfo.findIndex(info => info.url === aggregatedViewerInfo[slideIndex]?.url);
          return `${relativeIdx + 1} / ${taskInfo.length}`;
        })()}
      </div>

      {/* 우 화살표 */}
      {count > 1 && canGoRight && (
        <button className="arrow arrow-right" onClick={handleRightClick}>
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  );
};

export default ViewerPanel;
