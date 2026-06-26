import type { Project, TaskItem, TeamMember } from '../types';

// ─────────────────────────────────────────────
// 팀원 정렬
// 팀장 최우선 → 셀별(UX→영상→편집→기타) → 셀장 → 직급 → index → 이름
// ─────────────────────────────────────────────
export const sortTeamMembers = (a: TeamMember, b: TeamMember): number => {
  const isLeaderA = a.role?.includes('팀장') || a.cell === '기타';
  const isLeaderB = b.role?.includes('팀장') || b.cell === '기타';
  if (isLeaderA && !isLeaderB) return -1;
  if (!isLeaderA && isLeaderB) return 1;

  const cellOrder: Record<string, number> = { 'UX셀': 1, '영상셀': 2, '편집셀': 3, '기타': 4 };
  const cellA = cellOrder[a.cell] || 99;
  const cellB = cellOrder[b.cell] || 99;
  if (cellA !== cellB) return cellA - cellB;

  const isCell장A = a.role?.includes('셀장');
  const isCell장B = b.role?.includes('셀장');
  if (isCell장A && !isCell장B) return -1;
  if (!isCell장A && isCell장B) return 1;

  const rankOrder: Record<string, number> = {
    '수석연구원': 1, '책임연구원': 2, '선임연구원': 3, '연구원': 4,
  };
  const rankA = rankOrder[a.rank] || 99;
  const rankB = rankOrder[b.rank] || 99;
  if (rankA !== rankB) return rankA - rankB;

  if (a.index !== undefined && b.index !== undefined && a.index !== b.index) {
    return a.index - b.index;
  }
  return a.name.localeCompare(b.name);
};

// ─────────────────────────────────────────────
// 첨부 URL 타입 판별
// ─────────────────────────────────────────────
export const IMAGE_URL_RE = /\.(jpeg|jpg|gif|png|webp|svg)$/i;
export const VIDEO_URL_RE = /\.(mp4|webm|ogg|mov|m4v|avi|mkv|wmv)$/i;
export const PDF_URL_RE   = /\.pdf$/i;

/** 쿼리/해시 제거 후 순수 경로 반환 (예: file.jpg?alt=media → file.jpg) */
export function attachmentUrlPath(url: string): string {
  return url.split('?')[0].split('#')[0];
}

export function isImageAttachmentUrl(url: string): boolean {
  return IMAGE_URL_RE.test(attachmentUrlPath(url));
}

export function isVideoAttachmentUrl(url: string): boolean {
  return VIDEO_URL_RE.test(attachmentUrlPath(url));
}

export function isPdfAttachmentUrl(url: string): boolean {
  return PDF_URL_RE.test(attachmentUrlPath(url));
}

// ─────────────────────────────────────────────
// 업무 배열 헬퍼
// ─────────────────────────────────────────────

/** tasks 배열에서 객체 업무만 골라 가장 마지막 항목 반환 */
export function getLatestObjectTask(tasks: Project['tasks'] | undefined): TaskItem | null {
  const list = tasks || [];
  const objectTasks = list.filter((t): t is TaskItem => typeof t === 'object' && t !== null);
  return objectTasks.length ? objectTasks[objectTasks.length - 1] : null;
}

/** 최신 업무 1건의 첨부파일 URL 전체 (슬라이드 트랙 소스) */
export function getViewerImageUrlsForLatestTask(tasks: Project['tasks'] | undefined): string[] {
  const latest = getLatestObjectTask(tasks);
  if (!latest?.attachments?.length) return [];
  return latest.attachments;
}

// ─────────────────────────────────────────────
// 프로젝트 상태 판별 & 정렬
// ─────────────────────────────────────────────

/** 완료일이 오늘 기준 10일 이내인지 확인 */
export const isCompletedWithin10Days = (p: Project): boolean => {
  if (p.status !== 'completed' && p.status !== '완료') return false;
  if (!p.endDate) return false;
  const [y, m, d] = p.endDate.split('-').map(Number);
  if (!y || !m || !d) return false;
  const endT = new Date(y, m - 1, d).getTime();
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  return endT >= today - 10 * 24 * 3600 * 1000;
};

/** 카드 정렬 우선순위: 1=진행 2=상시 3=최근완료 4=대기/홀딩 5=완료 */
export const getSortPriority = (p: Project): number => {
  const isHoldOrWait =
    p.hold || p.wait ||
    ['holding', '홀딩', 'waiting', 'standby', 'upcoming', '예정', '대기/홀딩'].includes(p.status);

  if (!isHoldOrWait && ['ongoing', '진행', 'issue', '이슈'].includes(p.status)) return 1;
  if (['always', 'regular', '상시'].includes(p.status)) return 2;
  if (isCompletedWithin10Days(p)) return 3;
  if (isHoldOrWait) return 4;
  if (['completed', '완료'].includes(p.status)) return 5;
  return 99;
};

// ─────────────────────────────────────────────
// 팀원 업무 상태 표시용
// ─────────────────────────────────────────────

/** 팀원 툴팁/배지에 쓰이는 상태 색상 */
export const getMemberProjectStatusColor = (p: Project, isStatic?: boolean): string => {
  if (['always', 'regular', '상시'].includes(p.status))
    return isStatic ? '#11824a' : '#a8dec0';
  if (p.hold || ['holding', '홀딩'].includes(p.status))
    return isStatic ? '#d97706' : '#fbd38d';
  if (p.wait || ['waiting', 'standby', 'upcoming', '예정'].includes(p.status))
    return isStatic ? '#d97706' : '#fbd38d';
  return isStatic ? '#11824a' : '#a8dec0';
};

/** 팀원 툴팁/배지에 쓰이는 상태 텍스트 */
export const getMemberProjectStatusText = (p: Project): string => {
  if (['always', 'regular', '상시'].includes(p.status)) return '상시';
  if (p.hold || ['holding', '홀딩'].includes(p.status)) return '홀딩';
  if (p.wait || ['waiting', 'standby', 'upcoming', '예정'].includes(p.status)) return '대기';
  return p.progress !== undefined ? `${p.progress}%` : '진행';
};
