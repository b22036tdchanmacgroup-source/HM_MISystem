import { useState } from 'react';
import type { Project, TeamMember } from '../types';

export function useFirebaseData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers] = useState<TeamMember[]>([]);

  return { projects, setProjects, teamMembers, loading: false };
}
