import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import './styles/App.css';
import { useFirebaseData } from './hooks/useFirebaseData';
import type { Project, TaskItem, TeamMember, ProjectStatus } from './types';
import { Layout, Plus, X, ChevronLeft, ChevronRight, Film, ChevronDown, Edit2, Trash2, Smile, Paperclip, Clipboard, Check, Link2, ExternalLink, Image, Maximize2, Minimize2, Move, Frame, MousePointer2, Pin } from 'lucide-react';
import RichTextEditor from './components/project/RichTextEditor';
import AppHeader from './components/layout/AppHeader';
import OrgChartPopup from './components/layout/OrgChartPopup';
import TeamOverlay from './components/shareholdersGovernance/TeamOverlay';
import TimelinePanel from './components/timeline/TimelinePanel';
import OrdersSalesDashboard from './components/ordersSales/OrdersSalesDashboard';

/** 담당자 정렬 함수: 팀장 최우선 -> 셀별(UX->편집->영상->기타) -> 직급순(수석->책임->선임->연구원) -> index순 -> 이름순 */
const sortTeamMembers = (a: TeamMember, b: TeamMember) => {
  // 1. 팀장 여부 비교 (role에 '팀장'이 들어가거나 cell이 '기타'이면서 rank가 '수석연구원'인 경우 등)
  const isLeaderA = a.role?.includes('팀장') || a.cell === '기타';
  const isLeaderB = b.role?.includes('팀장') || b.cell === '기타';
  if (isLeaderA && !isLeaderB) return -1;
  if (!isLeaderA && isLeaderB) return 1;

  // 2. 셀(cell) 순서 비교
  const cellOrder: Record<string, number> = {
    'UX셀': 1,
    '영상셀': 2,
    '편집셀': 3,
    '기타': 4
  };
  const cellA = cellOrder[a.cell] || 99;
  const cellB = cellOrder[b.cell] || 99;
  if (cellA !== cellB) return cellA - cellB;

  // 3. 셀 내에서의 순서 (셀장 우선)
  const isCell장A = a.role?.includes('셀장');
  const isCell장B = b.role?.includes('셀장');
  if (isCell장A && !isCell장B) return -1;
  if (!isCell장A && isCell장B) return 1;

  // 4. 직급(rank) 순서 비교
  const rankOrder: Record<string, number> = {
    '수석연구원': 1,
    '책임연구원': 2,
    '선임연구원': 3,
    '연구원': 4
  };
  const rankA = rankOrder[a.rank] || 99;
  const rankB = rankOrder[b.rank] || 99;
  if (rankA !== rankB) return rankA - rankB;

  // 5. index 순서 비교
  if (a.index !== undefined && b.index !== undefined && a.index !== b.index) {
    return a.index - b.index;
  }

  // 6. 이름 순서 비교
  return a.name.localeCompare(b.name);
};

/** 뷰어·썸네일 동기화: 이미지 첨부 URL만 (경로 끝 기준) */
const IMAGE_URL_RE = /\.(jpeg|jpg|gif|png|webp|svg)$/i;
const VIDEO_URL_RE = /\.(mp4|webm|ogg|mov|m4v|avi|mkv|wmv)$/i;
const PDF_URL_RE = /\.pdf$/i;

