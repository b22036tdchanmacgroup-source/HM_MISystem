export type ProjectStatus = 'ongoing' | 'upcoming' | 'regular' | 'always' | 'issue' | 'completed' | '진행' | '예정' | '완료' | '상시' | '이슈' | '보류' | '대기' | 'waiting' | 'standby' | 'holding' | '홀딩' | '대기/홀딩';


export type TaskItem = {
  id?: string;
  text: string;
  attachments?: string[];
  progress?: number;
  startDate?: string;
  endDate?: string;
  date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  description?: string;
  link?: string;
};

export type ProjectVersion = {
  name: string;
  tasks: string[];
  drafts: string[];
};

export type IssueItem = {
  text: string;
  detail?: string;
  date: string;
  isPinned?: boolean;
};

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  taskCell: string[];
  collabTeam?: string;
  collabManager?: string;
  deadline: string;
  startDate: string;
  endDate: string;
  progress: number;
  pm: string;
  assignees: string[];
  issues: IssueItem[];
  tasks: TaskItem[];
  versions?: ProjectVersion[];
  draftConfirmed: boolean;
  selectedDrafts?: string[];
  uid: string;
  createdAt: string;
  description?: string;
  hold?: boolean;
  wait?: boolean;
  thumbnail?: string;
  relatedLinks?: (string | { title: string; url: string })[];
  isRepresentative?: boolean;
  client?: string;
  amount?: string;
  builder?: string;
  jobName?: string;
};

export type TeamMember = {
  id: string;
  index: number;
  name: string;
  rank: string;
  role: string;
  cell: string;
  contact: string;
  email: string;
  photo?: string;
};

export type DashboardStats = {
  ongoingCount: number;
  upcomingCount: number;
  regularCount: number;
  issueCount: number;
};

export const DUMMY = 'dummy';
