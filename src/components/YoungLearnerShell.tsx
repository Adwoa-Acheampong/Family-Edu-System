import React from 'react';
import { User } from '../types';
import { QuestStrip } from './QuestStrip';
import { Dashboard as PersonaDashboards } from './Dashboards';

/** Games/stories UI + live API quest strip on top. */
export function YoungLearnerShell({ user }: { user: User }) {
  return (
    <div className="min-h-full">
      <QuestStrip user={user} />
      <PersonaDashboards user={user} />
    </div>
  );
}
