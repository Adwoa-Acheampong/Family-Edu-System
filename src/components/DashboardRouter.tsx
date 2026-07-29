import React from 'react';
import { User } from '../types';
import { ArchitectDashboard } from './ArchitectDashboard';
import { Dashboard as PersonaDashboards } from './Dashboards';

/** Routes Aba to live telemetry; other personas keep their interactive dashboards. */
export function Dashboard({ user }: { user: User }) {
  if (user.id === 'aba') {
    return <ArchitectDashboard user={user} />;
  }
  return <PersonaDashboards user={user} />;
}
