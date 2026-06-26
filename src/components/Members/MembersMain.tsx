import React from 'react';
import type { TeamMember, Project } from '../../types';

interface MembersMainProps {
  teamMembers: TeamMember[];
  projects: Project[];
}

const MembersMain: React.FC<MembersMainProps> = (_props) => {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingBottom: 'calc(1031 / 1920 * 100%)',
      height: 0,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <iframe
        src={`${import.meta.env.BASE_URL}members.html`}
        title="인원현황"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />
    </div>
  );
};

export default MembersMain;