/** 쿼리/해시 제거 후 확장자 검사 (예: `file.jpg?alt=media`) */
function attachmentUrlPath(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function isImageAttachmentUrl(url: string): boolean {
  return IMAGE_URL_RE.test(attachmentUrlPath(url));
}

function isVideoAttachmentUrl(url: string): boolean {
  return VIDEO_URL_RE.test(attachmentUrlPath(url));
}

function isPdfAttachmentUrl(url: string): boolean {
  return PDF_URL_RE.test(attachmentUrlPath(url));
}

/** tasks 배열에서 객체 업무만 골라, 가장 최근에 추가된 항목(마지막) */
function getLatestObjectTask(tasks: Project['tasks'] | undefined): TaskItem | null {
  const list = tasks || [];
  const objectTasks = list.filter((t): t is TaskItem => typeof t === 'object' && t !== null);
  return objectTasks.length ? objectTasks[objectTasks.length - 1] : null;
}

/** 최신 업무 1건의 attachments 전체 URL (이미지·영상·PDF 모두 포함, 슬라이드 트랙 소스) */
function getViewerImageUrlsForLatestTask(tasks: Project['tasks'] | undefined): string[] {
  const latest = getLatestObjectTask(tasks);
  if (!latest?.attachments?.length) return [];
  return latest.attachments;
}





const ZoomableImage: React.FC<{ 
  src: string, 
  isFullScreen: boolean,
  toggleFullScreen: () => void
}> = ({ src, isFullScreen, toggleFullScreen }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const resetToFit = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (img && container && img.naturalWidth) {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0) return;
      const sX = rect.width / img.naturalWidth;
      const sY = rect.height / img.naturalHeight;
      const fitScale = Math.min(sX, sY, 1) * 0.95;
      
      setScale(fitScale);
      setPosition({
        x: (rect.width - img.naturalWidth * fitScale) / 2,
        y: (rect.height - img.naturalHeight * fitScale) / 2
      });
      
      setTimeout(() => setIsInitialLoad(false), 50);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const zoomSpeed = 0.0015;
      const delta = -e.deltaY;
      const newScale = Math.min(Math.max(0.01, scale + delta * zoomSpeed * scale), 20);
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const dx = (mouseX - position.x) / scale;
      const dy = (mouseY - position.y) / scale;
      const newX = mouseX - dx * newScale;
      const newY = mouseY - dy * newScale;
      setScale(newScale);
      setPosition({ x: newX, y: newY });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [scale, position]);

  useEffect(() => {
    setIsInitialLoad(true);
    if (imgRef.current && imgRef.current.complete) {
      resetToFit();
    }
  }, [src, resetToFit]);

  useEffect(() => {
    // 전체 화면 전환 시 리사이즈 대응
    const timer = setTimeout(resetToFit, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen, resetToFit]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetToActualSize = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (img && container) {
      const rect = container.getBoundingClientRect();
      setScale(1);
      setPosition({
        x: (rect.width - img.naturalWidth) / 2,
        y: (rect.height - img.naturalHeight) / 2
      });
    }
  }, []);

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div 
      ref={containerRef}
      className={`zoom-container ${isFullScreen ? 'is-fullscreen' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ overflow: 'hidden', width: '100%', height: '100%', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab', background: '#000' }}
    >
      <img 
        ref={imgRef}
        src={src} 
        alt="zoomable"
        onLoad={resetToFit}
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: (isDragging || isInitialLoad) ? 'none' : 'transform 0.1s ease-out',
          opacity: isInitialLoad ? 0 : 1,
          maxWidth: 'none',
          maxHeight: 'none',
          display: 'block'
        }}
        draggable={false}
      />
      
      <div className="zoom-controls-top-right">
        <div className="zoom-controls-group">
          <div className="zoom-menu-wrapper">
            <button className="zoom-menu-trigger" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
              {scale === 1 ? <MousePointer2 size={14} /> : <Frame size={14} />}
              <span className="zoom-percent">{(scale * 100).toFixed(0)}%</span>
              <ChevronDown size={14} />
            </button>
            
            {showMenu && (
              <>
                <div className="zoom-menu-backdrop" onClick={() => setShowMenu(false)} />
                <div className="zoom-dropdown-menu">
                  <div className="menu-section">
                    <div className="menu-label">Recommended</div>
                    <button className="menu-item" onClick={() => { resetToActualSize(); setShowMenu(false); }}>
                      <div className="menu-item-icon">1:1</div>
                      <span className="menu-item-text">Actual size (100%)</span>
                      {Math.abs(scale - 1) < 0.01 && <Check size={14} className="menu-check" />}
                    </button>
                    <button className="menu-item" onClick={() => { resetToFit(); setShowMenu(false); }}>
                      <Frame size={14} />
                      <span className="menu-item-text">Fit to screen</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button 
            className={`zoom-fs-btn ${isFullScreen ? 'active' : ''}`} 
            onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }}
            title={isFullScreen ? 'Exit full screen' : 'Fill screen'}
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="zoom-indicator-minimal">
        <Move size={12} />
        <span>Drag to pan / Ctrl + Wheel to zoom</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { projects, setProjects, teamMembers, loading } = useFirebaseData();
  const isMouseDownOnBackdropRef = useRef(false);

  const thisWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [filters, setFilters] = useState<string[]>(['all', '진행', '보류', '완료']);
  const [showWorkers, setShowWorkers] = useState(false);
  const [showIssues, setShowIssues] = useState(true);
  if (false) console.log(showWorkers, setShowWorkers, showIssues, setShowIssues);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [syncHoverId, setSyncHoverId] = useState<string | null>(null);
  const [activeSummaryFilter, setActiveSummaryFilter] = useState<string | null>(null);
  const [activeIssueTooltipId, setActiveIssueTooltipId] = useState<string | null>(null);
  const [activeTooltipPos] = useState<{ top: number, left: number, side: 'left' | 'right' } | null>(null);

  const [openDelays, setOpenDelays] = useState(false);
  const [openIssues, setOpenIssues] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [taskDragIdx, setTaskDragIdx] = useState<number | null>(null);
  const [activeTaskOriginalIdx, setActiveTaskOriginalIdx] = useState<number | null>(null);
  const [activeVersionIdx, setActiveVersionIdx] = useState<number | null>(null);
  const [showTeamView, setShowTeamView] = useState(false);
  const [_showAllMemberTasks, _setShowAllMemberTasks] = useState(false);
  const [_activeTeamProjectId, _setActiveTeamProjectId] = useState<string | null>(null);
  const [isDualMode, setIsDualMode] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const [orgChartOpen, setOrgChartOpen] = useState(false);
  const [orgChartTab, setOrgChartTab] = useState<'members' | 'sales' | 'cashflow'>('members');
  const childWindowRef = useRef<Window | null>(null);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isWideScreen = windowWidth >= 3800;

  const [prevFilters, setPrevFilters] = useState<string[]>(['all', '진행', '보류', '완료']);

  const toggleIssueFilter = () => {
    setActiveSummaryFilter(prev => {
      const next = prev === 'all-issues' ? null : 'all-issues';
      if (next === 'all-issues') {
        setPrevFilters(filters);
        setFilters([]);
      } else {
        setFilters(prevFilters);
      }
      return next;
    });
  };

  // 시안 뷰어 전체 화면 관리
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isViewerFs, setIsViewerFs] = useState(false);

  const toggleViewerFs = () => {
    setIsViewerFs(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 이슈 텍스트 클릭이거나 툴팁 내부 클릭이면 닫지 않음
      if (target.closest('.task-issue-text') || target.closest('.custom-issue-tooltip')) {
        return;
      }
      setActiveIssueTooltipId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);


  const issueDropdownRef = useRef<HTMLDivElement>(null);
  const delayDropdownRef = useRef<HTMLDivElement>(null);
  const upcomingDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const pmDropdownRef = useRef<HTMLDivElement>(null);
  const [openAssignees, setOpenAssignees] = useState(false);
  const [openPm, setOpenPm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, projectId: string } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    attachments: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assignee: '',
    description: '',
    link: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [taskContextMenu, setTaskContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);
  const [taskPanelMode, setTaskPanelMode] = useState<'new' | 'edit'>('new');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [newlyAddedTaskId, setNewlyAddedTaskId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [taskUploadProgress, setTaskUploadProgress] = useState<number | null>(null);
  const [taskUrlInput, setTaskUrlInput] = useState('');
  const lastSelectedProjectId = useRef<string | null>(null);

  const [tasksPanelWidth, setTasksPanelWidth] = useState(550);
  const isResizingTasksPanel = useRef(false);
  const tasksBodyRef = useRef<HTMLDivElement>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const startResizingTasksPanel = (_e: React.MouseEvent) => {
    isResizingTasksPanel.current = true;
    document.addEventListener('mousemove', handleResizingTasksPanel);
    document.addEventListener('mouseup', stopResizingTasksPanel);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizingTasksPanel = (e: MouseEvent) => {
    if (!isResizingTasksPanel.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300 && newWidth < window.innerWidth * 0.7) {
      setTasksPanelWidth(newWidth);
    }
  };

  const stopResizingTasksPanel = () => {
    isResizingTasksPanel.current = false;
    document.removeEventListener('mousemove', handleResizingTasksPanel);
    document.removeEventListener('mouseup', stopResizingTasksPanel);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // 타임라인 패널 높이 조절용 state
  const [timelinePanelHeight, setTimelinePanelHeight] = useState(250);
  const isResizingTimelinePanel = useRef(false);

  const startResizingTimelinePanel = (_e: React.MouseEvent) => {
    isResizingTimelinePanel.current = true;
    document.addEventListener('mousemove', handleResizingTimelinePanel);
    document.addEventListener('mouseup', stopResizingTimelinePanel);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizingTimelinePanel = (e: MouseEvent) => {
    if (!isResizingTimelinePanel.current) return;
    const newHeight = window.innerHeight - e.clientY;
    // 최소 150px, 최대 500px 또는 화면의 50%
    if (newHeight > 150 && newHeight < Math.min(window.innerHeight * 0.6, 600)) {
      setTimelinePanelHeight(newHeight);
    }
  };

  const stopResizingTimelinePanel = () => {
    isResizingTimelinePanel.current = false;
    document.removeEventListener('mousemove', handleResizingTimelinePanel);
    document.removeEventListener('mouseup', stopResizingTimelinePanel);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const selectedProject = projects.find(p => p.id === selectedId);

  const filteredAndSortedTasks = useMemo(() => {
    if (!selectedProject) return [];
    
    // Normalize and keep original index for reliable reordering
    let tasks = (selectedProject.tasks || []).map((t, index) => {
      let taskObj: any;
      if (typeof t === 'string') {
        taskObj = { text: t, progress: 0, id: `legacy_${t}` };
      } else {
        taskObj = { ...t };
        if (!taskObj.id) taskObj.id = `legacy_${taskObj.text || ''}`;
      }
      return { ...taskObj, _originalIdx: index };
    });
    
    // Filter out invalid tasks (empty text)
    tasks = tasks.filter(t => t && t.text && t.text.trim() !== '');
    
    return tasks;
  }, [selectedProject]);

  // 버전 기반 or 태스크 기반 타임라인 항목 생성 (focusing 계산을 위해 useMemo로 분리)
  const detailTimelineItems = useMemo(() => {
    if (!selectedProject) return [];
    const items: { label: string; start: string; end: string; progress: number; taskId: string }[] = [];
    const versions = selectedProject.versions || [];

    if (versions.length > 0) {
      versions.forEach((v, vidx) => {
        items.push({
          label: v.name,
          start: selectedProject.startDate || '',
          end: selectedProject.endDate || '',
          progress: selectedProject.progress || 0,
          taskId: `v-${vidx}`
        });
      });
    } else {
      filteredAndSortedTasks.forEach((t, tidx) => {
        const taskObj = typeof t === 'string' ? { text: t, startDate: '', endDate: '', progress: 0, id: `t-${tidx}` } : t as any;
        items.push({
          label: taskObj.text || taskObj.name || '업무',
          start: taskObj.startDate || selectedProject.startDate || '',
          end: taskObj.endDate || selectedProject.endDate || '',
          progress: taskObj.progress ?? selectedProject.progress ?? 0,
          taskId: taskObj.id || `t-${tidx}`
        });
      });
    }
    return items;
  }, [selectedProject, filteredAndSortedTasks]);

  const handleTaskDateChange = useCallback(
    (taskId: string, field: 'startDate' | 'endDate', date: string) => {
      if (!selectedProject) return;
      try {
        (selectedProject.tasks || []).map((t) => {
          if (t.id === taskId) {
            return { ...t, [field]: date };
          }
          return t;
        });
        // DB 연결 전 스텁
      } catch (err) {
        console.error('Failed to update task dates:', err);
      }
    },
    [selectedProject],
  );

  const aggregatedViewerInfo = useMemo(() => {
    if (!selectedProject) return [];
    const info: { url: string, taskId: string | null }[] = [];
    
    // 1. 버전 기반 시안 추가 (레거시/버전 데이터 대응)
    if (selectedProject.versions && selectedProject.versions.length > 0) {
      selectedProject.versions.forEach((v, vidx) => {
        if (v.drafts && v.drafts.length > 0) {
          v.drafts.forEach(url => {
            info.push({ url, taskId: `v-${vidx}` }); // 버전도 taskId 형태의 식별자 부여 (동기화용)
          });
        }
      });
    }

    // 2. 업무 기반 첨부파일 추가
    filteredAndSortedTasks.forEach(task => {
      if (task.attachments && task.attachments.length > 0) {
        task.attachments.forEach((url: string) => {
          info.push({ url, taskId: task.id ?? '' });
        });
      }
    });
    return info;
  }, [selectedProject, filteredAndSortedTasks]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // 강조된 항목 해제 로직
      const isInsideSummary = 
        (issueDropdownRef.current && issueDropdownRef.current.contains(event.target as Node)) ||
        (delayDropdownRef.current && delayDropdownRef.current.contains(event.target as Node)) ||
        (upcomingDropdownRef.current && upcomingDropdownRef.current.contains(event.target as Node));
      
      if (!isInsideSummary && highlightedId) {
        setHighlightedId(null);
      }

      if (openIssues && issueDropdownRef.current && !issueDropdownRef.current.contains(event.target as Node)) {
        setOpenIssues(false);
      }
      if (openDelays && delayDropdownRef.current && !delayDropdownRef.current.contains(event.target as Node)) {
        setOpenDelays(false);
      }
      if (openAssignees && assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setOpenAssignees(false);
      }
      if (openPm && pmDropdownRef.current && !pmDropdownRef.current.contains(event.target as Node)) {
        setOpenPm(false);
      }
      if (contextMenu && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openIssues, openDelays, openAssignees, openPm, highlightedId, contextMenu]);

  useEffect(() => {
    let interval: any;
    if (isDualMode) {
      interval = setInterval(() => {
        if (childWindowRef.current && childWindowRef.current.closed) {
          setIsDualMode(false);
          childWindowRef.current = null;
        }
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDualMode]);

  // 프로젝트가 바뀔 때만 초기화 (순서 변경/데이터 업데이트 시에는 선택 유지)
  useEffect(() => {
    if (selectedId && selectedId !== lastSelectedProjectId.current) {
      lastSelectedProjectId.current = selectedId;
      
      const info = aggregatedViewerInfo;
      if (info.length > 0) {
        // 요구사항: 업무내역 중 가장 최상단의 업무의 시안 중 1번 시안을 최초로 보여줌
        const firstTaskWithDrafts = filteredAndSortedTasks.find(t => t.attachments && t.attachments.length > 0);
        if (firstTaskWithDrafts) {
          const taskId = firstTaskWithDrafts.id ?? '';
          const firstIdxOfFirstTask = info.findIndex(curr => curr.taskId === taskId);
          if (firstIdxOfFirstTask !== -1) {
            setSlideIndex(firstIdxOfFirstTask);
            setViewingTaskId(taskId);
          } else {
            setSlideIndex(0);
            setViewingTaskId(info[0].taskId);
          }
        } else {
          setSlideIndex(0);
          setViewingTaskId(info[0].taskId);
        }
      } else {
        setSlideIndex(0);
        setViewingTaskId(null);
      }
      
      setActiveTaskOriginalIdx(null);
      setActiveVersionIdx(null);
    } else if (!selectedId) {
      lastSelectedProjectId.current = null;
      setViewingTaskId(null);
    }
  }, [selectedId, aggregatedViewerInfo.length, filteredAndSortedTasks]);

  // 슬라이드 인덱스 → viewingTaskId 단방향 동기화
  // Next/Prev 버튼으로 슬라이드를 넘기면 그에 맞게 viewingTaskId만 업데이트 (슬라이드 인덱스는 건드리지 않음)
  // 업무 행 클릭 → 해당 업무 첫 이미지로 slideIndex 이동 (onClick 내부에서 직접 처리)
  useEffect(() => {
    if (!selectedId || draggingTaskId || aggregatedViewerInfo.length === 0) return;

    const info = aggregatedViewerInfo;

    // 범위 초과 보정
    if (slideIndex >= info.length) {
      setSlideIndex(Math.max(0, info.length - 1));
      return;
    }

    // 현재 슬라이드가 가리키는 taskId로 viewingTaskId 업데이트만 수행
    const taskIdAtSlide = info[slideIndex]?.taskId ?? null;
    if (viewingTaskId !== taskIdAtSlide) {
      setViewingTaskId(taskIdAtSlide);
    }
  }, [selectedId, aggregatedViewerInfo, slideIndex, draggingTaskId]);

  // viewingTaskId 변경 시 해당 업무 리스트 아이템을 중앙으로 스크롤
  useEffect(() => {
    if (viewingTaskId && tasksBodyRef.current) {
      // 좀 더 정확한 선택을 위해 querySelector 사용
      const selectedItem = tasksBodyRef.current.querySelector('.task-item-viewing') as HTMLElement;
      if (selectedItem) {
        const container = tasksBodyRef.current;
        const containerHeight = container.offsetHeight;
        const itemTop = selectedItem.offsetTop;
        const itemHeight = selectedItem.offsetHeight;
        
        container.scrollTo({
          top: itemTop - (containerHeight / 2) + (itemHeight / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [viewingTaskId]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'new' | 'edit'>('new');
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '', status: 'ongoing', description: '', taskCell: [], collabTeam: '', collabManager: '', pm: '',
    startDate: '', deadline: '', endDate: '', progress: 0, assignees: [], issues: [], tasks: [], versions: [], draftConfirmed: false, thumbnail: '',
    client: '', amount: '', isRepresentative: false,
    builder: '', jobName: ''
  });


  const handleEditFromMenu = (projectId: string) => {
    const p = projects.find(item => item.id === projectId);
    if (p) {
      setFormData({ ...p });
      setModalMode('edit');
      setIsEditModalOpen(true);
    }
    setContextMenu(null);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      // DB 연결 전 스텁
      if (selectedId === id) setSelectedId(null);
      setContextMenu(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!selectedProject) return;
    
    // 현재 뷰어 모드에 따른 전체 이미지 개수 확인
    let totalCount = 0;
    if (aggregatedViewerInfo.length > 0) {
      totalCount = aggregatedViewerInfo.length;
    } else if (selectedProject.versions && selectedProject.versions.length > 0) {
      const vIdx = activeVersionIdx ?? 0;
      totalCount = (selectedProject.versions[vIdx].drafts || []).length;
    } else {
      const tasks = selectedProject.tasks || [];
      if (activeTaskOriginalIdx !== null && tasks[activeTaskOriginalIdx]) {
        const t = tasks[activeTaskOriginalIdx];
        totalCount = (typeof t === 'object' && t !== null ? ((t as any).attachments || []) : []).length;
      } else {
        totalCount = getViewerImageUrlsForLatestTask(selectedProject.tasks).length;
      }
    }

    // 인덱스 범위 초과 방지
    setSlideIndex((prev) => {
      if (totalCount === 0) return 0;
      if (prev >= totalCount) return totalCount - 1;
      return prev;
    });
  }, [selectedProject?.id, selectedProject?.tasks, selectedProject?.versions, activeTaskOriginalIdx, activeVersionIdx, aggregatedViewerInfo.length]);

  const handleSaveProject = async () => {
    if (!formData.name?.trim()) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }
    let finalFormData = { ...formData };

    // 진행중이 아닐 경우 대표업무 지정 강제 해제 (방어 코드)
    const isOngoing = finalFormData.status === 'ongoing' || finalFormData.status === '진행';
    if (finalFormData.isRepresentative && !isOngoing) {
      finalFormData.isRepresentative = false;
    }

    // isRepresentative가 undefined이거나 null인 경우 Firebase updateDoc이 에러를 던지지 않도록 false로 강제 변환
    finalFormData.isRepresentative = !!finalFormData.isRepresentative;

    if (finalFormData.relatedLinks) {
      finalFormData.relatedLinks = finalFormData.relatedLinks.filter((link: any) => {
        if (typeof link === 'object' && link !== null) {
          return link.url && link.url.trim() !== '';
        }
        return typeof link === 'string' && link.trim() !== '';
      });
    }
    
    // 만약 이슈 입력창에 내용이 남아있다면 자동으로 추가
    if (issueInput.trim()) {
      const newIssue = { 
        text: issueInput.trim(), 
        detail: issueDetailInput.trim(),
        date: new Date().toISOString(),
        isPinned: false
      };
      finalFormData.issues = [...(finalFormData.issues || []), newIssue];
      setIssueInput('');
      setIssueDetailInput('');
      setIsAddingIssue(false);
    }

    try {
      if (finalFormData.isRepresentative) {
        const currentTeam = (() => {
          const cellCount = finalFormData.taskCell?.length || 0;
          if (cellCount >= 2 || cellCount === 0) return '셀 협업';
          const cell = finalFormData.taskCell?.[0] || '';
          if (cell === 'UX셀') return 'UX';
          if (cell === '영상셀') return '영상';
          if (cell === '편집셀') return '편집';
          return '셀 협업';
        })();

        const teamProjects = projects.filter(p => {
          if (currentTeam === '셀 협업') {
            const cellCount = p.taskCell?.length || 0;
            if (cellCount >= 2 || cellCount === 0) return true;
            if (cellCount === 1 && !['UX셀', '영상셀', '편집셀'].includes(p.taskCell?.[0] || '')) return true;
            return false;
          }
          const targetCell = currentTeam === "UX" ? 'UX셀' : currentTeam === "영상" ? '영상셀' : '편집셀';
          return p.taskCell?.length === 1 && p.taskCell.includes(targetCell);
        });

        for (const p of teamProjects) {
          if (p.id !== finalFormData.id && p.isRepresentative) {
            // DB 연결 전 스텁
          }
        }
      }

      if (modalMode === 'edit' && finalFormData.id) {
        void finalFormData.id; // DB 연결 전 스텁
      } else {
        // DB 연결 전 스텁
      }
      setIsEditModalOpen(false);
      setFormData({
        name: '', status: 'ongoing', description: '', taskCell: [], collabTeam: '', collabManager: '', pm: '',
        startDate: '', deadline: '', endDate: '', progress: 0, assignees: [], issues: [], tasks: [], versions: [], draftConfirmed: false,
        client: '', amount: '', isRepresentative: false,
        builder: '', jobName: ''
      });
    } catch (error) {
      console.error('Error saving project:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (isEditModalOpen) {
      if (modalMode === 'edit' && selectedProject) {
        setFormData({ 
          ...selectedProject,
          isRepresentative: selectedProject.isRepresentative || false,
          builder: selectedProject.builder || '',
          jobName: selectedProject.jobName || ''
        });
      } else {
        setFormData({
          name: '', status: 'ongoing', description: '', taskCell: [], collabTeam: '', collabManager: '', pm: '',
          startDate: '', deadline: '', endDate: '', progress: 0, assignees: [], issues: [], tasks: [], versions: [], draftConfirmed: false,
          client: '', amount: '', isRepresentative: false,
          builder: '', jobName: ''
        });
      }
    }
  }, [isEditModalOpen, modalMode, selectedProject]);

  const [issueInput, setIssueInput] = useState('');
  const [issueDetailInput, setIssueDetailInput] = useState('');
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const taskFileInputRef = useRef<HTMLInputElement>(null);
  
  const handleAddIssue = () => {
    if (!issueInput.trim()) return;
    const newIssue = { 
      text: issueInput.trim(), 
      detail: issueDetailInput.trim(),
      date: new Date().toISOString(),
      isPinned: false
    };
    setFormData(prev => ({ ...prev, issues: [...(prev.issues || []), newIssue] }));
    setIssueInput('');
    setIssueDetailInput('');
    setIsAddingIssue(false);
  };

  const handlePinIssue = (index: number) => {
    const updatedIssues = (formData.issues || []).map((issue, i) => {
      const issueObj = typeof issue === 'string' ? { text: issue, detail: '', date: new Date().toISOString() } : issue;
      if (i === index) {
        return { ...issueObj, isPinned: !issueObj.isPinned };
      }
      return issueObj;
    });
    setFormData(prev => ({ ...prev, issues: updatedIssues }));
  };
  const handleRemoveIssue = (index: number) => {
    setFormData(prev => ({ ...prev, issues: (prev.issues || []).filter((_, i) => i !== index) }));
  };

  const [editingIssueIndex, setEditingIssueIndex] = useState<number | null>(null);
  const [editingIssueText, setEditingIssueText] = useState('');
  const [editingIssueDetail, setEditingIssueDetail] = useState('');

  const startEditIssue = (index: number, text: string, detail: string = '') => {
    setEditingIssueIndex(index);
    setEditingIssueText(text);
    setEditingIssueDetail(detail);
  };

  const handleUpdateIssue = () => {
    if (editingIssueIndex === null || !editingIssueText.trim()) return;
    const updatedIssues = [...(formData.issues || [])];
    const target = updatedIssues[editingIssueIndex];
    if (typeof target === 'string') {
      updatedIssues[editingIssueIndex] = { 
        text: editingIssueText.trim(), 
        detail: editingIssueDetail.trim(),
        date: new Date().toISOString() 
      };
    } else {
      updatedIssues[editingIssueIndex] = { 
        ...target, 
        text: editingIssueText.trim(),
        detail: editingIssueDetail.trim()
      };
    }
    setFormData({ ...formData, issues: updatedIssues });
    setEditingIssueIndex(null);
    setEditingIssueText('');
    setEditingIssueDetail('');
  };

  const NAS_BASE_URL = 'http://172.16.9.53/00_source/dashboard_img/';
  const UPLOAD_API = 'http://172.16.9.53/upload.php';

  const uploadToNas = async (files: File[]) => {
    if (files.length === 0) return;

    // ── 사전 체크: PHP post_max_size 한계를 프론트에서 미리 경고 ──
    // NAS 서버의 PHP post_max_size 기본값은 보통 8MB~32MB
    // 아래 MAX_FILE_MB 값을 서버 설정에 맞게 조정하세요
    const MAX_FILE_MB = 10240; // MB 단위 (서버 php.ini의 upload_max_filesize 값 이하로 설정)
    const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_BYTES);
    if (oversizedFiles.length > 0) {
      const names = oversizedFiles.map(f => `'${f.name}' (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join(', ');
      alert(`다음 파일이 최대 허용 용량(${MAX_FILE_MB}MB)을 초과합니다:\n${names}\n\n더 작은 파일로 압축하거나, NAS 서버 php.ini의 upload_max_filesize / post_max_size 값을 늘려주세요.`);
      // 용량 초과 파일을 제외하고 나머지만 업로드
      files = files.filter(f => f.size <= MAX_FILE_BYTES);
      if (files.length === 0) return;
    }

    const uploadedUrls: string[] = [];
    setTaskUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        const url = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', UPLOAD_API);
          
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const fileProgress = (ev.loaded / ev.total) * 100;
              const totalProgress = ((i / files.length) * 100) + (fileProgress / files.length);
              setTaskUploadProgress(Math.round(totalProgress));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                if (data.filename) resolve(NAS_BASE_URL + data.filename);
                else reject('서버 응답에 파일명이 없습니다.');
              } catch { reject('응답 해석 오류'); }
            } else if (xhr.status === 413) {
              // Apache/Nginx 레벨 용량 초과
              reject('용량 초과 (413)');
            } else if (xhr.status === 400) {
              // PHP post_max_size 초과 시 $_FILES가 비어 400 반환됨
              // 응답 본문에 "파일이 없음" 같은 메시지가 들어있을 수 있음
              let detail = '';
              try {
                const parsed = JSON.parse(xhr.responseText);
                detail = parsed.message || '';
              } catch { detail = xhr.responseText; }
              const fileMB = (file.size / 1024 / 1024).toFixed(1);
              if (detail.includes('파일이 없') || detail.includes('no file') || file.size > 5 * 1024 * 1024) {
                reject(`용량 초과 (400) — ${fileMB}MB`);
              } else {
                reject(`업로드 실패 (400)${detail ? ': ' + detail : ''}`);
              }
            } else {
              reject(`업로드 실패 (${xhr.status})`);
            }
          };

          xhr.onerror = () => {
            const isHttps = window.location.protocol === 'https:';
            const apiIsHttp = UPLOAD_API.startsWith('http:');
            if (isHttps && apiIsHttp) {
              reject('보안(HTTPS) 페이지에서 일반(HTTP) 서버로 업로드할 수 없습니다. (Mixed Content)');
            } else {
              reject('네트워크 연결 오류 또는 서버 응답 없음 (NAS 서버 상태 확인 필요)');
            }
          };

          xhr.send(formDataUpload);
        });
        uploadedUrls.push(url);
      } catch (err) {
        console.error(err);
        const errStr = String(err);
        if (errStr.includes('용량 초과') || errStr.includes('413') || errStr.includes('400')) {
          const fileMB = (file.size / 1024 / 1024).toFixed(1);
          alert(`'${file.name}' (${fileMB}MB) 업로드 실패\n\n원인: 파일 용량이 NAS 서버 한계를 초과했습니다.\n\n해결 방법:\n• 이미지를 더 작게 압축하거나 (권장: 10MB 이하)\n• NAS 서버 php.ini 설정 변경:\n  upload_max_filesize = 50M\n  post_max_size = 50M`);
        } else {
          alert(`'${file.name}' 업로드에 실패했습니다: ${err}`);
        }
      }
    }

    setTaskFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...uploadedUrls]
    }));
    setTaskUploadProgress(null);
  };

  const handleTaskDraftUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadToNas(Array.from(files));
    if (e.target) e.target.value = '';
  };

  const handleTaskThumbnailDragStart = (e: React.DragEvent, idx: number) => {
    setTaskDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskThumbnailDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (taskDragIdx === null || taskDragIdx === idx) return;

    const newAttachments = [...taskFormData.attachments];
    const draggedItem = newAttachments[taskDragIdx];
    
    // 위치 변경
    newAttachments.splice(taskDragIdx, 1);
    newAttachments.splice(idx, 0, draggedItem);
    
    setTaskDragIdx(idx);
    setTaskFormData({
      ...taskFormData,
      attachments: newAttachments
    });
  };

  const handleTaskThumbnailDragEnd = () => {
    setTaskDragIdx(null);
  };

  const handleSaveNewTask = async () => {
    if (!selectedProject || !taskFormData.title.trim()) return;
    setIsRegistering(true);

    try {
      let newTasks = [...(selectedProject.tasks || [])];

      if (taskPanelMode === 'edit' && editingTaskId) {
        newTasks = newTasks.map(t => {
          const taskObj = typeof t === 'string' ? { id: `task_${Date.now()}`, text: t } : t as any;
          if (taskObj.id === editingTaskId) {
            return {
              ...taskObj,
              text: taskFormData.title,
              progress: taskFormData.progress,
              startDate: taskFormData.startDate,
              endDate: taskFormData.endDate,
              attachments: taskFormData.attachments,
              priority: taskFormData.priority,
              assignee: taskFormData.assignee,
              description: taskFormData.description,
              link: taskFormData.link
            };
          }
          return t;
        });
      } else {
        const taskId = `task_${Date.now()}`;
        const newTask: any = {
          id: taskId,
          text: taskFormData.title,
          progress: taskFormData.progress,
          startDate: taskFormData.startDate,
          endDate: taskFormData.endDate,
          attachments: taskFormData.attachments,
          priority: taskFormData.priority,
          assignee: taskFormData.assignee,
          description: taskFormData.description,
          link: taskFormData.link,
          createdAt: new Date().toISOString()
        };
        newTasks.unshift(newTask);
        setNewlyAddedTaskId(taskId);
        setTimeout(() => setNewlyAddedTaskId(null), 2000);
      }

      // DB 연결 전 스텁
      
      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterSuccess(false);
        // '새 업무 등록' 모드일 때만 폼 초기화 (연속 등록 지원)
        if (taskPanelMode === 'new') {
          setTaskFormData({
            title: '',
            progress: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            attachments: [],
            priority: 'medium',
            assignee: '',
            description: '',
            link: ''
          });
        }
        // 창을 닫지 않고 포커스만 제목으로 이동
        titleInputRef.current?.focus();
      }, 1500);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('업무 저장 중 오류가 발생했습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTaskContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setTaskContextMenu({ x: e.clientX, y: e.clientY, taskId });
  };

  const handleDeleteTask = async (_taskId: string) => {
    if (!selectedProject || !window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      // DB 연결 전 스텁
      setTaskContextMenu(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditTask = (taskId: string) => {
    if (!selectedProject) return;
    const task = (selectedProject.tasks || []).find((t: any, index: number) => {
      const tId = typeof t === 'string' ? `legacy_${index}` : (t.id || `legacy_${index}`);
      return tId === taskId;
    });
    const normalizedTask = typeof task === 'string' ? { text: task, progress: 0 } : task;
    if (normalizedTask) {
      setTaskFormData({
        title: normalizedTask.text || '',
        progress: normalizedTask.progress || 0,
        startDate: normalizedTask.startDate || new Date().toISOString().split('T')[0],
        endDate: normalizedTask.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        attachments: normalizedTask.attachments || [],
        priority: normalizedTask.priority || 'medium',
        assignee: normalizedTask.assignee || '',
        description: normalizedTask.description || '',
        link: normalizedTask.link || ''
      });
      setTaskPanelMode('edit');
      setEditingTaskId(taskId);
      setViewingTaskId(taskId);
      // 현재 선택된 업무의 첫 번째 슬라이드 위치로 이동 (선택 유지)
      setSlideIndex(prev => {
        const firstIdx = aggregatedViewerInfo.findIndex(info => info.taskId === taskId);
        return firstIdx !== -1 ? firstIdx : prev;
      });
      setIsAddTaskModalOpen(true);
    }
    setTaskContextMenu(null);
  };



  // Removed handleAddAttachment and handleRemoveAttachment as they are now merged into tasks
  
  // Timeline scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineLeftRef = useRef<HTMLDivElement>(null);
  const isTimelineView = window.location.search.includes('view=timeline');
  const hasCentered = useRef(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const dayWidth = 120 * zoomLevel;

  const targetScrollLeft = useRef<number | null>(null);
  
  // Drag to scroll refs
  const isDragging = useRef(false);
  const startDragX = useRef(0);
  const startScrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startDragX.current = e.pageX;
    if (scrollRef.current) {
      startScrollLeft.current = scrollRef.current.scrollLeft;
      scrollRef.current.style.cursor = 'grabbing';
      scrollRef.current.style.userSelect = 'none';
    }
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = '';
      scrollRef.current.style.userSelect = '';
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = '';
      scrollRef.current.style.userSelect = '';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.pageX - startDragX.current;
    const nextLeft = startScrollLeft.current - dx;
    
    scrollRef.current.scrollLeft = nextLeft;
  };

  const handleTimelineScroll = () => {
    if (scrollRef.current && timelineLeftRef.current) {
      timelineLeftRef.current.scrollTop = scrollRef.current.scrollTop;
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel(prev => {
          const zoomStep = 0.05;
          const newZoom = prev + (e.deltaY < 0 ? zoomStep : -zoomStep);
          const clampedZoom = Math.max(0.2, Math.min(newZoom, 5));
          
          if (clampedZoom !== prev && scrollRef.current) {
            const rect = scrollRef.current.getBoundingClientRect();
            // Calculate mouse position relative to the scroll container's viewport
            const mouseX = e.clientX - rect.left;
            const scrollLeft = scrollRef.current.scrollLeft;
            const scaleFactor = clampedZoom / prev;
            
            // Maintain the cursor's logical position relative to the content width
            targetScrollLeft.current = (scrollLeft + mouseX) * scaleFactor - mouseX;
          }
          return clampedZoom;
        });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu) setContextMenu(null);
      if (taskContextMenu) setTaskContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [contextMenu, taskContextMenu]);

  useEffect(() => {
    if (targetScrollLeft.current !== null && scrollRef.current) {
      scrollRef.current.scrollLeft = targetScrollLeft.current;
      targetScrollLeft.current = null;
    }
  }, [zoomLevel]);

  // Window Sync Logic: Sync selectedId across parent and child windows
  const selectedIdRef = useRef(selectedId);
  const lastBroadcastId = useRef<string | null>(null);
  
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const channel = new BroadcastChannel('dashboard_sync');
    
    // 부모창: 새로고침 시 자식창을 전체 타임라인(null)으로 초기화
    // 자식창: 부모창에게 현재 선택된 프로젝트 상태 요청 (새로고침 전 상태 유지)
    if (!isTimelineView) {
      channel.postMessage({ type: 'SELECT_PROJECT', id: null });
      lastBroadcastId.current = null;
    } else {
      channel.postMessage({ type: 'REQUEST_SYNC' });
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SELECT_PROJECT') {
        const newId = event.data.id;
        if (selectedIdRef.current !== newId) {
          lastBroadcastId.current = newId; // 동기화로 인한 변경임을 마킹
          setSelectedId(newId);
        }
      } else if (event.data.type === 'REQUEST_SYNC') {
        if (!isTimelineView) {
          channel.postMessage({ type: 'SELECT_PROJECT', id: selectedIdRef.current });
        }
      } else if (event.data.type === 'HOVER_PROJECT') {
        setSyncHoverId(event.data.id);
      } else if (event.data.type === 'UNHOVER_PROJECT') {
        setSyncHoverId(null);
      }
    };
    
    channel.onmessage = handleMessage;
    return () => channel.close();
  }, [isTimelineView]);

  // 사용자의 상호작용으로 변경된 상태를 브로드캐스트
  useEffect(() => {
    if (selectedId !== lastBroadcastId.current) {
      lastBroadcastId.current = selectedId;
      const channel = new BroadcastChannel('dashboard_sync');
      channel.postMessage({ type: 'SELECT_PROJECT', id: selectedId });
      channel.close();
    }
  }, [selectedId]);


  // Helper for computing project status based on data
  const getStatus = (p: Project): ProjectStatus => {
    if (p.hold || p.status === 'holding' || p.status === '홀딩' || p.wait || p.status === 'waiting' || p.status === 'standby' || p.status === 'upcoming' || p.status === '예정') return "대기/홀딩";
    return p.status || "진행";
  };

  const stats = useMemo(() => {
    let total = projects.length;
    let ongoing = 0;
    let hold = 0;
    let completed = 0;
    let issue = 0;

    projects.forEach(p => {
      const s = getStatus(p);
      if (s === 'ongoing' || s === '진행' || s === 'always' || s === 'regular' || s === '상시') {
        ongoing++;
      } else if (s === 'completed' || s === '완료') {
        completed++;
      } else if (s === '대기/홀딩') {
        hold++;
      }

      const issues = p.issues || [];
      const hasPinnedIssue = issues.some((i: any) => typeof i === 'object' && !!i.isPinned);
      if (hasPinnedIssue) {
        issue++;
      }
    });

    return { total, ongoing, hold, completed, issue };
  }, [projects]);





  const issueProjects = useMemo(() => {
    return projects.filter(p => {
      const s = getStatus(p);
      const issues = p.issues || [];
      const hasPinned = issues.some(issue => typeof issue === 'object' && issue.isPinned);
      const isValidStatus = ['ongoing', '진행', '대기/홀딩', 'always', 'regular', '상시', '이슈', 'issue'].includes(s);
      return hasPinned && isValidStatus;
    });
  }, [projects]);


  const delayedProjects = useMemo(() => {
    const t = new Date();
    const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    return projects.filter(p => (p.endDate && p.endDate < todayStr) && (getStatus(p) === 'ongoing' || getStatus(p) === '진행'));
  }, [projects]);

  const upcomingProjects = useMemo(() => {
    const t = new Date();
    const today = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    const nextWeek = today + 7 * 24 * 3600 * 1000;
    
    return projects.filter(p => {
      const s = getStatus(p);
      const isOngoing = s === 'ongoing' || s === '진행';
      if (!isOngoing || !p.endDate) return false;
      
      const endParts = p.endDate.split('-');
      if (endParts.length !== 3) return false;
      const endT = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2])).getTime();
      
      return endT >= today && endT <= nextWeek;
    });
  }, [projects]);

  if (false) console.log(setActiveSummaryFilter, issueProjects, delayedProjects, upcomingProjects);

  // Filtered projects



  const { globalStart, totalDays } = useMemo(() => {
    const validProjects = projects.filter(p => p.status !== 'always' && p.status !== 'regular' && p.startDate && p.endDate);
    
    let minDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    let maxDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime();

    if (validProjects.length > 0) {
      let foundValid = false;
      let minT = Infinity;
      let maxT = -Infinity;
      validProjects.forEach(p => {
        if (typeof p.startDate === 'string' && typeof p.endDate === 'string') {
          const startParts = p.startDate.split('-');
          const endParts = p.endDate.split('-');
          if (startParts.length === 3 && endParts.length === 3) {
            const st = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2])).getTime();
            const et = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2])).getTime();
            if (!isNaN(st) && !isNaN(et)) {
              if (st < minT) minT = st;
              if (et > maxT) maxT = et;
              foundValid = true;
            }
          }
        }
      });
      if (foundValid) {
        minDate = minT;
        maxDate = maxT;
      }
    }

    minDate -= 7 * 24 * 3600 * 1000;
    maxDate += 7 * 24 * 3600 * 1000;

    return { 
      globalStart: new Date(minDate), 
      totalDays: Math.max(Math.ceil((maxDate - minDate) / (1000 * 3600 * 24)), 30) 
    };
  }, [projects]);

  const prevSelectedIdForCentering = useRef<string | null>(selectedId);
  useEffect(() => {
    const isReturningToTimeline = prevSelectedIdForCentering.current !== null && selectedId === null;
    
    if (isTimelineView && scrollRef.current && projects.length > 0) {
      if (!hasCentered.current || isReturningToTimeline) {
        setTimeout(() => {
          if (!scrollRef.current) return;
          const todayOffset = (new Date().getTime() - globalStart.getTime()) / (1000 * 3600 * 24);
          const todayLeft = todayOffset * dayWidth;
          const clientWidth = scrollRef.current.clientWidth;
          scrollRef.current.scrollLeft = Math.max(0, todayLeft - (clientWidth / 2));
        }, 100);
        hasCentered.current = true;
      }
    }
    prevSelectedIdForCentering.current = selectedId;
  }, [isTimelineView, globalStart, dayWidth, projects.length, selectedId]);

  const { scaleDays, dateCells } = useMemo(() => {
    let sDays = 1;
    if (dayWidth < 1.5) sDays = 365;
    else if (dayWidth < 3) sDays = 60;
    else if (dayWidth < 8) sDays = 30;
    else if (dayWidth < 15) sDays = 14;
    else if (dayWidth < 40) sDays = 7;
    else if (dayWidth < 80) sDays = 2;
    else sDays = 1;

    const cells: { index: number, label: string }[] = [];
    for (let i = 0; i < totalDays; i += sDays) {
      const d = new Date(globalStart.getTime() + i * 24 * 3600 * 1000);
      let label = '';
      if (sDays === 1) label = `${d.getMonth()+1}.${String(d.getDate()).padStart(2,'0')}`;
      else if (sDays === 2) label = `${d.getMonth()+1}.${d.getDate()}~`;
      else if (sDays === 7) label = `${d.getMonth()+1}.${String(d.getDate()).padStart(2,'0')}`;
      else if (sDays === 14) label = `${d.getMonth()+1}.${String(d.getDate()).padStart(2,'0')}`;
      else if (sDays === 30) label = `${d.getFullYear()}.${d.getMonth()+1}`;
      else if (sDays === 60) label = `${d.getFullYear()}.${d.getMonth()+1}~`;
      else if (sDays === 365) label = `${d.getFullYear()}년`;
      
      cells.push({ index: i, label });
    }
    return { scaleDays: sDays, dateCells: cells };
  }, [dayWidth, totalDays, globalStart]);

  const timelineProjects = useMemo(() => {
    const statusPriority: Record<string, number> = {
      'ongoing': 1, '진행': 1,
      'issue': 1, '이슈': 1,
      'always': 2, '상시': 2, 'regular': 2
    };

    const sortFn = (a: Project, b: Project) => {
      const sA = getStatus(a);
      const sB = getStatus(b);
      const pA = statusPriority[sA] || 99;
      const pB = statusPriority[sB] || 99;
      if (pA !== pB) return pA - pB;
      return (b.startDate || '').localeCompare(a.startDate || '');
    };

    return projects
      .filter(p => {
        const s = getStatus(p);
        return statusPriority[s] !== undefined;
      })
      .sort(sortFn);
  }, [projects]);

  useEffect(() => {
    if (!loading) {
      // animatedOverallProgress was unused, so we just keep the timer if needed for other side effects or remove it
    }
  }, [loading]);

  if (loading) {
    return <div className="loading">데이터를 불러오는 중...</div>;
  }

  const openChildWindow = async () => {
    let targetLeft = window.screenX + window.outerWidth;
    let targetTop = window.screenY;
    let targetWidth = window.screen.availWidth;
    let targetHeight = window.screen.availHeight;

    try {
      if ('getScreenDetails' in window) {
        const screenDetails = await (window as any).getScreenDetails();
        const currentScreen = screenDetails.currentScreen;
        
        let nextScreen = screenDetails.screens.find((s: any) => s.left >= currentScreen.left + currentScreen.width);
        if (!nextScreen) {
          nextScreen = screenDetails.screens.find((s: any) => s !== currentScreen);
        }

        if (nextScreen) {
          targetLeft = nextScreen.availLeft ?? nextScreen.left;
          targetTop = nextScreen.availTop ?? nextScreen.top;
          targetWidth = nextScreen.availWidth ?? nextScreen.width;
          targetHeight = nextScreen.availHeight ?? nextScreen.height;
        } else {
          // Single monitor fallback
          targetLeft = window.screenX + window.outerWidth;
          targetWidth = window.screen.availWidth - targetLeft;
          if (targetWidth < 800) {
            targetWidth = 1920;
            targetLeft = window.screen.availWidth;
          }
          targetHeight = window.screen.availHeight;
        }
      }
    } catch (err) {
      console.warn("Window Management API failed or denied, using fallback", err);
    }
    const features = `left=${targetLeft},top=${targetTop},width=${targetWidth},height=${targetHeight},menubar=no,toolbar=no,location=no,status=no`;
    setIsDualMode(true);
    childWindowRef.current = window.open(window.location.href.split('?')[0] + '?view=timeline', 'DesignTeamTimelineWindow', features);
  };



  return (
    <div className={`app ${(selectedId && isTimelineView) || isWideScreen ? 'detail-docked' : ''} ${isTimelineView ? 'timeline-only-view' : ''} ${isDualMode && !isTimelineView ? 'dual-mode-parent' : ''}`}>
      <OrgChartPopup
        open={orgChartOpen}
        initialTab={orgChartTab}
        onClose={() => setOrgChartOpen(false)}
      />
      <section className="main">
        <AppHeader
          showTeamView={showTeamView}
          setShowTeamView={setShowTeamView}
          stats={stats}
          filters={filters}
          setFilters={setFilters}
          activeSummaryFilter={activeSummaryFilter}
          setActiveSummaryFilter={setActiveSummaryFilter}
          toggleIssueFilter={toggleIssueFilter}
          onQuickStatClick={(tab) => { setOrgChartTab(tab); setOrgChartOpen(true); }}
          isDualMode={isDualMode}
          onDualModeToggle={() => {
            if (isDualMode) {
              if (childWindowRef.current && !childWindowRef.current.closed) {
                childWindowRef.current.close();
              }
              setIsDualMode(false);
            } else {
              openChildWindow();
            }
          }}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {showTeamView && (
          <TeamOverlay onClose={() => setShowTeamView(false)} />
        )}

        {activeSummaryFilter === '보류' && (
          <OrdersSalesDashboard />
        )}
        {(activeSummaryFilter === '진행' || activeSummaryFilter === '완료') && (
          <div className="preparing-overlay">
            <div className="preparing-content">
              <span className="preparing-icon">🔧</span>
              <span className="preparing-text">준비중입니다</span>
            </div>
          </div>
        )}
        
        {/* <section className="top-card-wrapper">
          <section className="top-card">
            <div className="top-left">
              <div>
                <div className="top-title">전체진행률 <small>(26.05.01 기준)</small></div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${animatedOverallProgress}%` }}></div>
                </div>
                <div className="progress-bottom">
                  <div className="percent">{overallProgress}<span>%</span></div>
                  <div className="count">
                    <span className="count-num">{ongoingProjectsCount}</span>
                    <span className="count-unit">건</span> / 
                    <span className="count-num">{validProjectsCount}</span>
                    <span className="count-unit">건</span>
                  </div>
                </div>
              </div>
              <div className="issue-lines" ref={issueDropdownRef}>
                <div className={`issue-title-row ${activeSummaryFilter === 'all-issues' ? 'active' : ''}`}>
                  <div className="issue-title" onClick={() => setActiveSummaryFilter(activeSummaryFilter === 'all-issues' ? null : 'all-issues')}>
                    <span className="issue">
                      <span className="issue-icon">!</span> 이슈 
                      <span className="count-num"> {issueProjects.length}</span>
                      <span className="count-unit">건</span>
                    </span>
                  </div>
                  <button className={`status-toggle-btn ${openIssues ? 'open' : ''}`} onClick={() => setOpenIssues(!openIssues)}>
                    <ChevronDown size={12} className="toggle-arrow" />
                  </button>
                </div>
                <div className="issue-visible-items">
                  {issueProjects.slice(0, 2).map(p => {
                    const latestRecentIssue = [...(p.issues || [])]
                      .filter(i => i.date && new Date(i.date) >= thisWeekStart)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    
                    return (
                      <div key={p.id} className={`issue-row clickable ${highlightedId === p.id ? 'active' : ''}`} onClick={() => setHighlightedId(p.id === highlightedId ? null : p.id)}>
                        <div className="issue-item-new">
                          <div className="issue-project-name">{p.name}</div>
                          <div className="issue-detail">{latestRecentIssue?.text || p.issues[0]?.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={`issue-list ${openIssues ? 'open' : ''}`}>
                  {issueProjects.map(p => {
                    const latestRecentIssue = [...(p.issues || [])]
                      .filter(i => i.date && new Date(i.date) >= thisWeekStart)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                    return (
                      <div key={p.id} className={`issue-row clickable ${highlightedId === p.id ? 'active' : ''}`} onClick={() => setHighlightedId(p.id === highlightedId ? null : p.id)}>
                        <div className="issue-item-new">
                          <div className="issue-project-name">{p.name}</div>
                          <div className="issue-detail">{latestRecentIssue?.text || p.issues[0]?.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>


          </section>
        </section> */}

      </section>

      <section className={`right ${selectedId ? 'detail-open' : ''}`}>
        {/* ─── 전체 프로젝트 타임라인 (선택된 프로젝트가 없을 때만 자식창에서 표시) ─── */}
        {(isTimelineView || isWideScreen) && !selectedId && (
          <div className="timeline-view" style={{ '--project-count': timelineProjects.length } as React.CSSProperties}>
          <div className="detail-top timeline-header">
            <div className="detail-top-left">
              <div className="side-left-group">
                <div className="side-title-container">
                  <div className="side-title-wrap">
                    <div className="back-btn" style={{ background: 'transparent', cursor: 'default' }}>
                      <Layout size={20} color="#00C896" />
                    </div>
                    <div className="detail-title-info">
                      <div className="detail-main-title">
                        <span className="side-title-main">디자인팀 전체 타임라인</span>
                      </div>
                      {/* <div className="side-desc-text">Design Team Total Project Roadmap</div> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="detail-top-right">
              {/* Optional: Add timeline specific actions here if needed */}
            </div>
          </div>
          <div className="timeline-body">
            <div className="timeline-left" ref={timelineLeftRef} onWheel={(e) => {
              if (scrollRef.current) scrollRef.current.scrollTop += e.deltaY;
            }}>
              <div className="label-head">업무명 / 작업자</div>
              {timelineProjects.map(p => (
                <div key={p.id} 
                     className={`label-row ${syncHoverId === p.id ? 'sync-hovered' : ''}`} 
                     onClick={() => setSelectedId(p.id)} 
                     style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'inline' }}>
                    {p.builder && <span style={{ fontWeight: 400 }}>{`[${p.builder}] `}</span>}
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    {p.jobName && <span style={{ fontWeight: 400, opacity: 0.7 }}>{` | ${p.jobName}`}</span>}
                  </span>
                  <small>{p.pm} · {p.taskCell && p.taskCell.length >= 2 ? '셀 협업' : (p.taskCell?.[0] || '셀 협업')}</small>
                </div>
              ))}
            </div>
            <div 
              className="timeline-scroll" 
              ref={scrollRef}
              onScroll={handleTimelineScroll}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              <div className="timeline-inner" style={{ '--cell-width': `${scaleDays * dayWidth}px`, width: `${totalDays * dayWidth}px` } as React.CSSProperties}>
                <div className="timeline-grid">
                  {dateCells.map(c => (
                    <div key={c.index} className="grid-line" style={{ left: `${(c.index + scaleDays / 2) * dayWidth}px` }} />
                  ))}
                </div>
                <div className="date-row">
                  {dateCells.map(c => (
                    <div key={c.index} className="date-cell" style={{ width: `${scaleDays * dayWidth}px`, minWidth: `${scaleDays * dayWidth}px` }}>{c.label}</div>
                  ))}
                </div>
                <div className="timeline-rows">
                  {timelineProjects.map(p => {
                    let startOffset = 0;
                    let durationDays = 1;
                    
                    if (typeof p.startDate === 'string') {
                      const startParts = p.startDate.split('-');
                      if (startParts.length === 3) {
                        const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
                        startOffset = (start.getTime() - globalStart.getTime()) / (1000 * 3600 * 24);
                        
                        if (typeof p.endDate === 'string') {
                          const endParts = p.endDate.split('-');
                          if (endParts.length === 3) {
                            const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
                            durationDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
                          }
                        }
                      }
                    }
                    
                    
                    const left = startOffset * dayWidth;
                    const width = Math.max(durationDays * dayWidth, dayWidth);
                    const pStatus = getStatus(p);
                    return (
                      <div key={p.id} className={`t-row ${syncHoverId === p.id ? 'sync-hovered' : ''}`}>
                        <div className={`plan-bar team-total-bar ${pStatus === 'issue' || p.status === 'issue' ? 'issue-bar' : ''}`} 
                             style={{ 
                               left: `${left}px`, 
                               width: `${width}px`
                             }}>
                          <div className="bar-progress-fill" 
                               style={{ 
                                 width: `${p.progress || 0}%`,
                                 background: (pStatus === '진행' || pStatus === '상시') ? 'linear-gradient(180deg, #168044 0%, #0e562d 100%)' : 
                                             (pStatus === '대기/홀딩') ? 'linear-gradient(180deg, #d97706 0%, #a15500 100%)' : 
                                             (pStatus === '완료') ? 'linear-gradient(180deg, #888888 0%, #555555 100%)' : 'linear-gradient(180deg, #666 0%, #444 100%)'
                               }} />
                          <span className="bar-project-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
                            {p.builder && <span style={{ fontWeight: 400 }}>{`[${p.builder}] `}</span>}
                            <span style={{ fontWeight: 600 }}>{p.name}</span>
                            {p.jobName && <span style={{ fontWeight: 400, opacity: 0.7 }}>{` | ${p.jobName}`}</span>}
                          </span>
                          <div className="duration-badge">{p.progress || 0}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="today-line" style={{ left: `${((new Date().getTime() - globalStart.getTime()) / (1000 * 3600 * 24)) * dayWidth}px` }} />
                <div className="today-badge" style={{ left: `${((new Date().getTime() - globalStart.getTime()) / (1000 * 3600 * 24)) * dayWidth}px` }}>
                  TODAY ({new Date().getMonth() + 1}.{String(new Date().getDate()).padStart(2, '0')})
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ─── 프로젝트 상세 정보 (프로젝트가 선택되었을 때만 자식창에서 표시) ─── */}
        {selectedId && (isTimelineView || isWideScreen) && (
          <div className="detail-view">
          <div className="detail-top">
            <div className="detail-top-left">
              <div className="side-left-group">
                <div className="side-title-container">
                  <div className="side-title-wrap">
                    <button className="back-btn" onClick={() => setSelectedId(null)} title="뒤로가기">
                      <ChevronLeft size={20} />
                    </button>
                    <div className="detail-title-info">
                      <div className="detail-main-title">
                        <span className="side-title-main">
                          {selectedProject ? (
                            <span style={{ display: 'inline' }}>
                              {selectedProject.builder && <span style={{ fontWeight: 400 }}>{`[${selectedProject.builder}] `}</span>}
                              <span style={{ fontWeight: 600 }}>{selectedProject.name}</span>
                              {selectedProject.jobName && <span style={{ fontWeight: 400, opacity: 0.7 }}>{` | ${selectedProject.jobName}`}</span>}
                            </span>
                          ) : (
                            '업무 상세'
                          )}
                        </span>
                        {selectedProject?.status === 'issue' && (
                          <div className="detail-issue-inline show">이슈 확인 필요</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {selectedProject?.description && (
                  <div className="side-desc-text-top">
                    {selectedProject.description}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', paddingRight: '20px' }}>
                <div className="detail-related-links" style={{ display: 'flex', gap: '6px' }}>
                  {selectedProject?.relatedLinks && selectedProject.relatedLinks.map((link, idx) => {
                    const isObj = typeof link === 'object' && link !== null;
                    const url = isObj ? (link as any).url : (link as string);
                    const title = isObj ? (link as any).title : `링크 ${idx + 1}`;

                    if (!url || typeof url !== 'string' || !url.trim()) return null;

                    return (
                      <a key={idx} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="related-link-btn" title={title}>
                        <Link2 size={14} />
                        <span>{title || `링크 ${idx + 1}`}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="detail-top-right">
              {/* 작업셀 뱃지 표시 */}
              <div className="detail-cell-badges">
                {(!selectedProject?.taskCell || selectedProject.taskCell.length === 0) ? (
                  <span className="detail-cell-badge cell-협업">셀 협업</span>
                ) : (
                  selectedProject.taskCell.map((cell: string) => (
                    <span key={cell} className={`detail-cell-badge cell-${cell.replace('셀', '')}`}>
                      {cell}
                    </span>
                  ))
                )}
              </div>
              <button className="header-action-btn edit-btn" onClick={() => { setModalMode('edit'); setIsEditModalOpen(true); }}>
                <Edit2 size={14} />
              </button>
              {!isTimelineView && (
                <button className="detail-close-btn" onClick={() => setSelectedId(null)} title="닫기">
                  <X size={24} />
                </button>
              )}
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-layout">
              {/* ─── 상단: 시안 뷰어 + 업무내역 ─── */}
              <div className="detail-top-panels">
                {/* 시안 뷰어 영역 */}
                <div className={`detail-viewer-panel ${isAddTaskModalOpen ? 'form-open' : ''} ${isViewerFs ? 'is-fs' : ''}`} ref={viewerRef} style={{ flex: '1 1 0' }}>
                  {(() => {
                    let viewerImageUrls: string[] = [];
                    if (aggregatedViewerInfo.length > 0) {
                      viewerImageUrls = aggregatedViewerInfo.map(info => info.url);
                    } else if (selectedProject?.versions && selectedProject.versions.length > 0) {
                      const vIdx = activeVersionIdx ?? 0;
                      viewerImageUrls = selectedProject.versions[vIdx].drafts || [];
                    }
                    const count = viewerImageUrls.length;

                    // ─── 업무 경계 탐색 로직 계산 ───
                    const currentTaskId = aggregatedViewerInfo[slideIndex]?.taskId ?? null;
                    const firstIdxOfCurrentTask = currentTaskId
                      ? aggregatedViewerInfo.findIndex(info => info.taskId === currentTaskId)
                      : -1;
                    const lastIdxOfCurrentTask = currentTaskId
                      ? aggregatedViewerInfo.reduce((acc, curr, idx) => curr.taskId === currentTaskId ? idx : acc, -1)
                      : -1;
                    const currentTaskOrderIdx = filteredAndSortedTasks.findIndex(t => t.id === currentTaskId);

                    // 아래 리스트 (다음 업무): 시안이 있는 다음 업무
                    const nextTaskWithDrafts = filteredAndSortedTasks
                      .slice(currentTaskOrderIdx + 1)
                      .find(t => t.attachments && t.attachments.length > 0);
                    // 위 리스트 (이전 업무): 시안이 있는 이전 업무
                    const prevTaskWithDrafts = currentTaskOrderIdx > 0
                      ? [...filteredAndSortedTasks].slice(0, currentTaskOrderIdx).reverse()
                          .find(t => t.attachments && t.attachments.length > 0)
                      : undefined;

                    // 좌측 버튼: 태스크 내 이전 슬라이드 / 태스크 첫 슬라이드에서 아래 업무 마지막 시안으로
                    const isAtFirstOfTask = count > 0 && slideIndex === firstIdxOfCurrentTask;
                    const canGoLeft = !isAtFirstOfTask || !!nextTaskWithDrafts;
                    const handleLeftClick = () => {
                      if (!isAtFirstOfTask) {
                        setSlideIndex(prev => Math.max(0, prev - 1));
                      } else if (nextTaskWithDrafts) {
                        // 아래 업무의 마지막 시안으로 이동
                        const nextTaskLastIdx = aggregatedViewerInfo.reduce(
                          (acc, curr, idx) => curr.taskId === nextTaskWithDrafts.id ? idx : acc, -1
                        );
                        if (nextTaskLastIdx !== -1) setSlideIndex(nextTaskLastIdx);
                      }
                    };

                    // 우측 버튼: 태스크 내 다음 슬라이드 / 태스크 마지막 슬라이드에서 위 업무로
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
                      <>
                        {count > 1 && canGoLeft && (
                          <button className="arrow arrow-left" onClick={handleLeftClick}>
                            <ChevronLeft size={32} />
                          </button>
                        )}
                        <div className="slide-wrap">
                            <div className="slide-track" style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
                            {count > 0 ? (
                              viewerImageUrls.map((url, i) => {
                                const isImg = isImageAttachmentUrl(url);
                                const isVid = isVideoAttachmentUrl(url);
                                const isPdf = isPdfAttachmentUrl(url);
                                return (
                                  <div key={`${url}-${i}`} className="slide">
                                    <div className="slide-content-box">
                                      {isImg ? (
                                        <ZoomableImage 
                                          src={url} 
                                          isFullScreen={isViewerFs}
                                          toggleFullScreen={toggleViewerFs}
                                        />
                                      ) : isVid ? (
                                        <video 
                                          key={url}
                                          controls 
                                          className="slide-video" 
                                          playsInline
                                          preload="auto"
                                        >
                                          <source src={url} type="video/mp4" />
                                          <source src={url} type="video/webm" />
                                          <source src={url} type="video/ogg" />
                                          영상을 재생할 수 없는 브라우저입니다.
                                        </video>
                                      ) : isPdf ? (
                                        <div className="pdf-viewer-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                                          <iframe src={url} title="pdf-view" className="slide-pdf" />
                                          <div className="pdf-controls-top-right" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 110 }}>
                                            <button 
                                              className={`zoom-fs-btn ${isViewerFs ? 'active' : ''}`} 
                                              onClick={(e) => { e.stopPropagation(); setIsViewerFs(!isViewerFs); }}
                                              title={isViewerFs ? 'Exit full screen' : 'Full screen'}
                                            >
                                              {isViewerFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="slide-text">📄 첨부파일</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="slide">
                                <div className="slide-text">
                                  등록된 시안 파일이 없습니다.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="slide-meta-fixed">
                          {(() => {
                            if (count === 0) return '0 / 0';
                            if (!currentTaskId) return `${slideIndex + 1} / ${count}`;
                            const taskInfo = aggregatedViewerInfo.filter(info => info.taskId === currentTaskId);
                            const relativeIdx = taskInfo.findIndex(info => info.url === aggregatedViewerInfo[slideIndex].url);
                            return `${relativeIdx + 1} / ${taskInfo.length}`;
                          })()}
                        </div>
                        {count > 1 && canGoRight && (
                          <button className="arrow arrow-right" onClick={handleRightClick}>
                            <ChevronRight size={32} />
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 업무 추가 패널 */}
                {isAddTaskModalOpen && (
                  <div className="detail-add-task-panel" onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') handleSaveNewTask();
                    if (e.key === 'Escape') {
                      setTaskFormData({
                        title: '',
                        progress: 0,
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                        attachments: [],
                        priority: 'medium',
                        assignee: '',
                        description: '',
                        link: ''
                      });
                    }
                  }}>
                    <div className="panel-header">
                      <div className="panel-header-top">
                        <h3>{taskPanelMode === 'edit' ? '업무 정보 수정' : '새 업무 등록'}</h3>
                        <button className="panel-close-btn" onClick={() => {
                          setIsAddTaskModalOpen(false);
                          setEditingTaskId(null);
                        }}>
                          <X size={20} />
                        </button>
                      </div>
                      <span className="subtitle">{taskPanelMode === 'edit' ? '업무 정보를 수정한 후 등록을 눌러주세요' : '입력 후 Enter 또는 ↵ 등록'}</span>
                      <div className="header-divider" />
                    </div>
                    <div className="panel-body">
                      {/* 제목 필드 */}
                      <div className="form-group title-field-wrap">
                        <label className="label-required">업무 제목</label>
                        <input 
                          ref={titleInputRef}
                          type="text" 
                          maxLength={50}
                          value={taskFormData.title} 
                          onChange={e => setTaskFormData({...taskFormData, title: e.target.value})}
                          placeholder="업무 제목을 입력하세요"
                        />
                        <span className="char-counter">{taskFormData.title.length}/50</span>
                      </div>

                      {/* 업무 상세 내용 필드 */}
                      <div className="form-group description-field-wrap">
                        <label>업무 상세 내용</label>
                        <textarea
                          rows={4}
                          value={taskFormData.description || ''}
                          onChange={e => setTaskFormData({...taskFormData, description: e.target.value})}
                          placeholder="업무 상세 내용을 입력하세요 (줄바꿈 가능)"
                          className="form-textarea"
                          style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                        />
                      </div>

                      {/* 기간 설정 */}
                      <div className="form-row">
                        <div className="form-group">
                          <label>시작일</label>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type="date" 
                              style={{ width: '100%' }}
                              value={taskFormData.startDate} 
                              className={taskFormData.endDate && taskFormData.startDate > taskFormData.endDate ? 'date-error' : ''}
                              onChange={e => setTaskFormData({...taskFormData, startDate: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>종료일</label>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type="date" 
                              style={{ width: '100%' }}
                              value={taskFormData.endDate} 
                              className={taskFormData.endDate && taskFormData.startDate > taskFormData.endDate ? 'date-error' : ''}
                              onChange={e => setTaskFormData({...taskFormData, endDate: e.target.value})}
                            />
                            {taskFormData.endDate && taskFormData.startDate > taskFormData.endDate && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, color: '#FF4444', fontSize: '11px', marginTop: '4px' }}>
                                종료일은 시작일보다 빠를 수 없습니다.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 진행률 */}
                      <div className="form-group">
                        <div className="progress-row-container">
                          <label>진행률</label>
                          <div className="slider-wrap">
                            <input 
                              type="range" 
                              min="0" max="100" 
                              className="custom-slider"
                              value={taskFormData.progress} 
                              onChange={e => setTaskFormData({...taskFormData, progress: parseInt(e.target.value)})}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                                  setTaskFormData(p => ({ ...p, progress: Math.min(100, p.progress + 1) }));
                                } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                                  setTaskFormData(p => ({ ...p, progress: Math.max(0, p.progress - 1) }));
                                }
                              }}
                            />
                          </div>
                          <span className="current-val">{taskFormData.progress}%</span>
                        </div>
                        <div className="progress-shortcuts">
                          {[0, 25, 50, 75, 100].map(val => (
                            <button 
                              key={val} 
                              className={`shortcut-chip ${taskFormData.progress === val ? 'active' : ''}`}
                              onClick={() => setTaskFormData({...taskFormData, progress: val})}
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 관련 링크 */}
                      <div className="form-group">
                        <label>관련 링크 (선택)</label>
                        <div style={{ position: 'relative' }}>
                          <Link2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                          <input 
                            type="url" 
                            className="link-field"
                            style={{ width: '100%', textIndent:'20px' }}
                            value={taskFormData.link} 
                            onChange={e => setTaskFormData({...taskFormData, link: e.target.value})}
                            placeholder="연결할 URL을 입력하세요 (https://...)"
                          />
                        </div>
                      </div>

                      {/* 이미지 첨부 */}
                      <div className="form-group">
                        <label>시안 이미지 (선택)</label>
                        <div className="dropzone" onClick={() => taskFileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={async e => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length > 0) {
                            await uploadToNas(files);
                          }
                        }}>
                          {taskUploadProgress !== null ? (
                            <div className="upload-progress-container">
                              <div className="upload-progress-bar" style={{ width: `${taskUploadProgress}%` }} />
                              <span className="upload-progress-text">업로드 중... {taskUploadProgress}%</span>
                            </div>
                          ) : (
                            <>
                              <Paperclip size={24} />
                              <span>클릭 또는 드래그하여 업로드</span>
                            </>
                          )}
                        </div>
                        <div className="task-url-input-wrap" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" 
                            className="task-url-input"
                            placeholder="이미지 또는 동영상 URL을 입력하세요" 
                            value={taskUrlInput}
                            onChange={e => setTaskUrlInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (taskUrlInput.trim()) {
                                  setTaskFormData(p => ({ ...p, attachments: [...p.attachments, taskUrlInput.trim()] }));
                                  setTaskUrlInput('');
                                }
                              }
                            }}
                            style={{ 
                              flex: 1, 
                              background: '#1f2937', 
                              border: '1px solid #374151', 
                              borderRadius: '6px', 
                              padding: '8px 12px', 
                              color: '#fff',
                              fontSize: '13px'
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              if (taskUrlInput.trim()) {
                                setTaskFormData(p => ({ ...p, attachments: [...p.attachments, taskUrlInput.trim()] }));
                                setTaskUrlInput('');
                              }
                            }}
                            style={{
                              padding: '0 16px',
                              background: '#374151',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          >
                            추가
                          </button>
                        </div>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,video/*,.mp4,.webm,.ogg,.mov,.m4v,.avi,.mkv,.wmv"
                          onChange={handleTaskDraftUpload}
                          ref={taskFileInputRef}
                          style={{ display: 'none' }}
                        />
                        {taskFormData.attachments.length > 0 && (
                          <div className="v-draft-grid" style={{ marginTop: '12px' }}>
                            {taskFormData.attachments.map((url, i) => {
                              const realIdx = i;
                              const isSelected = aggregatedViewerInfo[slideIndex]?.url === url;
                              return (
                                <div 
                                  key={url} 
                                  className="v-draft-item" 
                                  draggable
                                  onDragStart={(e) => handleTaskThumbnailDragStart(e, realIdx)}
                                  onDragOver={(e) => handleTaskThumbnailDragOver(e, realIdx)}
                                  onDragEnd={handleTaskThumbnailDragEnd}
                                  style={{ 
                                    width: '100%', 
                                    height: '60px', 
                                    cursor: taskDragIdx === realIdx ? 'grabbing' : 'grab',
                                    border: isSelected ? '2px solid rgb(0 196 113)' : '1px solid #4b5563',
                                    boxShadow: isSelected ? 'rgb(0 196 113) 0px 0px 2px' : 'none',
                                    transition: 'all 0.15s ease',
                                    opacity: taskDragIdx === realIdx ? 0.35 : 1,
                                    transform: taskDragIdx === realIdx ? 'scale(0.9)' : 'none'
                                  }}
                                  onClick={() => {
                                    const foundIdx = aggregatedViewerInfo.findIndex(info => info.url === url);
                                    if (foundIdx !== -1) {
                                      setSlideIndex(foundIdx);
                                    }
                                  }}
                                >
                                  {isImageAttachmentUrl(url) ? (
                                    <img src={url} alt="draft" />
                                  ) : isVideoAttachmentUrl(url) ? (
                                    <video 
                                      key={url}
                                      className="v-draft-video" 
                                      muted 
                                      playsInline 
                                      loop
                                      controls
                                      preload="metadata"
                                      onMouseOver={e => e.currentTarget.play()} 
                                      onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    >
                                      <source src={url} type="video/mp4" />
                                      <source src={url} type="video/webm" />
                                      <source src={url} type="video/ogg" />
                                    </video>
                                  ) : (
                                    <div className="thumb-vid-icon"><Film size={14} /></div>
                                  )}
                                  <button className="v-draft-del" onClick={(e) => {
                                    e.stopPropagation();
                                    setTaskFormData({
                                      ...taskFormData,
                                      attachments: taskFormData.attachments.filter((_, idx) => idx !== realIdx)
                                    });
                                  }}>
                                    <X size={12} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="panel-footer">
                      <button 
                        className={`register-btn ${registerSuccess ? 'success-state' : ''}`}
                        disabled={!taskFormData.title.trim() || isRegistering}
                        onClick={handleSaveNewTask}
                      >
                        {isRegistering ? (
                          <>
                            <div className="spinner" />
                            <span>{taskPanelMode === 'edit' ? '수정 중...' : '등록 중...'}</span>
                          </>
                        ) : registerSuccess ? (
                          <>
                            <Check size={20} />
                            <span>{taskPanelMode === 'edit' ? '업무 수정 완료' : '업무 등록 완료'}</span>
                          </>
                        ) : (
                          taskPanelMode === 'edit' ? '수정하기' : '등록하기'
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div className="tasks-panel-resizer" onMouseDown={startResizingTasksPanel} />
                <div className="detail-tasks-panel" style={{ width: `${tasksPanelWidth}px`, flex: `0 0 ${tasksPanelWidth}px`, padding: '20px 20px 20px 0px' }}>
                  <div className="panel-header" style={{ marginBottom: '20px', paddingLeft: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#F9FAFB' }}>업무 내역</span>
                        <span className="task-count-badge">{(selectedProject?.tasks || []).length}개</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                        <button className="detail-task-add-full-btn" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => {
                          if (isAddTaskModalOpen && taskPanelMode === 'new') {
                            setIsAddTaskModalOpen(false);
                            setEditingTaskId(null);
                          } else {
                            setIsAddTaskModalOpen(true);
                            setTaskPanelMode('new');
                            setEditingTaskId(null);
                            setTaskFormData({
                              title: '',
                              progress: 0,
                              startDate: new Date().toISOString().split('T')[0],
                              endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                              attachments: [],
                              priority: 'medium',
                              assignee: '',
                              description: '',
                              link: ''
                            });
                          }
                        }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`detail-tasks-body ${draggingTaskId ? 'is-dragging' : ''}`} ref={tasksBodyRef}>
                    {filteredAndSortedTasks.length > 0 ? (
                      filteredAndSortedTasks.map((task, idx) => {
                        const isNew = task.id === newlyAddedTaskId;
                        const status = (task.progress ?? 0) >= 100 ? 'done' : (task.progress ?? 0) > 0 ? 'ongoing' : 'waiting';
                        
                        return (
                          <div 
                            key={task.id || idx} 
                            className={`detail-task-row ${isNew ? 'task-item-new task-item-highlight' : ''} ${task.id === editingTaskId ? 'task-item-editing' : ''} ${task.id === viewingTaskId ? 'task-item-viewing' : ''} ${draggingTaskId === task.id ? 'dragging' : ''}`}
                            draggable={true}
                            onDragStart={() => setDraggingTaskId(task.id ?? null)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('drag-over');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('drag-over');
                            }}
                            onDragEnd={() => {
                              setDraggingTaskId(null);
                              document.querySelectorAll('.detail-task-row').forEach(el => el.classList.remove('drag-over'));
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('drag-over');
                              document.querySelectorAll('.detail-task-row').forEach(el => el.classList.remove('drag-over'));
                              
                              if (!draggingTaskId || draggingTaskId === task.id) return;
                              
                              // Find original indices from our memoized list
                              const fromTask = filteredAndSortedTasks.find(t => t.id === draggingTaskId);
                              const toTask = filteredAndSortedTasks.find(t => t.id === task.id);
                              
                              if (!fromTask || !toTask) return;
                              
                              const fromIdx = fromTask._originalIdx;
                              const toIdx = toTask._originalIdx;
                              
                              const originalTasks = [...(selectedProject?.tasks || [])];
                              const [movedTask] = originalTasks.splice(fromIdx, 1);
                              originalTasks.splice(toIdx, 0, movedTask);
                              
                              // Update local state immediately for snappy UI
                              setProjects(prev => prev.map(p => p.id === selectedProject?.id ? { ...p, tasks: originalTasks } : p));
                              
                              // Update Firestore
                              try {
                                // DB 연결 전 스텁
                              } catch (err) {
                                console.error('Failed to reorder tasks:', err);
                              }
                              setDraggingTaskId(null);
                            }}
                            onContextMenu={(e) => handleTaskContextMenu(e, task.id ?? '')}
                            onClick={() => {
                              setViewingTaskId(task.id ?? null);
                              const firstIdx = aggregatedViewerInfo.findIndex(info => info.taskId === task.id);
                              if (firstIdx !== -1) {
                                setSlideIndex(firstIdx);
                              }
                              
                              if (isAddTaskModalOpen) {
                                handleEditTask(task.id ?? '');
                              }
                            }}
                          >
                            <div className="task-row-content">
                              <div className="task-row-top">
                                <div className="detail-task-date">
                                  {(task.date || task.startDate || '').replace(/^\d{4}-/, '').replace('-', '/')}
                                  {task.endDate && (
                                    <span className="date-sep">~{(task.endDate || '').replace(/^\d{4}-/, '').replace('-', '/')}</span>
                                  )}
                                </div>
                                  {typeof (task as any).link === 'string' && (task as any).link.trim() !== '' && (
                                    <a 
                                      href={(task as any).link} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="task-link-btn"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <ExternalLink size={10} /> 바로가기
                                    </a>
                                  )}
                                  <div className="task-info-right">
                                    {task.attachments && task.attachments.length > 0 && (
                                      <div className="task-attachment-indicator" title={`${task.attachments.length}개의 시안 포함`}>
                                        <Image size={16} />
                                      </div>
                                    )}
                                    <span className={`detail-task-badge ${status}`}>
                                      {(task.progress ?? 0) >= 100 ? '완료' : `${task.progress ?? 0}%`}
                                    </span>
                                  </div>
                              </div>
                              <div className="task-row-bottom">
                                <span className="detail-task-name">
                                  {task.text}
                                </span>
                              </div>
                              {task.id === viewingTaskId && task.description && (
                                <div className="detail-task-desc">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-state">
                        <Clipboard size={48} />
                        <span className="empty-title">등록된 업무가 없습니다</span>
                        <span className="empty-desc">상단 업무 추가 버튼으로 새 업무를 등록해보세요</span>
                      </div>
                    )}
                  </div>

                </div>

                  </div>

                  {/* ─── 하단: 업무별 타임라인 ─── */}
                  <TimelinePanel
                    selectedProject={selectedProject}
                    selectedId={selectedId}
                    detailTimelineItems={detailTimelineItems}
                    viewingTaskId={viewingTaskId}
                    setViewingTaskId={setViewingTaskId}
                    onTaskDateChange={handleTaskDateChange}
                    timelinePanelHeight={timelinePanelHeight}
                    startResizingTimelinePanel={startResizingTimelinePanel}
                  />
                </div>
              </div>
          </div>
        )}
      </section>

      {isEditModalOpen && (() => {
        return (
          <div 
            className="edit-modal-backdrop" 
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                isMouseDownOnBackdropRef.current = true;
              } else {
                isMouseDownOnBackdropRef.current = false;
              }
            }}
            onMouseUp={(e) => {
              if (e.target === e.currentTarget && isMouseDownOnBackdropRef.current) {
                setIsEditModalOpen(false);
              }
              isMouseDownOnBackdropRef.current = false;
            }}
          >
            <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="edit-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '28px' }}>
              <h3>{modalMode === 'edit' ? '업무 정보 수정' : '새 업무 등록'}</h3>
              {modalMode === 'edit' && (() => {
                const isOngoing = formData.status === 'ongoing' || formData.status === '진행';
                return (
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      cursor: isOngoing ? 'pointer' : 'not-allowed', 
                      fontSize: '14.5px', 
                      fontWeight: 700, 
                      color: isOngoing ? '#684e42' : '#a0a0a0', 
                      userSelect: 'none' 
                    }}
                  >
                    <input 
                      type="checkbox" 
                      disabled={!isOngoing}
                      checked={isOngoing && (formData.isRepresentative || false)} 
                      onChange={e => setFormData({ ...formData, isRepresentative: e.target.checked })} 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        accentColor: '#684e42', 
                        cursor: isOngoing ? 'pointer' : 'not-allowed' 
                      }}
                    />
                    <span>대표 업무 지정 {!isOngoing && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#cc8888', marginLeft: '4px' }}>(진행중인 업무만 설정 가능)</span>}</span>
                  </label>
                );
              })()}
            </div>
            
            <div className="edit-modal-body">
              {/* 기본 정보 그룹 (좌우 구분선 레이아웃) */}
              <div className="form-section-group basic-info-group">
                <div className="form-split-layout">
                  {/* 왼쪽 영역 (가족사, 협업부서, 협업담당자) */}
                  <div className="form-left-panel">
                    <div className="form-group">
                      <label>요청 가족사</label>
                      <input 
                        type="text" 
                        placeholder="가족사를 입력하세요" 
                        value={formData.builder || ''} 
                        onChange={e => setFormData({...formData, builder: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label>협업팀</label>
                      <input type="text" placeholder="협업 부서/팀명" value={formData.collabTeam || ''} onChange={e => setFormData({...formData, collabTeam: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>협업 담당자</label>
                      <input type="text" placeholder="협업 담당자 성함" value={formData.collabManager || ''} onChange={e => setFormData({...formData, collabManager: e.target.value})} />
                    </div>
                  </div>

                  {/* 세로 구분선 */}
                  <div className="form-vertical-divider" />

                  {/* 오른쪽 영역 (프로젝트명, 업무명, 발주처, 금액, 발주처 상세내용) */}
                  <div className="form-right-panel form-grid-2col">
                    <div className="form-group">
                      <label>프로젝트명</label>
                      <input 
                        type="text" 
                        placeholder="프로젝트 이름을 입력하세요" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label>업무명</label>
                      <input 
                        type="text" 
                        placeholder="업무명을 입력하세요" 
                        value={formData.jobName || ''} 
                        onChange={e => setFormData({...formData, jobName: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label>발주처</label>
                      <input 
                        type="text" 
                        placeholder="발주처를 입력하세요" 
                        value={formData.client || ''} 
                        onChange={e => setFormData({...formData, client: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label>금액</label>
                      <input 
                        type="text" 
                        placeholder="금액을 입력하세요 (예: 50,000,000)" 
                        value={formData.amount || ''} 
                        onChange={e => setFormData({...formData, amount: e.target.value})} 
                      />
                    </div>
                    <div className="form-group col-span-2">
                      <label>배경 및 목적</label>
                      <textarea 
                        placeholder="프로젝트의 배경 및 추진 목적을 입력하세요" 
                        value={formData.description || ''} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="form-textarea"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 작업 상태 및 진행률 그룹 (가로 1행 정렬) */}
              <div className="form-section-group status-progress-group">
                <div className="form-row-flex">
                  <div className="form-group status-select-field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                      <label>작업 진행상태</label>
                      {(formData.status === 'completed' || formData.status === '완료') && (
                        <label className="draft-confirmed-label">
                          <input 
                            type="checkbox" 
                            checked={formData.draftConfirmed || false} 
                            onChange={e => setFormData({...formData, draftConfirmed: e.target.checked})} 
                          />
                          <span>최근작업</span>
                        </label>
                      )}
                    </div>
                    <select 
                      value={formData.status || 'ongoing'} 
                      onChange={e => {
                        const newStatus = e.target.value as any;
                        const isOngoing = newStatus === 'ongoing' || newStatus === '진행';
                        setFormData({
                          ...formData,
                          status: newStatus,
                          isRepresentative: isOngoing ? formData.isRepresentative : false
                        });
                      }}
                    >
                      <option value="ongoing">진행중 (ongoing)</option>
                      <option value="waiting">대기 (waiting)</option>
                      <option value="holding">홀딩 (holding)</option>
                      <option value="regular">상시 (regular)</option>
                      <option value="completed">완료 (completed)</option>
                    </select>
                  </div>

                  <div className="form-group cell-checkbox-field">
                    <label>작업 셀</label>
                    <div className="checkbox-group">
                      {['UX셀', '영상셀', '편집셀'].map(cell => (
                        <label key={cell} className="checkbox-label">
                          <input type="checkbox" checked={formData.taskCell?.includes(cell) || false} 
                                 onChange={e => {
                                   const newCells = e.target.checked 
                                     ? [...(formData.taskCell || []), cell] 
                                     : (formData.taskCell || []).filter(c => c !== cell);
                                   setFormData({...formData, taskCell: newCells});
                                 }} />
                          {cell}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group progress-slider-field">
                    <label>작업 진행률(%)</label>
                    <div className="progress-input-group">
                      <input type="number" value={formData.progress || 0} onChange={e => setFormData({...formData, progress: Number(e.target.value)})} min="0" max="100" className="progress-number" />
                      <input type="range" value={formData.progress || 0} onChange={e => setFormData({...formData, progress: Number(e.target.value)})} min="0" max="100" step={5} className="progress-slider" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 일정 및 담당자 그룹 (좌우 2단 배치) */}
              <div className="form-section-group schedule-assignee-group">
                <div className="form-schedule-assignee-split">
                  {/* 좌측 영역: 일정 세로 정렬 */}
                  <div className="schedule-left-col">
                    <div className="form-group">
                      <label>마감일 <span style={{ fontWeight: 500, fontSize: '12px' }}>(직접 입력 YYYY-MM-DD)</span></label>
                      <input type="text" placeholder="예: 2024-12-31 또는 상시" value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>시작일</label>
                      <input type="date" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>종료일</label>
                      <input type="date" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                  </div>

                  {/* 우측 영역: PM 및 담당자 선택 */}
                  <div className="assignee-right-col">
                    <div className="form-group pm-select-field">
                      <label>PM</label>
                      <div className="multi-select-dropdown" ref={pmDropdownRef}>
                        <div className={`multi-select-header ${openPm ? 'active' : ''}`} onClick={() => setOpenPm(!openPm)}>
                          <div className="selected-names">
                            {formData.pm ? formData.pm : 'PM을 선택하세요...'}
                          </div>
                          <ChevronDown size={18} className={`dropdown-arrow ${openPm ? 'open' : ''}`} />
                        </div>
                        {openPm && (
                          <div className="multi-select-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px' }}>
                            {(() => {
                              const sorted = [...teamMembers].sort(sortTeamMembers);
                              const leaders = sorted.filter(tm => tm.role?.includes('팀장') || tm.cell === '기타');
                              const uxMembers = sorted.filter(tm => tm.cell === 'UX셀' && !tm.role?.includes('팀장'));
                              const videoMembers = sorted.filter(tm => tm.cell === '영상셀' && !tm.role?.includes('팀장'));
                              const editMembers = sorted.filter(tm => tm.cell === '편집셀' && !tm.role?.includes('팀장'));

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                  {/* 1. 팀장 섹션 (맨 위에 가로지르며 단독 표시) */}
                                  {leaders.length > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                      borderBottom: '1px solid #eae8e2',
                                      paddingBottom: '8px'
                                    }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', padding: '0 4px', letterSpacing: '0.5px' }}>[팀장]</div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                        {leaders.map(tm => (
                                          <label key={`pm-${tm.id}`} className="checkbox-label dropdown-item">
                                            <input 
                                              type="radio" 
                                              name="projectPm" 
                                              checked={formData.pm === tm.name} 
                                              onChange={() => {
                                                setFormData({...formData, pm: tm.name});
                                                setOpenPm(false);
                                              }} 
                                              style={{ marginRight: '6px' }}
                                            />
                                            {tm.name}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* 2. 셀별 3컬럼 세로 정렬 섹션 */}
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '12px',
                                    alignItems: 'start'
                                  }}>
                                    {/* UX셀 컬럼 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', borderBottom: '1px solid #eae8e2', padding: '4px', marginBottom: '4px', letterSpacing: '0.5px' }}>[UX셀]</div>
                                      {uxMembers.map(tm => (
                                        <label key={`pm-${tm.id}`} className="checkbox-label dropdown-item">
                                          <input 
                                            type="radio" 
                                            name="projectPm" 
                                            checked={formData.pm === tm.name} 
                                            onChange={() => {
                                              setFormData({...formData, pm: tm.name});
                                              setOpenPm(false);
                                            }} 
                                            style={{ marginRight: '6px' }}
                                          />
                                          {tm.name}
                                        </label>
                                      ))}
                                    </div>

                                    {/* 영상셀 컬럼 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', borderBottom: '1px solid #eae8e2', padding: '4px', marginBottom: '4px', letterSpacing: '0.5px' }}>[영상셀]</div>
                                      {videoMembers.map(tm => (
                                        <label key={`pm-${tm.id}`} className="checkbox-label dropdown-item">
                                          <input 
                                            type="radio" 
                                            name="projectPm" 
                                            checked={formData.pm === tm.name} 
                                            onChange={() => {
                                              setFormData({...formData, pm: tm.name});
                                              setOpenPm(false);
                                            }} 
                                            style={{ marginRight: '6px' }}
                                          />
                                          {tm.name}
                                        </label>
                                      ))}
                                    </div>

                                    {/* 편집셀 컬럼 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', borderBottom: '1px solid #eae8e2', padding: '4px', marginBottom: '4px', letterSpacing: '0.5px' }}>[편집셀]</div>
                                      {editMembers.map(tm => (
                                        <label key={`pm-${tm.id}`} className="checkbox-label dropdown-item">
                                          <input 
                                            type="radio" 
                                            name="projectPm" 
                                            checked={formData.pm === tm.name} 
                                            onChange={() => {
                                              setFormData({...formData, pm: tm.name});
                                              setOpenPm(false);
                                            }} 
                                            style={{ marginRight: '6px' }}
                                          />
                                          {tm.name}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group assignee-select-field">
                      <label>담당자 선택</label>
                      <div className="multi-select-dropdown" ref={assigneeDropdownRef}>
                        <div className={`multi-select-header ${openAssignees ? 'active' : ''}`} onClick={() => setOpenAssignees(!openAssignees)}>
                          <div className="selected-names">
                            {formData.assignees && formData.assignees.length > 0 
                              ? formData.assignees.join(', ') 
                              : '담당자를 선택하세요...'}
                          </div>
                          <ChevronDown size={18} className={`dropdown-arrow ${openAssignees ? 'open' : ''}`} />
                        </div>
                        {openAssignees && (
                          <div className="multi-select-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px' }}>
                            {(() => {
                              const sorted = [...teamMembers].sort(sortTeamMembers);
                              const leaders = sorted.filter(tm => tm.role?.includes('팀장') || tm.cell === '기타');
                              const uxMembers = sorted.filter(tm => tm.cell === 'UX셀' && !tm.role?.includes('팀장'));
                              const videoMembers = sorted.filter(tm => tm.cell === '영상셀' && !tm.role?.includes('팀장'));
                              const editMembers = sorted.filter(tm => tm.cell === '편집셀' && !tm.role?.includes('팀장'));

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                  {/* 1. 팀장 섹션 (맨 위에 가로지르며 단독 표시) */}
                                  {leaders.length > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                      borderBottom: '1px solid #eae8e2',
                                      paddingBottom: '8px'
                                    }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', padding: '0 4px', letterSpacing: '0.5px' }}>[팀장]</div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                        {leaders.map(tm => (
                                          <label key={tm.id} className="checkbox-label dropdown-item">
                                            <input type="checkbox" checked={formData.assignees?.includes(tm.name) || false} 
                                                   onChange={e => {
                                                     const newAssignees = e.target.checked 
                                                       ? [...(formData.assignees || []), tm.name] 
                                                       : (formData.assignees || []).filter(name => name !== tm.name);
                                                     setFormData({...formData, assignees: newAssignees});
                                                   }} />
                                            {tm.name}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* 2. 셀별 3컬럼 세로 정렬 섹션 */}
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '12px',
                                    alignItems: 'start'
                                  }}>
                                    {/* UX셀 컬럼 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', borderBottom: '1px solid #eae8e2', padding: '4px', marginBottom: '4px', letterSpacing: '0.5px' }}>[UX셀]</div>
                                      {uxMembers.map(tm => (
                                        <label key={tm.id} className="checkbox-label dropdown-item">
                                          <input type="checkbox" checked={formData.assignees?.includes(tm.name) || false} 
                                                 onChange={e => {
                                                   const newAssignees = e.target.checked 
                                                     ? [...(formData.assignees || []), tm.name] 
                                                     : (formData.assignees || []).filter(name => name !== tm.name);
                                                   setFormData({...formData, assignees: newAssignees});
                                                 }} />
                                          {tm.name}
                                        </label>
                                      ))}
                                    </div>

                                    {/* 영상셀 컬럼 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', borderBottom: '1px solid #eae8e2', padding: '4px', marginBottom: '4px', letterSpacing: '0.5px' }}>[영상셀]</div>
                                      {videoMembers.map(tm => (
                                        <label key={tm.id} className="checkbox-label dropdown-item">
                                          <input type="checkbox" checked={formData.assignees?.includes(tm.name) || false} 
                                                 onChange={e => {
                                                   const newAssignees = e.target.checked 
                                                     ? [...(formData.assignees || []), tm.name] 
                                                     : (formData.assignees || []).filter(name => name !== tm.name);
                                                   setFormData({...formData, assignees: newAssignees});
                                                 }} />
                                          {tm.name}
                                        </label>
                                      ))}
                                    </div>

                                    {/* 편집셀 컬럼 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8a7d75', borderBottom: '1px solid #eae8e2', padding: '4px', marginBottom: '4px', letterSpacing: '0.5px' }}>[편집셀]</div>
                                      {editMembers.map(tm => (
                                        <label key={tm.id} className="checkbox-label dropdown-item">
                                          <input type="checkbox" checked={formData.assignees?.includes(tm.name) || false} 
                                                 onChange={e => {
                                                   const newAssignees = e.target.checked 
                                                     ? [...(formData.assignees || []), tm.name] 
                                                     : (formData.assignees || []).filter(name => name !== tm.name);
                                                   setFormData({...formData, assignees: newAssignees});
                                                 }} />
                                          {tm.name}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="tag-list" style={{ marginTop: '8px' }}>
                        {formData.assignees?.map((name, i) => (
                          <div key={i} className="tag">
                            {name} 
                            <button type="button" onClick={() => {
                              const newAssignees = (formData.assignees || []).filter(n => n !== name);
                              setFormData({...formData, assignees: newAssignees});
                            }}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 이슈 사항 그룹 */}
              <div className="form-section-group issue-section">
                <div className="form-group col-span-2">
                  <div className="issue-header-row">
                    <label>이슈 사항</label>
                    {!isAddingIssue && (
                      <button type="button" onClick={() => setIsAddingIssue(true)} className="add-issue-toggle-btn">
                        + 이슈 추가
                      </button>
                    )}
                  </div>

                  {isAddingIssue && (
                    <div className="issue-input-box">
                      <div className="issue-input-fields">
                        <input 
                          type="text" 
                          placeholder="이슈 제목을 입력하세요..." 
                          value={issueInput} 
                          onChange={e => setIssueInput(e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddIssue();
                            }
                          }}
                          autoFocus
                        />
                        <RichTextEditor
                          value={issueDetailInput}
                          onChange={setIssueDetailInput}
                          placeholder="상세 내용을 입력하세요 (선택 사항)..."
                          onCtrlEnter={handleAddIssue}
                        />
                      </div>
                      <div className="issue-input-actions">
                        <button type="button" onClick={() => { setIsAddingIssue(false); setIssueInput(''); setIssueDetailInput(''); }} className="cancel-issue-btn">취소</button>
                        <button type="button" onClick={handleAddIssue} className="save-issue-btn" disabled={!issueInput.trim()}>추가하기</button>
                      </div>
                    </div>
                  )}
                  <div className="tag-list issue-tag-list">
                    {formData.issues?.map((a, i) => {
                      const text = typeof a === 'string' ? a : a.text;
                      const isPinned = typeof a === 'object' && a.isPinned;
                      return (
                        <div key={i} className={`tag issue-tag ${isPinned ? 'pinned' : ''}`}>
                          {editingIssueIndex === i ? (
                            <div className="issue-input-box" style={{ width: '100%', margin: '8px 0', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                              <div className="issue-input-fields">
                                <input 
                                  type="text" 
                                  value={editingIssueText} 
                                  onChange={e => setEditingIssueText(e.target.value)} 
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleUpdateIssue();
                                    }
                                  }}
                                  autoFocus
                                  placeholder="이슈 제목을 입력하세요..." 
                                />
                                <RichTextEditor
                                  value={editingIssueDetail}
                                  onChange={setEditingIssueDetail}
                                  placeholder="상세 내용을 입력하세요 (선택 사항)..."
                                  onCtrlEnter={handleUpdateIssue}
                                />
                              </div>
                              <div className="issue-input-actions">
                                <button type="button" onClick={() => setEditingIssueIndex(null)} className="cancel-issue-btn">취소</button>
                                <button type="button" onClick={handleUpdateIssue} className="save-issue-btn" disabled={!editingIssueText.trim()}>저장하기</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="issue-content-row">
                                <span className="issue-text">{text}</span>
                                {typeof a === 'object' && a.detail && (
                                  <span
                                    className="issue-detail-sub"
                                    dangerouslySetInnerHTML={{ __html: a.detail }}
                                  />
                                )}
                              </div>
                              <div className="issue-actions">
                                <button 
                                  type="button" 
                                  className={`pin-btn-small ${(typeof a === 'object' && a.isPinned) ? 'active' : ''}`} 
                                  onClick={() => handlePinIssue(i)} 
                                  title="대시보드 고정"
                                >
                                  <Pin size={12} fill={(typeof a === 'object' && a.isPinned) ? "currentColor" : "none"} />
                                </button>
                                <button type="button" className="edit-btn-small" onClick={() => startEditIssue(i, text, typeof a === 'object' ? a.detail : '')} title="수정">
                                  <Edit2 size={12} />
                                </button>
                                <button type="button" className="del-btn-small" onClick={() => handleRemoveIssue(i)} title="삭제">
                                  <X size={12} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 관련 링크 그룹 */}
              <div className="form-section-group links-section">
                <div className="form-group col-span-2">
                  <div className="issue-header-row">
                    <label>관련 링크</label>
                    <button type="button" className="add-link-btn" onClick={() => setFormData({...formData, relatedLinks: [...(formData.relatedLinks || []), { title: '', url: '' }]})}>
                      + 링크 추가
                    </button>
                  </div>
                  <div className="links-input-list">
                    {(formData.relatedLinks || []).map((link, idx) => {
                      const isObj = typeof link === 'object' && link !== null;
                      const url = isObj ? (link as any).url : (link as string);
                      const title = isObj ? (link as any).title : '';

                      return (
                        <div key={idx} className="link-input-row">
                          <input
                            type="text"
                            placeholder="링크 제목 (예: 피그마, 출처)"
                            value={title}
                            onChange={e => {
                              const newLinks = [...(formData.relatedLinks || [])];
                              if (isObj) {
                                newLinks[idx] = { ...(newLinks[idx] as any), title: e.target.value };
                              } else {
                                newLinks[idx] = { title: e.target.value, url: link };
                              }
                              setFormData({...formData, relatedLinks: newLinks});
                            }}
                            className="link-title-input"
                          />
                          <input
                            type="text"
                            placeholder="https://..."
                            value={url}
                            onChange={e => {
                              const newLinks = [...(formData.relatedLinks || [])];
                              if (isObj) {
                                newLinks[idx] = { ...(newLinks[idx] as any), url: e.target.value };
                              } else {
                                newLinks[idx] = { title: `링크 ${idx + 1}`, url: e.target.value };
                              }
                              setFormData({...formData, relatedLinks: newLinks});
                            }}
                            className="link-url-input"
                          />
                          <button type="button" className="link-delete-btn" onClick={() => {
                            const newLinks = [...(formData.relatedLinks || [])];
                            newLinks.splice(idx, 1);
                            setFormData({...formData, relatedLinks: newLinks});
                          }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {(!formData.relatedLinks || formData.relatedLinks.length === 0) && (
                    <div className="no-links-text">
                      등록된 관련 링크가 없습니다. 우측 추가 버튼을 눌러 링크를 등록하세요.
                    </div>
                  )}
                </div>
              </div>

              <hr className="form-divider" />

            <div className="form-group thumbnail-select-section">
              <label>미리보기 이미지 지정 (선택 시 지정)</label>
              <div className="thumbnail-grid">
                {(() => {
                  const allImages = [
                    ...(formData.versions?.flatMap(v => v.drafts) || []),
                    ...(formData.tasks?.flatMap(t => t.attachments) || [])
                  ].filter(url => url && isImageAttachmentUrl(url));
                  
                  const uniqueImages = Array.from(new Set(allImages));
                  
                  if (uniqueImages.length === 0) return <div className="no-images-text">등록된 이미지가 없습니다.</div>;
                  
                  return uniqueImages.map((url, i) => (
                    <div key={i} 
                         className={`thumbnail-item ${formData.thumbnail === url ? 'selected' : ''}`}
                         onClick={() => setFormData({...formData, thumbnail: formData.thumbnail === url ? '' : url})}>
                      <img src={url} alt="thumbnail-option" />
                      {formData.thumbnail === url && <div className="selected-badge"><Check size={12} /></div>}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          <div className="edit-modal-footer">
              <button className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>취소</button>
              <button className="save-btn" onClick={handleSaveProject}>
                {modalMode === 'edit' ? '업무 정보 수정' : '프로젝트 생성하기'}
              </button>
            </div>
          </div>
        </div>
      )})()}


      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="project-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="context-menu-item" onClick={() => handleEditFromMenu(contextMenu.projectId)}>
            <Edit2 size={14} /> 수정
          </button>
          <button className="context-menu-item delete" onClick={() => handleDeleteProject(contextMenu.projectId)}>
            <Trash2 size={14} /> 삭제
          </button>
        </div>
      )}

      {taskContextMenu && (
        <div 
          className="task-context-menu"
          style={{ 
            position: 'fixed', 
            top: taskContextMenu.y, 
            left: taskContextMenu.x,
            zIndex: 10000
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="task-cm-item" onClick={() => handleEditTask(taskContextMenu.taskId)}>
            <Edit2 size={14} /> 수정
          </div>
          <div className="task-cm-item delete" onClick={() => handleDeleteTask(taskContextMenu.taskId)}>
            <Trash2 size={14} /> 삭제
          </div>
        </div>
      )}
      {!selectedId && !isTimelineView && (
        <div className="fixed-skill-info-wrapper">
          <div className="fixed-skill-trigger">
            <Smile size={28} />
          </div>
          <div className="fixed-skill-tooltip">
            <div className="skill-tooltip-title">새로운 스킬 UP</div>
            <div className="skill-tooltip-content">
              실시간 React 전환 및 파이어베이스 연동 작업이 완료되었습니다.<br />
              대시보드 고도화 기능을 확인해보세요!
            </div>
          </div>
        </div>
      )}
      {/* 툴팁 포탈: overflow: hidden 무시를 위해 body 레벨에서 렌더링 */}
      {activeIssueTooltipId && activeTooltipPos && createPortal(
        (() => {
          const [projId, issueIdxStr] = activeIssueTooltipId.split(':');
          const project = projects.find(p => p.id === projId);
          if (!project || !project.issues) return null;
          
          let targetIssue: any = null;
          if (issueIdxStr !== undefined) {
            // 프로젝트 카드에서 클릭한 특정 이슈 (인덱스 기반)
            const pinnedOrRecentIssues = (() => {
              const issues = project.issues || [];
              const pinned = issues.filter((i): i is any => typeof i === 'object' && !!i.isPinned);
              if (pinned.length > 0) return pinned;
              
              const recent = [...issues]
                .filter(i => i.date && new Date(i.date) >= thisWeekStart)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              if (recent.length > 0) return [recent[0]];
              
              const allSorted = [...issues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              return allSorted;
            })();
            targetIssue = pinnedOrRecentIssues[parseInt(issueIdxStr)];
          } else {
            // 폴백: 예기치 않은 경우 최신 이슈
            targetIssue = [...project.issues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          }
            
          if (!targetIssue || !targetIssue.detail) return null;

          const latestIssue = targetIssue; // 변수명 유지용

          return (
            <div 
              className={`custom-issue-tooltip ${activeTooltipPos.side}-side fixed-pos`} 
              style={{ 
                position: 'fixed',
                top: `${activeTooltipPos.top}px`,
                left: `${activeTooltipPos.left}px`,
                transform: `translate(${activeTooltipPos.side === 'left' ? '-100%' : '0'}, -50%)`,
                zIndex: 9999
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tooltip-header">
                이슈 정보
                 {/* {latestIssue.date && <span className="tooltip-date">({latestIssue.date})</span>} */}
              </div>
              <div className="tooltip-title" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="issue-icon" style={{ width: '16px', height: '16px', fontSize: '11px' }}>!</span>
                {latestIssue.text}
              </div>
              {latestIssue.detail && (
                <div className="tooltip-body">
                  <div className="tooltip-detail-label">상세 내용</div>
                  <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: latestIssue.detail }} />
                </div>
              )}
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
};

export default App;
