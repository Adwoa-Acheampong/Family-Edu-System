import React from 'react';
import { User } from '../types';
import { ArchitectDashboard } from './ArchitectDashboard';
import { AnalystDashboard } from './AnalystDashboard';
import { Dashboard as PersonaDashboards } from './Dashboards';

/** Live API dashboards for Aba + Kobby; other personas keep interactive UIs. */
export function Dashboard({ user }: { user: User }) {
  if (user.id === 'aba') {
    return <ArchitectDashboard user={user} />;
  }
  if (user.id === 'kobby') {
    return <AnalystDashboard user={user} />;
  }
  return <PersonaDashboards user={user} />;
}
