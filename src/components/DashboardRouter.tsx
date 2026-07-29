import React from 'react';
import { User } from '../types';
import { ArchitectDashboard } from './ArchitectDashboard';
import { AnalystDashboard } from './AnalystDashboard';
import { MasterDashboard } from './MasterDashboard';
import { YoungLearnerShell } from './YoungLearnerShell';

/**
 * Live API coverage:
 * - aba → system telemetry
 * - kobby → gamified API quests
 * - badu → instructional API lessons
 * - pappy, seth, kweku, shee → play UI + API quest strip
 */
export function Dashboard({ user }: { user: User }) {
  switch (user.id) {
    case 'aba':
      return <ArchitectDashboard user={user} />;
    case 'kobby':
      return <AnalystDashboard user={user} />;
    case 'badu':
      return <MasterDashboard user={user} />;
    case 'pappy':
    case 'seth':
    case 'kweku':
    case 'shee':
      return <YoungLearnerShell user={user} />;
    default:
      return <YoungLearnerShell user={user} />;
  }
}
