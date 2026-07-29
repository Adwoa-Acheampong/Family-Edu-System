import React from 'react';
import { User } from '../types';
import { ArchitectDashboard } from './ArchitectDashboard';
import { AnalystDashboard } from './AnalystDashboard';
import { MasterDashboard } from './MasterDashboard';
import { Dashboard as PersonaDashboards } from './Dashboards';

/**
 * Live API dashboards:
 * - aba → system telemetry
 * - kobby → gamified quests from assignments API
 * - badu → instructional lessons from assignments API
 * Others keep interactive age-appropriate UIs (games / stories).
 */
export function Dashboard({ user }: { user: User }) {
  switch (user.id) {
    case 'aba':
      return <ArchitectDashboard user={user} />;
    case 'kobby':
      return <AnalystDashboard user={user} />;
    case 'badu':
      return <MasterDashboard user={user} />;
    default:
      return <PersonaDashboards user={user} />;
  }
}
