import React, { useState, useMemo } from 'react';
import type { Project, TeamMember } from '../../types';
import { getMemberProjectStatusColor, getMemberProjectStatusText } from '../../utils/projectUtils';

// ─────────────────────────────────────────────
// 팀원 아바타
// 연락처 기반 로컬 이미지 → photo URL → 이름 첫 글자 순으로 폴백
// ─────────────────────────────────────────────
export const TeamMemberAvatar: React.FC<{ m: TeamMember; className?: string }> = ({ m, className }) => {
  const [imgError, setImgError] = useState(false);
  const cleanContact = m.contact?.replace(/[^0-9]/g, '');
  const photoPath =
    m.photo ||
    (cleanContact ? `/images/team/${cleanContact}.jpg` : null);

  if (photoPath && !imgError) {
    return (
      <img
        src={photoPath}
        alt={m.name}
        className={className || 'avatar-img'}
        onError={() => setImgError(true)}
      />
    );
  }
  return <>{m.name[0]}</>;
};

// ─────────────────────────────────────────────
// 팀원 참여 업무 툴팁
// ─────────────────────────────────────────────
interface MemberTooltipProps {
  memberName: string;
  projects: Project[];
  isStatic?: boolean;
  activeProjectId?: string | null;
  onProjectClick?: (id: string | null) => void;
}

export const MemberTooltip: React.FC<MemberTooltipProps> = ({
  memberName,
  projects,
  isStatic,
  activeProjectId,
  onProjectClick,
}) => {
  const memberProjects = useMemo(
    () =>
      projects
        .filter(p => p.pm === memberName || p.assignees?.includes(memberName))
        .filter(p => !['completed', '완료', '보류'].includes(p.status)),
    [memberName, projects]
  );

  if (memberProjects.length === 0) return null;

  return (
    <div className={`member-tooltip ${isStatic ? 'is-static' : ''}`}>
      <div className="tooltip-header">참여 중인 업무 ({memberProjects.length})</div>
      <div className="tooltip-list">
        {memberProjects.map((p, i) => {
          const statusColor = getMemberProjectStatusColor(p, isStatic);
          const statusText = getMemberProjectStatusText(p);
          const isActive = activeProjectId === p.id;

          return (
            <div
              key={`${p.id}-${i}`}
              className={`tooltip-item ${isActive ? 'active' : ''}`}
              onClick={e => {
                e.stopPropagation();
                onProjectClick?.(isActive ? null : p.id);
              }}
              style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '100%',
                gap: '4px',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <div className="tooltip-dot" style={{ flexShrink: 0 }} />
                  <div
                    className="tooltip-name"
                    style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}
                    title={`${p.builder ? `[${p.builder}] ` : ''}${p.name}${p.jobName ? ` | ${p.jobName}` : ''}`}
                  >
                    {p.builder && <span style={{ fontWeight: 400 }}>{`[${p.builder}] `}</span>}
                    <span>{p.name}</span>
                    {p.jobName && <span style={{ fontWeight: 400, opacity: 0.7 }}>{` | ${p.jobName}`}</span>}
                  </div>
                </div>
                <span
                  className="tooltip-status-badge"
                  style={{
                    color: statusColor,
                    border: `1px solid ${statusColor}40`,
                    backgroundColor: `${statusColor}15`,
                    fontSize: '11px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}
                >
                  {statusText}
                </span>
              </div>

              {isActive && (
                <div
                  className="tooltip-task-members"
                  style={{
                    fontSize: '12px',
                    color: isStatic ? '#333' : '#a8dec0',
                    paddingLeft: '14px',
                    opacity: 0.95,
                    fontWeight: '600',
                    lineHeight: '1.4',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'rgba(33,102,71,0.1)', paddingLeft: '6px' }}>
                    <span>• PM: <strong style={{ color: isStatic ? '#064b36' : '#fff' }}>{p.pm || '없음'}</strong></span>
                    <span>• 담당자: <strong style={{ color: isStatic ? '#064b36' : '#fff' }}>{p.assignees?.length ? p.assignees.join(', ') : '없음'}</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberTooltip;
